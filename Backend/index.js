const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
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
  await pool.query(
    `DELETE FROM registration_codes WHERE expires_at < NOW()`
  );
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
    const { full_name, email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!full_name || !normalizedEmail || !password) {
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
      SELECT email, full_name, password_hash, code_hash, expires_at, attempts
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
      user: newUser.rows[0]
    });
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
      return res.status(400).json({ message: 'Неверный пароль' });
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