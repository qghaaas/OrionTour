const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
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
      RETURNING id, email, created_at
      `,
      [row.email, row.password_hash]
    );

    await client.query(
      `DELETE FROM registration_codes WHERE email = $1`,
      [normalizedEmail]
    );

    await client.query('COMMIT');

    return res.status(201).json({
      message: 'Регистрация успешно завершена',
      user: newUser.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
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
      SELECT id, email, password_hash, created_at
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

    return res.status(200).json({
      message: 'Вход выполнен успешно',
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Ошибка сервера при входе'
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

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});