const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');

const app = express();
const PORT = Number(process.env.PORT) || 3010;

const CODE_EXPIRES_MINUTES = 10;
const RESEND_DELAY_SECONDS = 30;
const MAX_VERIFY_ATTEMPTS = 5;
const REGISTRATION_ERROR_MESSAGE = 'Проблема с регистрацией. Попробуйте снова.';
const USER_TOKEN_EXPIRES_SECONDS = Number(process.env.JWT_EXPIRES_SECONDS) || 60 * 60 * 24 * 7;
const JWT_SECRET = process.env.JWT_SECRET || process.env.ADMIN_TOKEN_SECRET || 'dev_jwt_secret_change_me';
const ALLOWED_PROFILE_AVATARS = [
  '/uploads/avatars/orion-avatar-blue.png',
  '/uploads/avatars/orion-avatar-green.png',
  '/uploads/avatars/orion-avatar-orange.png',
  '/uploads/avatars/orion-avatar-red.png',
  '/uploads/avatars/orion-avatar-purple.png'
];

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'postgres',
  password: process.env.DB_PASSWORD || '1234',
  port: Number(process.env.DB_PORT) || 5432,
  options: `-c search_path=${process.env.DB_SCHEMA || 'oriontour'}`
});

app.use(cors());
app.use(express.json());


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    servername: 'smtp.gmail.com'
  },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 15000
});

function normalizeEmail(email = '') {
  return email.trim().toLowerCase();
}

function generateCode() {
  return crypto.randomInt(1000, 10000).toString();
}

function hashCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function isValidEmail(email = '') {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function createJwtToken(payload, expiresInSeconds = USER_TOKEN_EXPIRES_SECONDS) {
  return jwt.sign(payload, JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: expiresInSeconds
  });
}

function verifyJwtToken(token = '') {
  try {
    return jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256']
    });
  } catch {
    return null;
  }
}

function getPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    avatar_url: user.avatar_url,
    created_at: user.created_at
  };
}

function createUserToken(user) {
  return createJwtToken({
    sub: String(user.id),
    email: user.email,
    role: 'user'
  });
}

function createAuthResponse(user, message) {
  return {
    message,
    token: createUserToken(user),
    token_type: 'Bearer',
    expires_in: USER_TOKEN_EXPIRES_SECONDS,
    user: getPublicUser(user)
  };
}

function getBearerToken(req) {
  const authHeader = req.headers.authorization || '';

  return authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : '';
}

function requireUser(req, res, next) {
  const token = getBearerToken(req);
  const payload = verifyJwtToken(token);

  if (!payload || payload.role !== 'user' || !payload.sub) {
    return res.status(401).json({
      message: 'Необходимо войти в аккаунт'
    });
  }

  req.authUser = {
    id: String(payload.sub),
    email: payload.email || ''
  };

  return next();
}

function requireUserOwner(req, res, next) {
  if (String(req.params.userId) !== req.authUser.id) {
    return res.status(403).json({
      message: 'Нет доступа к данным другого пользователя'
    });
  }

  return next();
}

const ADMIN_TOKEN_EXPIRES_MS = 1000 * 60 * 60 * 8;

function createAdminToken() {
  const payload = {
    role: 'admin',
    exp: Date.now() + ADMIN_TOKEN_EXPIRES_MS
  };

  const encodedPayload = Buffer
    .from(JSON.stringify(payload))
    .toString('base64url');

  const signature = crypto
    .createHmac('sha256', process.env.ADMIN_TOKEN_SECRET || 'dev_admin_secret')
    .update(encodedPayload)
    .digest('base64url');

  return `${encodedPayload}.${signature}`;
}

function verifyAdminToken(token = '') {
  try {
    const [encodedPayload, signature] = token.split('.');

    if (!encodedPayload || !signature) {
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.ADMIN_TOKEN_SECRET || 'dev_admin_secret')
      .update(encodedPayload)
      .digest('base64url');

    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      return false;
    }

    const payload = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8')
    );

    if (payload.role !== 'admin') {
      return false;
    }

    if (!payload.exp || payload.exp < Date.now()) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : '';

  if (!verifyAdminToken(token)) {
    return res.status(401).json({
      message: 'Нет доступа'
    });
  }

  next();
}

async function deleteExpiredCodes() {
  await pool.query(`DELETE FROM registration_codes WHERE expires_at < NOW()`);
}

async function sendVerificationEmail(to, code) {
  return transporter.sendMail({
    from: `"${process.env.SMTP_FROM_NAME || 'Orion Tour'}" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Код подтверждения регистрации',
    text: `Ваш код подтверждения: ${code}. Код действует ${CODE_EXPIRES_MINUTES} минут.`
  });
}

(async () => {
  try {
    await transporter.verify();
    console.log('SMTP ready');
  } catch (error) {
    console.error('SMTP verify error:', error.message);
  }
})();

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    return res.json({ ok: true, message: 'Server is running' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, message: 'Database error' });
  }
});

app.post('/api/auth/register/send-code', async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: REGISTRATION_ERROR_MESSAGE });
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: REGISTRATION_ERROR_MESSAGE });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: REGISTRATION_ERROR_MESSAGE });
    }

    await deleteExpiredCodes();

    const existingUser = await pool.query(
      `SELECT id FROM users WHERE email = $1`,
      [normalizedEmail]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: REGISTRATION_ERROR_MESSAGE });
    }

    const pendingCode = await pool.query(
      `SELECT resend_available_at FROM registration_codes WHERE email = $1`,
      [normalizedEmail]
    );

    if (pendingCode.rows.length > 0) {
      const resendAvailableAt = new Date(pendingCode.rows[0].resend_available_at);
      const now = new Date();

      if (resendAvailableAt > now) {
        const secondsLeft = Math.ceil((resendAvailableAt - now) / 1000);

        return res.status(429).json({
          message: `Отправить новый код через ${secondsLeft} сек`,
          secondsLeft
        });
      }
    }

    const code = generateCode();
    const codeHash = hashCode(code);
    const passwordHash = await bcrypt.hash(password, 10);

    await pool.query(
      `
      INSERT INTO registration_codes (
        email,
        password_hash,
        code_hash,
        expires_at,
        resend_available_at,
        attempts
      )
      VALUES (
        $1,
        $2,
        $3,
        NOW() + INTERVAL '10 minutes',
        NOW() + INTERVAL '30 seconds',
        0
      )
      ON CONFLICT (email)
      DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        code_hash = EXCLUDED.code_hash,
        expires_at = NOW() + INTERVAL '10 minutes',
        resend_available_at = NOW() + INTERVAL '30 seconds',
        attempts = 0,
        created_at = CURRENT_TIMESTAMP
      `,
      [normalizedEmail, passwordHash, codeHash]
    );

    try {
      await sendVerificationEmail(normalizedEmail, code);
    } catch (mailError) {
      console.error('Ошибка отправки письма:', mailError.message);

      await pool.query(
        `DELETE FROM registration_codes WHERE email = $1`,
        [normalizedEmail]
      );

      return res.status(500).json({
        message: REGISTRATION_ERROR_MESSAGE
      });
    }

    return res.status(200).json({
      message: 'Код отправлен на почту',
      resendAfter: RESEND_DELAY_SECONDS
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: REGISTRATION_ERROR_MESSAGE
    });
  }
});

app.post('/api/auth/register/verify-code', async (req, res) => {
  const client = await pool.connect();

  try {
    const { email, code } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !code) {
      return res.status(400).json({ message: REGISTRATION_ERROR_MESSAGE });
    }

    await deleteExpiredCodes();

    const codeResult = await client.query(
      `
      SELECT email, password_hash, code_hash, expires_at, attempts
      FROM registration_codes
      WHERE email = $1
      `,
      [normalizedEmail]
    );

    if (codeResult.rows.length === 0) {
      return res.status(400).json({
        message: REGISTRATION_ERROR_MESSAGE
      });
    }

    const row = codeResult.rows[0];

    if (new Date(row.expires_at) < new Date()) {
      await client.query(
        `DELETE FROM registration_codes WHERE email = $1`,
        [normalizedEmail]
      );

      return res.status(400).json({
        message: REGISTRATION_ERROR_MESSAGE
      });
    }

    if (row.attempts >= MAX_VERIFY_ATTEMPTS) {
      return res.status(400).json({
        message: REGISTRATION_ERROR_MESSAGE
      });
    }

    if (hashCode(code.trim()) !== row.code_hash) {
      await client.query(
        `UPDATE registration_codes SET attempts = attempts + 1 WHERE email = $1`,
        [normalizedEmail]
      );

      return res.status(400).json({ message: 'Неверный код' });
    }

    await client.query('BEGIN');

    const existingUser = await client.query(
      `SELECT id FROM users WHERE email = $1`,
      [normalizedEmail]
    );

    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      await client.query(
        `DELETE FROM registration_codes WHERE email = $1`,
        [normalizedEmail]
      );

      return res.status(400).json({
        message: REGISTRATION_ERROR_MESSAGE
      });
    }

    const newUser = await client.query(
      `
      INSERT INTO users (email, password_hash)
      VALUES ($1, $2)
      RETURNING id, email, full_name, avatar_url, created_at
      `,
      [row.email, row.password_hash]
    );

    await client.query(
      `DELETE FROM registration_codes WHERE email = $1`,
      [normalizedEmail]
    );

    await client.query('COMMIT');

    return res.status(201).json(
      createAuthResponse(newUser.rows[0], 'Регистрация успешно завершена')
    );
  } catch (error) {
    await client.query('ROLLBACK').catch(() => { });
    console.error(error);
    return res.status(500).json({
      message: REGISTRATION_ERROR_MESSAGE
    });
  } finally {
    client.release();
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: 'Введите email и пароль' });
    }

    const userResult = await pool.query(
      `
      SELECT id, email, password_hash, full_name, avatar_url, created_at
      FROM users
      WHERE email = $1
      `,
      [normalizedEmail]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({
        message: 'Пользователь с таким email не найден'
      });
    }

    const user = userResult.rows[0];
    const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordCorrect) {
      return res.status(400).json({ message: 'Неверный пароль' });
    }

    return res.status(200).json(
      createAuthResponse(user, 'Вход выполнен успешно')
    );
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Ошибка сервера при входе'
    });
  }
});

app.get('/api/auth/me', requireUser, async (req, res) => {
  try {
    const userResult = await pool.query(
      `
      SELECT id, email, full_name, avatar_url, created_at
      FROM users
      WHERE id = $1
      `,
      [req.authUser.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        message: 'Пользователь больше не существует'
      });
    }

    return res.status(200).json({
      user: getPublicUser(userResult.rows[0])
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Ошибка проверки авторизации'
    });
  }
});

app.get('/api/domestic-categories', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        title AS description,
        image_url
      FROM domestic_categories
      WHERE is_active = TRUE
      ORDER BY sort_order ASC, id ASC
    `);

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Ошибка получения категорий внутреннего туризма' });
  }
});


app.get('/api/popular-tours', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        t.id,
        t.title,
        t.location_name AS location,
        t.short_description AS description,
        t.price,
        t.nights,
        COALESCE(
          (
            SELECT CONCAT('http://localhost:${PORT}', ti.image_url)
            FROM tour_images ti
            WHERE ti.tour_id = t.id
              AND ti.is_main = TRUE
            ORDER BY ti.id ASC
            LIMIT 1
          ),
          ''
        ) AS image
      FROM tours t
      WHERE t.is_active = TRUE
        AND t.is_popular = TRUE
        AND t.tour_type = 'hotel'
      ORDER BY
        CASE t.title
          WHEN 'Fort Arabesque The Villas' THEN 1
          WHEN 'Hard Rock Hotel Maldives' THEN 2
          WHEN 'Pickalbatros Luxury Suites' THEN 3
          ELSE 4
        END
      LIMIT 3
    `);

    const formattedRows = result.rows.map((tour) => ({
      ...tour,
      price: `от ${Number(tour.price).toLocaleString('ru-RU')} ₽`,
      nights: `${tour.nights} ночей`
    }));

    return res.status(200).json(formattedRows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Ошибка получения популярных туров' });
  }
});

app.get('/api/reviews', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        author_name AS name,
        COALESCE(
          avatar_url,
          UPPER(
            LEFT(SPLIT_PART(author_name, ' ', 1), 1) ||
            LEFT(SPLIT_PART(author_name, ' ', 2), 1)
          )
        ) AS initials,
        review_text AS description,
        rating
      FROM reviews
      WHERE is_active = TRUE
      ORDER BY sort_order ASC, created_at DESC
      LIMIT 20
    `);

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Ошибка получения отзывов' });
  }
});

app.post('/api/travel-requests', async (req, res) => {
  try {
    const { request_text, user_id = null } = req.body;

    if (!request_text || !request_text.trim()) {
      return res.status(400).json({
        message: 'Введите пожелания к путешествию'
      });
    }

    const result = await pool.query(
      `
      INSERT INTO travel_requests (user_id, request_text)
      VALUES ($1, $2)
      RETURNING id, user_id, request_text, status, created_at
      `,
      [user_id, request_text.trim()]
    );

    return res.status(201).json({
      message: 'Заявка успешно отправлена',
      request: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Ошибка при отправке заявки'
    });
  }
});

app.get('/api/home', async (req, res) => {
  try {
    const [domesticCategories, popularTours, reviews] = await Promise.all([
      pool.query(`
        SELECT
          id,
          title AS description,
          CASE
            WHEN image_url IS NOT NULL
              THEN CONCAT('http://localhost:${PORT}', image_url)
            ELSE ''
          END AS image_url
        FROM domestic_categories
        WHERE is_active = TRUE
        ORDER BY sort_order ASC, id ASC
      `),
      pool.query(`
        SELECT
          t.id,
          t.title,
          t.location_name AS location,
          t.short_description AS description,
          t.price,
          t.nights,
          CASE
            WHEN ti.image_url IS NOT NULL
              THEN CONCAT('http://localhost:${PORT}', ti.image_url)
            ELSE ''
          END AS image
        FROM tours t
        LEFT JOIN tour_images ti
          ON ti.tour_id = t.id
         AND ti.is_main = TRUE
        WHERE t.is_active = TRUE
          AND t.is_popular = TRUE
        ORDER BY t.id ASC
        LIMIT 12
      `),
      pool.query(`
        SELECT
          id,
          author_name AS name,
          COALESCE(
            avatar_url,
            UPPER(
              LEFT(SPLIT_PART(author_name, ' ', 1), 1) ||
              LEFT(SPLIT_PART(author_name, ' ', 2), 1)
            )
          ) AS initials,
          review_text AS description,
          rating
        FROM reviews
        WHERE is_active = TRUE
        ORDER BY sort_order ASC, created_at DESC
        LIMIT 20
      `)
    ]);

    const formattedPopularTours = popularTours.rows.map((tour) => ({
      ...tour,
      price: `от ${Number(tour.price).toLocaleString('ru-RU')} ₽`,
      nights: `${tour.nights} ночей`
    }));

    return res.status(200).json({
      domesticCategories: domesticCategories.rows,
      popularTours: formattedPopularTours,
      reviews: reviews.rows
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Ошибка получения данных главной страницы' });
  }
});

app.get('/api/domestic-tours/kaliningrad', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        t.id,
        t.title,
        t.short_description AS description,
        t.price,
        CASE
          WHEN ti.image_url IS NOT NULL
            THEN CONCAT('http://localhost:${PORT}', ti.image_url)
          ELSE ''
        END AS image
      FROM tours t
      JOIN directions d
        ON d.id = t.direction_id
      LEFT JOIN tour_images ti
        ON ti.tour_id = t.id
       AND ti.is_main = TRUE
      WHERE t.is_active = TRUE
        AND d.country_slug = 'kaliningrad'
        AND d.is_domestic = TRUE
      ORDER BY t.id ASC
    `);

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Ошибка получения туров Калининграда'
    });
  }
});

app.get('/api/tours/:id/details', async (req, res) => {
  try {
    const { id } = req.params;

    const tourResult = await pool.query(
      `
      SELECT
        t.id,
        t.title,
        t.price,
        t.nights,
        t.hotel_rating,
        t.location_name,
        t.short_description,
        t.full_description,
        t.hotel_lat,
        t.hotel_lng,
        t.tour_type,
        d.id AS direction_id,
        COALESCE(d.name_ru, d.name) AS direction_name,
        d.country_slug,
        (
          SELECT COUNT(*)
          FROM tour_images ti_count
          WHERE ti_count.tour_id = t.id
        ) AS images_count
      FROM tours t
      JOIN directions d
        ON d.id = t.direction_id
      WHERE t.id = $1
        AND t.is_active = TRUE
      `,
      [id]
    );

    if (tourResult.rows.length === 0) {
      return res.status(404).json({ message: 'Тур не найден' });
    }

    const imagesResult = await pool.query(
      `
      SELECT
        id,
        CASE
          WHEN image_url IS NOT NULL
            THEN CONCAT('http://localhost:${PORT}', image_url)
          ELSE ''
        END AS image_url,
        is_main
      FROM tour_images
      WHERE tour_id = $1
      ORDER BY is_main DESC, id ASC
      `,
      [id]
    );

    return res.status(200).json({
      ...tourResult.rows[0],
      images: imagesResult.rows
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Ошибка получения данных тура'
    });
  }
});

app.get('/api/tours/:id/related', async (req, res) => {
  try {
    const { id } = req.params;
    const limit = Math.min(Math.max(Number(req.query.limit) || 2, 1), 6);

    const currentTourResult = await pool.query(
      `
      SELECT
        id,
        title
      FROM tours
      WHERE id = $1
        AND is_active = TRUE
      `,
      [id]
    );

    if (currentTourResult.rows.length === 0) {
      return res.status(404).json({ message: 'Тур не найден' });
    }

    const currentTour = currentTourResult.rows[0];

    const relatedResult = await pool.query(
      `
      SELECT
        t.id,
        t.title,
        t.location_name AS location,
        t.short_description AS description,
        t.price,
        t.nights,
        t.hotel_rating,
        CASE
          WHEN t.title = 'Hard Rock Hotel Maldives'
            THEN 'с прямым вылетом из Москвы на BlackJet'
          WHEN t.title = 'Pickalbatros Luxury Suites'
            THEN 'центр города'
          WHEN t.title = 'Fort Arabesque The Villas'
            THEN 'с прямым вылетом из Москвы'
          ELSE 'с прямым вылетом из Москвы'
        END AS flight,
        CASE
          WHEN t.title = 'Hard Rock Hotel Maldives'
            THEN 'завтраки'
          WHEN t.title = 'Pickalbatros Luxury Suites'
            THEN 'поле для гольфа'
          WHEN t.title = 'Fort Arabesque The Villas'
            THEN 'всё включено'
          ELSE 'всё включено'
        END AS food,
        (
          SELECT COUNT(*)
          FROM tour_images ti_count
          WHERE ti_count.tour_id = t.id
        ) AS images_count
      FROM tours t
      WHERE t.is_active = TRUE
        AND t.is_popular = TRUE
        AND t.tour_type = 'hotel'
        AND t.title <> $1
      ORDER BY
        CASE t.title
          WHEN 'Fort Arabesque The Villas' THEN 1
          WHEN 'Hard Rock Hotel Maldives' THEN 2
          WHEN 'Pickalbatros Luxury Suites' THEN 3
          ELSE 4
        END,
        t.id ASC
      LIMIT $2
      `,
      [currentTour.title, limit]
    );

    const tourIds = relatedResult.rows.map((tour) => tour.id);

    if (tourIds.length === 0) {
      return res.status(200).json([]);
    }

    const imagesResult = await pool.query(
      `
      SELECT
        id,
        tour_id,
        CASE
          WHEN image_url IS NOT NULL
            THEN CONCAT('http://localhost:${PORT}', image_url)
          ELSE ''
        END AS image_url,
        is_main
      FROM tour_images
      WHERE tour_id = ANY($1)
      ORDER BY is_main DESC, id ASC
      `,
      [tourIds]
    );

    const relatedTours = relatedResult.rows.map((tour) => ({
      ...tour,
      images: imagesResult.rows.filter((image) => image.tour_id === tour.id)
    }));

    return res.status(200).json(relatedTours);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Ошибка получения похожих туров'
    });
  }
});

app.get('/api/offers-des', async (req, res) => {
  try {
    const toursResult = await pool.query(`
      SELECT
        t.id,
        t.title,
        t.location_name AS location,
        t.short_description AS description,
        t.price,
        t.nights,
        COUNT(ti.id)::INTEGER AS images_count,
        CASE
          WHEN t.title = 'Hard Rock Hotel Maldives'
            THEN 'с прямым вылетом из Москвы на BlackJet'
          WHEN t.title = 'Pickalbatros Luxury Suites'
            THEN 'центр города'
          ELSE 'с прямым вылетом из Москвы'
        END AS flight,
        CASE
          WHEN t.title = 'Hard Rock Hotel Maldives'
            THEN 'завтраки'
          WHEN t.title = 'Pickalbatros Luxury Suites'
            THEN 'поле для гольфа'
          ELSE 'всё включено'
        END AS food
      FROM tours t
      LEFT JOIN tour_images ti
        ON ti.tour_id = t.id
      WHERE t.is_active = TRUE
        AND t.tour_type = 'hotel'
        AND t.title IN (
          'Hard Rock Hotel Maldives',
          'Pickalbatros Luxury Suites'
        )
      GROUP BY
        t.id,
        t.title,
        t.location_name,
        t.short_description,
        t.price,
        t.nights
      ORDER BY
        CASE
          WHEN t.title = 'Hard Rock Hotel Maldives' THEN 1
          WHEN t.title = 'Pickalbatros Luxury Suites' THEN 2
          ELSE 3
        END
    `);

    const tourIds = toursResult.rows.map((tour) => tour.id);

    if (tourIds.length === 0) {
      return res.status(200).json([]);
    }

    const imagesResult = await pool.query(
      `
      SELECT
        id,
        tour_id,
        CASE
          WHEN image_url ~* '^https?://' THEN image_url
          WHEN image_url IS NOT NULL THEN CONCAT('http://localhost:${PORT}', image_url)
          ELSE ''
        END AS image_url,
        is_main
      FROM tour_images
      WHERE tour_id = ANY($1::bigint[])
      ORDER BY is_main DESC, id ASC
      `,
      [tourIds]
    );

    const formattedTours = toursResult.rows.map((tour) => ({
      ...tour,
      images: imagesResult.rows.filter((image) => Number(image.tour_id) === Number(tour.id))
    }));

    return res.status(200).json(formattedTours);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Ошибка получения предложений'
    });
  }
});

app.get('/api/blog-posts', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        bp.id,
        bp.title,
        bp.views,
        TO_CHAR(bp.published_at, 'DD.MM.YYYY') AS date,
        CASE
          WHEN bp.main_image_url IS NOT NULL
            THEN CONCAT('http://localhost:${PORT}', bp.main_image_url)
          ELSE ''
        END AS image
      FROM blog_posts bp
      WHERE bp.is_active = TRUE
      ORDER BY bp.sort_order ASC, bp.published_at DESC, bp.id ASC
    `);

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Ошибка получения статей блога' });
  }
});

app.get('/api/blog-posts/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const postResult = await pool.query(
      `
      SELECT
        id,
        title,
        views,
        TO_CHAR(published_at, 'DD.MM.YYYY') AS date,
        CASE
          WHEN main_image_url IS NOT NULL
            THEN CONCAT('http://localhost:${PORT}', main_image_url)
          ELSE ''
        END AS main_image
      FROM blog_posts
      WHERE id = $1
        AND is_active = TRUE
      `,
      [id]
    );

    if (postResult.rows.length === 0) {
      return res.status(404).json({ message: 'Статья не найдена' });
    }

    const sectionsResult = await pool.query(
      `
      SELECT
        id,
        title,
        text,
        subtext,
        sort_order
      FROM blog_post_sections
      WHERE blog_post_id = $1
      ORDER BY sort_order ASC, id ASC
      `,
      [id]
    );

    const imagesResult = await pool.query(
      `
      SELECT
        section_id,
        CASE
          WHEN image_url IS NOT NULL
            THEN CONCAT('http://localhost:${PORT}', image_url)
          ELSE ''
        END AS image_url
      FROM blog_post_images
      WHERE blog_post_id = $1
      ORDER BY sort_order ASC, id ASC
      `,
      [id]
    );

    const sections = sectionsResult.rows.map((section) => ({
      ...section,
      images: imagesResult.rows
        .filter((image) => image.section_id === section.id)
        .map((image) => image.image_url)
    }));

    return res.status(200).json({
      ...postResult.rows[0],
      sections
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Ошибка получения статьи блога' });
  }
});

app.post('/api/blog-posts/:id/increment-views', async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(`
      UPDATE blog_posts
      SET views = views + 1
      WHERE id = $1
    `, [id]);

    return res.status(200).json({ message: 'Просмотр увеличен' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Ошибка обновления просмотров' });
  }
});
app.post('/api/contact-requests', async (req, res) => {
  try {
    const {
      full_name,
      phone,
      email = '',
      question,
      personal_data_agreement
    } = req.body;

    if (!full_name || !full_name.trim()) {
      return res.status(400).json({ message: 'Введите ФИО' });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({ message: 'Введите телефон' });
    }

    if (!question || !question.trim()) {
      return res.status(400).json({ message: 'Введите вопрос' });
    }

    if (personal_data_agreement !== true) {
      return res.status(400).json({
        message: 'Необходимо согласие на обработку персональных данных'
      });
    }

    const normalizedEmail = normalizeEmail(email);

    if (normalizedEmail && !isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: 'Некорректный email' });
    }

    const result = await pool.query(
      `
      INSERT INTO contact_requests (
        full_name,
        phone,
        email,
        question
      )
      VALUES ($1, $2, $3, $4)
      RETURNING id, full_name, phone, email, question, created_at
      `,
      [
        full_name.trim(),
        phone.trim(),
        normalizedEmail || null,
        question.trim()
      ]
    );

    return res.status(201).json({
      message: 'Заявка успешно отправлена',
      request: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Ошибка при отправке заявки'
    });
  }
});

app.post('/api/admin/login', async (req, res) => {
  try {
    const { login, password } = req.body;

    const adminLogin = process.env.ADMIN_LOGIN || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (login !== adminLogin || password !== adminPassword) {
      return res.status(401).json({
        message: 'Неверный логин или пароль'
      });
    }

    const token = createAdminToken();

    return res.status(200).json({
      message: 'Вход выполнен успешно',
      token
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Ошибка входа в админ-панель'
    });
  }
});

app.get('/api/admin/contact-requests', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        full_name,
        phone,
        email,
        question,
        created_at
      FROM contact_requests
      ORDER BY created_at DESC
    `);

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Ошибка получения обращений'
    });
  }
});

app.get('/api/admin/reviews', requireAdmin, async (req, res) => {
  try {
    const { status = 'pending' } = req.query;

    let whereClause = '';

    if (status === 'pending') {
      whereClause = 'WHERE r.is_active = FALSE';
    }

    if (status === 'active') {
      whereClause = 'WHERE r.is_active = TRUE';
    }

    const result = await pool.query(`
      SELECT
        r.id,
        r.author_name,
        r.rating,
        r.review_text,
        r.is_active,
        r.created_at,
        u.email AS user_email
      FROM reviews r
      LEFT JOIN users u
        ON u.id = r.user_id
      ${whereClause}
      ORDER BY r.created_at DESC
    `);

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Ошибка получения отзывов'
    });
  }
});

app.patch('/api/admin/reviews/:id/approve', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      UPDATE reviews
      SET is_active = TRUE
      WHERE id = $1
      RETURNING id, author_name, rating, review_text, is_active, created_at
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Отзыв не найден'
      });
    }

    return res.status(200).json({
      message: 'Отзыв опубликован',
      review: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Ошибка публикации отзыва'
    });
  }
});

app.delete('/api/admin/reviews/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM reviews
      WHERE id = $1
      RETURNING id
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Отзыв не найден'
      });
    }

    return res.status(200).json({
      message: 'Отзыв удалён'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Ошибка удаления отзыва'
    });
  }
});


app.get('/api/admin/orders', requireAdmin, async (req, res) => {
  try {
    const requestedStatus = normalizeOrderStatus(req.query.status || 'active');
    const statusFilter = ['active', 'inactive', 'all', ...ORDER_ALLOWED_STATUSES].includes(requestedStatus)
      ? requestedStatus
      : 'active';

    const whereParts = [];
    const params = [];

    if (statusFilter === 'active') {
      params.push(ORDER_ACTIVE_STATUSES);
      whereParts.push(`LOWER(o.status) = ANY($${params.length}::text[])`);
    } else if (statusFilter === 'inactive') {
      params.push(ORDER_ACTIVE_STATUSES);
      whereParts.push(`LOWER(o.status) <> ALL($${params.length}::text[])`);
    } else if (statusFilter !== 'all') {
      params.push(statusFilter);
      whereParts.push(`LOWER(o.status) = $${params.length}`);
    }

    const whereClause = whereParts.length
      ? `WHERE ${whereParts.join(' AND ')}`
      : '';

    const result = await pool.query(
      `
      SELECT
        ${getOrderSelectFields()},
        u.email AS user_email,
        u.full_name AS user_full_name
      FROM orders o
      JOIN users u
        ON u.id = o.user_id
      JOIN tours t
        ON t.id = o.tour_id
      JOIN directions d
        ON d.id = t.direction_id
      ${whereClause}
      ORDER BY
        CASE LOWER(o.status)
          WHEN 'new' THEN 0
          WHEN 'pending' THEN 1
          WHEN 'confirmed' THEN 2
          WHEN 'paid' THEN 3
          WHEN 'active' THEN 4
          ELSE 5
        END ASC,
        o.created_at DESC,
        o.id DESC
      `,
      params
    );

    return res.status(200).json({
      orders: mapOrderRows(result.rows)
    });
  } catch (error) {
    console.error('Ошибка получения заказов для админа:', error);
    return res.status(500).json({
      message: 'Ошибка получения заказов'
    });
  }
});

app.patch('/api/admin/orders/:orderId/status', requireAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    const requestedStatus = normalizeOrderStatus(req.body?.status || '');
    const managerComment = sanitizeOrderText(req.body?.manager_comment || '', 700);

    if (!ORDER_ALLOWED_STATUSES.includes(requestedStatus)) {
      return res.status(400).json({
        message: 'Некорректный статус заказа'
      });
    }

    const result = await pool.query(
      `
      WITH updated_order AS (
        UPDATE orders
        SET
          status = $1,
          manager_comment = $2,
          status_updated_at = NOW()
        WHERE id = $3
        RETURNING *
      )
      SELECT
        ${getOrderSelectFields()},
        u.email AS user_email,
        u.full_name AS user_full_name
      FROM updated_order o
      JOIN users u
        ON u.id = o.user_id
      JOIN tours t
        ON t.id = o.tour_id
      JOIN directions d
        ON d.id = t.direction_id
      `,
      [requestedStatus, managerComment, orderId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Заказ не найден'
      });
    }

    return res.status(200).json({
      message: 'Статус заказа обновлён',
      order: mapOrderRows(result.rows)[0]
    });
  } catch (error) {
    console.error('Ошибка обновления заказа админом:', error);
    return res.status(500).json({
      message: 'Ошибка обновления заказа'
    });
  }
});


app.post('/api/reviews', requireUser, async (req, res) => {
  try {
    const { author_name, rating, review_text } = req.body;
    const userId = req.authUser.id;

    if (!author_name || !author_name.trim()) {
      return res.status(400).json({
        message: 'Введите имя'
      });
    }

    if (author_name.trim().length < 2) {
      return res.status(400).json({
        message: 'Имя должно содержать минимум 2 символа'
      });
    }

    const numericRating = Number(rating);

    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        message: 'Оценка должна быть от 1 до 5'
      });
    }

    if (!review_text || !review_text.trim()) {
      return res.status(400).json({
        message: 'Введите текст отзыва'
      });
    }

    if (review_text.trim().length < 10) {
      return res.status(400).json({
        message: 'Отзыв должен содержать минимум 10 символов'
      });
    }

    const userResult = await pool.query(
      `
      SELECT id
      FROM users
      WHERE id = $1
      `,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        message: 'Пользователь не найден'
      });
    }

    const result = await pool.query(
      `
      INSERT INTO reviews (
        author_name,
        rating,
        review_text,
        is_active,
        user_id
      )
      VALUES ($1, $2, $3, FALSE, $4)
      RETURNING id, author_name, rating, review_text, is_active, created_at
      `,
      [
        author_name.trim(),
        numericRating,
        review_text.trim(),
        userId
      ]
    );

    return res.status(201).json({
      message: 'Отзыв отправлен на модерацию',
      review: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Ошибка отправки отзыва'
    });
  }
});

app.get('/api/users/:userId/reviews', requireUser, requireUserOwner, async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `
      SELECT
        id,
        author_name,
        rating,
        review_text,
        is_active,
        created_at
      FROM reviews
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [userId]
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Ошибка получения отзывов пользователя'
    });
  }
});


app.patch('/api/users/:userId/profile', requireUser, requireUserOwner, async (req, res) => {
  try {
    const { userId } = req.params;
    const { full_name = '', avatar_url = '' } = req.body;

    const normalizedName = full_name.trim();
    const normalizedAvatar = avatar_url.trim();

    if (normalizedName && normalizedName.length < 2) {
      return res.status(400).json({
        message: 'Никнейм должен содержать минимум 2 символа'
      });
    }

    if (normalizedName.length > 50) {
      return res.status(400).json({
        message: 'Никнейм не должен быть длиннее 50 символов'
      });
    }

    if (
      normalizedAvatar &&
      !ALLOWED_PROFILE_AVATARS.includes(normalizedAvatar)
    ) {
      return res.status(400).json({
        message: 'Некорректный аватар'
      });
    }

    const result = await pool.query(
      `
      UPDATE users
      SET
        full_name = $1,
        avatar_url = $2
      WHERE id = $3
      RETURNING id, email, full_name, avatar_url, created_at
      `,
      [
        normalizedName || null,
        normalizedAvatar || null,
        userId
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Пользователь не найден'
      });
    }

    return res.status(200).json({
      message: 'Профиль обновлён',
      user: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Ошибка обновления профиля'
    });
  }
});


const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`;

function buildPublicUrl(url = '') {
  if (!url) return '';

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
  return `${PUBLIC_BASE_URL}${normalizedUrl}`;
}

function formatPriceValue(value) {
  const numericValue = Number(value) || 0;
  return `от ${numericValue.toLocaleString('ru-RU')} ₽`;
}

function formatNightsValue(value) {
  const nights = Number(value) || 0;
  const lastDigit = nights % 10;
  const lastTwoDigits = nights % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return `${nights} ночей`;
  }

  if (lastDigit === 1) {
    return `${nights} ночь`;
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return `${nights} ночи`;
  }

  return `${nights} ночей`;
}

function normalizeCatalogType(value = 'tours') {
  return value === 'hotels' ? 'hotels' : 'tours';
}

function normalizeBoolean(value) {
  return value === true || value === 'true' || value === '1' || value === 1;
}

function mapCatalogRows(rows) {
  return rows.map((tour) => ({
    ...tour,
    price: Number(tour.price) || 0,
    nights: Number(tour.nights) || 0,
    hotel_rating: tour.hotel_rating === null ? null : Number(tour.hotel_rating),
    hotel_lat: tour.hotel_lat === null ? null : Number(tour.hotel_lat),
    hotel_lng: tour.hotel_lng === null ? null : Number(tour.hotel_lng),
    price_formatted: formatPriceValue(tour.price),
    nights_label: formatNightsValue(tour.nights),
    image: buildPublicUrl(tour.image || ''),
  }));
}


const ORDER_ACTIVE_STATUSES = ['active', 'new', 'pending', 'confirmed', 'paid'];
const ORDER_ALLOWED_STATUSES = [
  'active',
  'new',
  'pending',
  'confirmed',
  'paid',
  'completed',
  'cancelled',
  'expired',
  'archived'
];

function normalizeOrderStatus(status = '') {
  return String(status || '').trim().toLowerCase();
}

function sanitizeOrderText(value = '', maxLength = 500) {
  const normalizedValue = String(value || '').trim();

  if (!normalizedValue) return null;

  return normalizedValue.slice(0, maxLength);
}

function getOrderSelectFields() {
  return `
    o.id,
    o.user_id,
    o.tour_id,
    o.start_date,
    o.end_date,
    o.people_count,
    o.room_type,
    o.total_price,
    o.status,
    o.created_at,
    o.contact_phone,
    o.user_comment,
    o.manager_comment,
    o.status_updated_at,
    t.title,
    t.price,
    t.nights,
    t.location_name,
    COALESCE(t.location_name, d.name_ru, d.name, d.name_en) AS country,
    COALESCE((
      SELECT ti.image_url
      FROM tour_images ti
      WHERE ti.tour_id = t.id
        AND ti.is_main = TRUE
      ORDER BY ti.id ASC
      LIMIT 1
    ), (
      SELECT ti.image_url
      FROM tour_images ti
      WHERE ti.tour_id = t.id
      ORDER BY ti.id ASC
      LIMIT 1
    ), '') AS image
  `;
}

function mapOrderRows(rows) {
  return rows.map((order) => ({
    ...order,
    image: buildPublicUrl(order.image || ''),
    price: Number(order.price) || 0,
    total_price: Number(order.total_price) || 0,
    people_count: Number(order.people_count) || 0,
    tour_id: Number(order.tour_id) || null,
    user_id: Number(order.user_id) || null
  }));
}

async function getOrderCounts(userId) {
  const { rows } = await pool.query(
    `
    SELECT
      COUNT(*) FILTER (
        WHERE LOWER(status) = ANY($2::text[])
      )::int AS active,
      COUNT(*) FILTER (
        WHERE LOWER(status) <> ALL($2::text[])
      )::int AS inactive
    FROM orders
    WHERE user_id = $1
    `,
    [userId, ORDER_ACTIVE_STATUSES]
  );

  return {
    active: Number(rows[0]?.active) || 0,
    inactive: Number(rows[0]?.inactive) || 0
  };
}

app.get('/api/users/:userId/orders', requireUser, requireUserOwner, async (req, res) => {
  try {
    const { userId } = req.params;
    const requestedStatus = String(req.query.status || 'active').toLowerCase();
    const statusFilter = ['active', 'inactive', 'all'].includes(requestedStatus)
      ? requestedStatus
      : 'active';

    const whereParts = ['o.user_id = $1'];
    const params = [userId];

    if (statusFilter === 'active') {
      params.push(ORDER_ACTIVE_STATUSES);
      whereParts.push(`LOWER(o.status) = ANY($${params.length}::text[])`);
    }

    if (statusFilter === 'inactive') {
      params.push(ORDER_ACTIVE_STATUSES);
      whereParts.push(`LOWER(o.status) <> ALL($${params.length}::text[])`);
    }

    const orderBy = statusFilter === 'inactive'
      ? 'o.end_date DESC NULLS LAST, o.created_at DESC, o.id DESC'
      : `
        CASE WHEN o.start_date >= CURRENT_DATE THEN 0 ELSE 1 END ASC,
        o.start_date ASC,
        o.created_at DESC,
        o.id DESC
      `;

    const [ordersResult, counts] = await Promise.all([
      pool.query(
        `
        SELECT
          ${getOrderSelectFields()}
        FROM orders o
        JOIN tours t
          ON t.id = o.tour_id
        JOIN directions d
          ON d.id = t.direction_id
        WHERE ${whereParts.join('\n          AND ')}
        ORDER BY ${orderBy}
        `,
        params
      ),
      getOrderCounts(userId)
    ]);

    return res.status(200).json({
      orders: mapOrderRows(ordersResult.rows),
      counts
    });
  } catch (error) {
    console.error('Ошибка получения заказов пользователя:', error);
    return res.status(500).json({
      message: 'Ошибка получения заказов пользователя'
    });
  }
});

app.post('/api/users/:userId/orders', requireUser, requireUserOwner, async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      tour_id,
      start_date,
      people_count = 1,
      room_type = 'Стандарт',
      contact_phone = '',
      user_comment = ''
    } = req.body || {};

    const tourId = Number(tour_id);
    const peopleCount = Number(people_count);

    if (!Number.isInteger(tourId) || tourId <= 0) {
      return res.status(400).json({
        message: 'Тур не выбран'
      });
    }

    if (!Number.isInteger(peopleCount) || peopleCount < 1 || peopleCount > 20) {
      return res.status(400).json({
        message: 'Количество туристов должно быть от 1 до 20'
      });
    }

    let normalizedStartDate = null;

    if (start_date) {
      const parsedDate = new Date(start_date);

      if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          message: 'Некорректная дата поездки'
        });
      }

      normalizedStartDate = start_date;
    }

    const existingOrder = await pool.query(
      `
      SELECT
        ${getOrderSelectFields()}
      FROM orders o
      JOIN tours t
        ON t.id = o.tour_id
      JOIN directions d
        ON d.id = t.direction_id
      WHERE o.user_id = $1
        AND o.tour_id = $2
        AND LOWER(o.status) = ANY($3::text[])
      ORDER BY o.created_at DESC, o.id DESC
      LIMIT 1
      `,
      [userId, tourId, ORDER_ACTIVE_STATUSES]
    );

    if (existingOrder.rows.length > 0) {
      return res.status(409).json({
        message: 'Этот тур уже находится в активных заказах',
        order: mapOrderRows(existingOrder.rows)[0]
      });
    }

    const result = await pool.query(
      `
      WITH inserted_order AS (
        INSERT INTO orders (
          user_id,
          tour_id,
          start_date,
          end_date,
          people_count,
          room_type,
          total_price,
          status,
          contact_phone,
          user_comment,
          manager_comment,
          status_updated_at
        )
        SELECT
          $1,
          t.id,
          $2::date,
          CASE
            WHEN $2::date IS NULL THEN NULL
            ELSE ($2::date + (GREATEST(t.nights, 1) * INTERVAL '1 day'))::date
          END,
          $3::int,
          NULLIF($4, ''),
          (t.price * $3::int),
          'new',
          $5,
          $6,
          'Новая заявка. Менеджер скоро проверит доступность тура и свяжется с клиентом.',
          NOW()
        FROM tours t
        WHERE t.id = $7
          AND t.is_active = TRUE
        RETURNING *
      )
      SELECT
        ${getOrderSelectFields()}
      FROM inserted_order o
      JOIN tours t
        ON t.id = o.tour_id
      JOIN directions d
        ON d.id = t.direction_id
      `,
      [
        userId,
        normalizedStartDate,
        peopleCount,
        sanitizeOrderText(room_type, 120) || 'Стандарт',
        sanitizeOrderText(contact_phone, 50),
        sanitizeOrderText(user_comment, 500),
        tourId
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Тур не найден или недоступен для бронирования'
      });
    }

    return res.status(201).json({
      message: 'Заявка на бронирование создана',
      order: mapOrderRows(result.rows)[0]
    });
  } catch (error) {
    console.error('Ошибка создания заказа:', error);
    return res.status(500).json({
      message: 'Ошибка создания заказа'
    });
  }
});

app.patch('/api/users/:userId/orders/:orderId/status', requireUser, requireUserOwner, async (req, res) => {
  try {
    const { userId, orderId } = req.params;
    const requestedStatus = String(req.body?.status || '').trim().toLowerCase();

    if (requestedStatus !== 'cancelled') {
      return res.status(400).json({
        message: 'Пользователь может только отменить активный заказ'
      });
    }

    const result = await pool.query(
      `
      WITH updated_order AS (
        UPDATE orders
        SET
          status = 'cancelled',
          manager_comment = COALESCE(manager_comment, 'Заказ отменён пользователем.'),
          status_updated_at = NOW()
        WHERE id = $1
          AND user_id = $2
          AND LOWER(status) = ANY($3::text[])
        RETURNING *
      )
      SELECT
        ${getOrderSelectFields()}
      FROM updated_order o
      JOIN tours t
        ON t.id = o.tour_id
      JOIN directions d
        ON d.id = t.direction_id
      `,
      [orderId, userId, ORDER_ACTIVE_STATUSES]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Активный заказ не найден или уже не может быть отменён'
      });
    }

    return res.status(200).json({
      message: 'Заказ отменён',
      order: mapOrderRows(result.rows)[0]
    });
  } catch (error) {
    console.error('Ошибка изменения статуса заказа:', error);
    return res.status(500).json({
      message: 'Ошибка изменения статуса заказа'
    });
  }
});

function addCatalogTypeWhere(whereParts, params, type) {
  if (normalizeCatalogType(type) !== 'hotels') return;

  whereParts.push(`LOWER(COALESCE(t.tour_type, '')) IN ('hotel', 'offer')`);
}

// Получение всех стран/направлений для глобуса и каталога
app.get('/api/directions', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        d.id,
        d.name_ru,
        d.name_en,
        d.name,
        d.country_slug,
        d.globe_lat,
        d.globe_lng,
        d.flag_url,
        d.is_popular,
        d.popularity_score,
        d.is_domestic,
        COUNT(t.id)::int AS tours_count,
        COUNT(t.id) FILTER (
          WHERE LOWER(COALESCE(t.tour_type, '')) IN ('hotel', 'offer')
        )::int AS hotels_count,
        COALESCE(MIN(t.price), 0)::numeric(12,2) AS price_from,
        CASE
          WHEN d.popularity_score >= 80 THEN 'high'
          WHEN d.popularity_score >= 60 THEN 'medium'
          ELSE 'low'
        END AS popularity_level,
        CASE
          WHEN d.popularity_score >= 80 THEN '#e74c3c'
          WHEN d.popularity_score >= 60 THEN '#f1c40f'
          ELSE '#27ae60'
        END AS popularity_color
      FROM directions d
      LEFT JOIN tours t
        ON t.direction_id = d.id
       AND t.is_active = TRUE
      WHERE d.globe_lat IS NOT NULL
        AND d.globe_lng IS NOT NULL
      GROUP BY d.id
      ORDER BY
        d.is_popular DESC,
        tours_count DESC,
        d.popularity_score DESC,
        COALESCE(d.name_ru, d.name, d.name_en, d.country_slug) ASC;
    `);

    return res.status(200).json(rows);
  } catch (error) {
    console.error('Ошибка при получении направлений:', error);
    return res.status(500).json({ message: 'Ошибка при получении направлений' });
  }
});

// Универсальный каталог для Hero и полноэкранного глобуса
app.get('/api/catalog', async (req, res) => {
  try {
    const {
      direction_id,
      country_slug,
      q = '',
      max_price,
      type = 'tours',
      domestic,
      popular,
      limit = 6,
      page = 1,
    } = req.query;

    const params = [];
    const whereParts = ['t.is_active = TRUE'];

    addCatalogTypeWhere(whereParts, params, type);

    if (direction_id) {
      const directionId = Number(direction_id);

      if (!Number.isFinite(directionId)) {
        return res.status(400).json({ message: 'Некорректный id направления' });
      }

      params.push(directionId);
      whereParts.push(`d.id = $${params.length}`);
    }

    if (country_slug) {
      params.push(String(country_slug).trim().toLowerCase());
      whereParts.push(`LOWER(d.country_slug) = $${params.length}`);
    }

    const searchQuery = String(q).trim();

    if (searchQuery) {
      params.push(`%${searchQuery}%`);
      whereParts.push(`(
        d.name_ru ILIKE $${params.length}
        OR d.name_en ILIKE $${params.length}
        OR d.name ILIKE $${params.length}
        OR d.country_slug ILIKE $${params.length}
        OR t.title ILIKE $${params.length}
        OR t.location_name ILIKE $${params.length}
        OR t.tour_type ILIKE $${params.length}
      )`);
    }

    if (max_price) {
      const maxPrice = Number(max_price);

      if (!Number.isFinite(maxPrice) || maxPrice < 0) {
        return res.status(400).json({ message: 'Некорректная стоимость' });
      }

      params.push(maxPrice);
      whereParts.push(`t.price <= $${params.length}`);
    }

    if (domestic !== undefined) {
      params.push(normalizeBoolean(domestic));
      whereParts.push(`d.is_domestic = $${params.length}`);
    }

    if (normalizeBoolean(popular)) {
      whereParts.push(`(t.is_popular = TRUE OR d.is_popular = TRUE OR t.is_hot = TRUE)`);
    }

    const safeLimit = Math.min(Math.max(Number(limit) || 6, 1), 48);
    const safePage = Math.max(Number(page) || 1, 1);
    const offset = (safePage - 1) * safeLimit;

    const whereSql = whereParts.join('\n        AND ');

    const countResult = await pool.query(`
      SELECT COUNT(*)::int AS total
      FROM tours t
      JOIN directions d
        ON d.id = t.direction_id
      WHERE ${whereSql};
    `, params);

    const total = Number(countResult.rows[0]?.total || 0);
    const listParams = [...params, safeLimit, offset];
    const limitIndex = listParams.length - 1;
    const offsetIndex = listParams.length;

    const { rows } = await pool.query(`
      SELECT
        t.id,
        t.direction_id,
        d.name_ru AS direction_name_ru,
        d.name_en AS direction_name_en,
        COALESCE(d.name_ru, d.name, d.name_en, d.country_slug) AS direction_name,
        d.country_slug,
        d.globe_lat,
        d.globe_lng,
        d.is_domestic,
        t.title,
        t.short_description AS description,
        t.full_description,
        t.price,
        t.nights,
        t.hotel_rating,
        t.is_hot,
        t.is_popular,
        t.tour_type,
        t.location_name,
        t.hotel_lat,
        t.hotel_lng,
        COALESCE((
          SELECT ti.image_url
          FROM tour_images ti
          WHERE ti.tour_id = t.id
            AND ti.is_main = TRUE
          ORDER BY ti.id ASC
          LIMIT 1
        ), (
          SELECT ti.image_url
          FROM tour_images ti
          WHERE ti.tour_id = t.id
          ORDER BY ti.id ASC
          LIMIT 1
        ), '') AS image
      FROM tours t
      JOIN directions d
        ON d.id = t.direction_id
      WHERE ${whereSql}
      ORDER BY
        t.is_hot DESC,
        t.is_popular DESC,
        t.price ASC,
        t.id ASC
      LIMIT $${limitIndex}
      OFFSET $${offsetIndex};
    `, listParams);

    return res.status(200).json({
      items: mapCatalogRows(rows),
      total,
      page: safePage,
      limit: safeLimit,
      has_more: safePage * safeLimit < total,
      type: normalizeCatalogType(type),
      message: total === 0 ? 'Данные о турах пока не добавили' : null,
    });
  } catch (error) {
    console.error('Ошибка при получении каталога:', error);
    return res.status(500).json({ message: 'Ошибка при получении каталога' });
  }
});

// Получение туров для конкретной страны/направления
app.get('/api/directions/:id/tours', async (req, res) => {
  const directionId = Number(req.params.id);

  if (!Number.isFinite(directionId)) {
    return res.status(400).json({ message: 'Некорректный id направления' });
  }

  try {
    const type = normalizeCatalogType(req.query.type);
    const params = [directionId];
    const whereParts = [
      't.direction_id = $1',
      't.is_active = TRUE',
    ];

    addCatalogTypeWhere(whereParts, params, type);

    const { rows } = await pool.query(`
      SELECT
        t.id,
        t.direction_id,
        COALESCE(d.name_ru, d.name, d.name_en, d.country_slug) AS direction_name,
        d.country_slug,
        d.globe_lat,
        d.globe_lng,
        d.is_domestic,
        t.title,
        t.short_description AS description,
        t.full_description,
        t.price,
        t.nights,
        t.hotel_rating,
        t.is_hot,
        t.is_popular,
        t.tour_type,
        t.location_name,
        t.hotel_lat,
        t.hotel_lng,
        COALESCE((
          SELECT ti.image_url
          FROM tour_images ti
          WHERE ti.tour_id = t.id
            AND ti.is_main = TRUE
          ORDER BY ti.id ASC
          LIMIT 1
        ), (
          SELECT ti.image_url
          FROM tour_images ti
          WHERE ti.tour_id = t.id
          ORDER BY ti.id ASC
          LIMIT 1
        ), '') AS image
      FROM tours t
      JOIN directions d
        ON d.id = t.direction_id
      WHERE ${whereParts.join('\n        AND ')}
      ORDER BY
        t.is_hot DESC,
        t.is_popular DESC,
        t.price ASC,
        t.id ASC;
    `, params);

    return res.status(200).json(mapCatalogRows(rows));
  } catch (error) {
    console.error('Ошибка при получении туров для направления:', error);
    return res.status(500).json({ message: 'Ошибка при получении туров для направления' });
  }
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});