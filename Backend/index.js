const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
require('dotenv').config();

const PORT = process.env.PORT || 3010;
const app = express();

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

const CODE_EXPIRES_MINUTES = 10;
const RESEND_DELAY_SECONDS = 30;
const MAX_VERIFY_ATTEMPTS = 5;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
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

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function deleteExpiredCodes() {
  await pool.query(`
    DELETE FROM registration_codes
    WHERE expires_at < NOW()
  `);
}

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, message: 'Server is running' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, message: 'Database error' });
  }
});

app.post('/api/auth/register/send-code', async (req, res) => {
  try {
    const { full_name, email, password } = req.body;

    const normalizedEmail = normalizeEmail(email);

    if (!full_name || !normalizedEmail || !password) {
      return res.status(400).json({
        message: 'Заполните имя, email и пароль'
      });
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        message: 'Некорректный email'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Пароль должен содержать минимум 6 символов'
      });
    }

    await deleteExpiredCodes();

    const existingUser = await pool.query(
      `SELECT id FROM users WHERE email = $1`,
      [normalizedEmail]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        message: 'Пользователь с таким email уже зарегистрирован'
      });
    }

    const pendingCode = await pool.query(
      `SELECT resend_available_at
       FROM registration_codes
       WHERE email = $1`,
      [normalizedEmail]
    );

    if (pendingCode.rows.length > 0) {
      const resendAvailableAt = new Date(pendingCode.rows[0].resend_available_at);
      const now = new Date();

      if (resendAvailableAt > now) {
        const secondsLeft = Math.ceil((resendAvailableAt - now) / 1000);

        return res.status(429).json({
          message: `Новый код можно запросить через ${secondsLeft} сек.`,
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
        full_name,
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
        $4,
        NOW() + INTERVAL '10 minutes',
        NOW() + INTERVAL '30 seconds',
        0
      )
      ON CONFLICT (email)
      DO UPDATE SET
        full_name = EXCLUDED.full_name,
        password_hash = EXCLUDED.password_hash,
        code_hash = EXCLUDED.code_hash,
        expires_at = NOW() + INTERVAL '10 minutes',
        resend_available_at = NOW() + INTERVAL '30 seconds',
        attempts = 0,
        created_at = CURRENT_TIMESTAMP
      `,
      [normalizedEmail, full_name.trim(), passwordHash, codeHash]
    );

    try {
      await transporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME || 'Orion Tour'}" <${process.env.SMTP_USER}>`,
        to: normalizedEmail,
        subject: 'Код подтверждения регистрации',
        text: `Ваш код подтверждения: ${code}. Код действует ${CODE_EXPIRES_MINUTES} минут.`
      });
    } catch (mailError) {
      console.error('Ошибка отправки письма:', mailError);

      await pool.query(
        `DELETE FROM registration_codes WHERE email = $1`,
        [normalizedEmail]
      );

      return res.status(500).json({
        message: 'Не удалось отправить письмо с кодом'
      });
    }

    return res.status(200).json({
      message: 'Код отправлен на почту',
      resendAfter: RESEND_DELAY_SECONDS
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Ошибка сервера при отправке кода'
    });
  }
});

app.post('/api/auth/register/verify-code', async (req, res) => {
  const client = await pool.connect();

  try {
    const { email, code } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !code) {
      return res.status(400).json({
        message: 'Введите email и код'
      });
    }

    await deleteExpiredCodes();

    const codeResult = await client.query(
      `
      SELECT id, email, full_name, password_hash, code_hash, expires_at, attempts
      FROM registration_codes
      WHERE email = $1
      `,
      [normalizedEmail]
    );

    if (codeResult.rows.length === 0) {
      return res.status(400).json({
        message: 'Код не найден или истёк. Запросите новый код'
      });
    }

    const row = codeResult.rows[0];

    if (new Date(row.expires_at) < new Date()) {
      await client.query(
        `DELETE FROM registration_codes WHERE email = $1`,
        [normalizedEmail]
      );

      return res.status(400).json({
        message: 'Срок действия кода истёк. Запросите новый код'
      });
    }

    if (row.attempts >= MAX_VERIFY_ATTEMPTS) {
      return res.status(429).json({
        message: 'Слишком много попыток. Запросите новый код'
      });
    }

    const incomingCodeHash = hashCode(code.trim());

    if (incomingCodeHash !== row.code_hash) {
      await client.query(
        `
        UPDATE registration_codes
        SET attempts = attempts + 1
        WHERE email = $1
        `,
        [normalizedEmail]
      );

      return res.status(400).json({
        message: 'Неверный код'
      });
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
        message: 'Пользователь уже зарегистрирован'
      });
    }

    const userInsert = await client.query(
      `
      INSERT INTO users (email, password_hash, full_name)
      VALUES ($1, $2, $3)
      RETURNING id, email, full_name, created_at
      `,
      [row.email, row.password_hash, row.full_name]
    );

    await client.query(
      `DELETE FROM registration_codes WHERE email = $1`,
      [normalizedEmail]
    );

    await client.query('COMMIT');

    return res.status(201).json({
      message: 'Регистрация успешно завершена',
      user: userInsert.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => { });
    console.error(error);
    return res.status(500).json({
      message: 'Ошибка сервера при подтверждении кода'
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
      return res.status(400).json({
        message: 'Введите email и пароль'
      });
    }

    const userResult = await pool.query(
      `
      SELECT id, email, full_name, password_hash, created_at
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
      return res.status(400).json({
        message: 'Неверный пароль'
      });
    }

    return res.status(200).json({
      message: 'Вход выполнен успешно',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
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

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
