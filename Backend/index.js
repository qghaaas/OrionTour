const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
require("dotenv").config();

const app = express();
const PORT = Number(process.env.PORT) || 3010;

const CODE_EXPIRES_MINUTES = 10;
const RESEND_DELAY_SECONDS = 30;
const MAX_VERIFY_ATTEMPTS = 5;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
  options: `-c search_path=${process.env.DB_SCHEMA}`,
});

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

app.use(cors());
app.use(express.json());

const normalizeEmail = (email = "") => email.trim().toLowerCase();
const generateCode = () => crypto.randomInt(1000, 10000).toString();
const hashCode = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");

async function deleteExpiredCodes() {
  await pool.query("DELETE FROM registration_codes WHERE expires_at < NOW()");
}

async function sendVerificationEmail(email, code) {
  await transporter.sendMail({
    from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Код подтверждения регистрации",
    text: `Ваш код подтверждения: ${code}. Код действует ${CODE_EXPIRES_MINUTES} минут.`,
  });
}

app.get("/api/health", async (_, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true });
  } catch {
    res.status(500).json({ ok: false });
  }
});

app.post("/api/auth/register/send-code", async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: "Заполните все поля" });
    }

    await deleteExpiredCodes();

    const existingUser = await pool.query(
      "SELECT 1 FROM users WHERE email = $1",
      [normalizedEmail]
    );

    if (existingUser.rows.length) {
      return res.status(400).json({ message: "Пользователь уже существует" });
    }

    const existingCode = await pool.query(
      "SELECT resend_available_at FROM registration_codes WHERE email = $1",
      [normalizedEmail]
    );

    if (existingCode.rows.length) {
      const resendAvailableAt = new Date(existingCode.rows[0].resend_available_at);
      const now = new Date();

      if (resendAvailableAt > now) {
        const secondsLeft = Math.ceil((resendAvailableAt - now) / 1000);

        return res.status(429).json({
          message: `Отправить новый код через ${secondsLeft} сек`,
          secondsLeft,
        });
      }
    }

    const code = generateCode();
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
          attempts = 0
      `,
      [normalizedEmail, passwordHash, hashCode(code)]
    );

    try {
      await sendVerificationEmail(normalizedEmail, code);
    } catch {
      await pool.query("DELETE FROM registration_codes WHERE email = $1", [
        normalizedEmail,
      ]);

      return res.status(500).json({ message: "Не удалось отправить код" });
    }

    res.json({
      message: "Код отправлен на почту",
      resendAfter: RESEND_DELAY_SECONDS,
    });
  } catch {
    res.status(500).json({ message: "Ошибка регистрации" });
  }
});

app.post("/api/auth/register/verify-code", async (req, res) => {
  const client = await pool.connect();

  try {
    const { email, code } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const normalizedCode = code?.trim();

    if (!normalizedEmail || !normalizedCode) {
      return res.status(400).json({ message: "Нет email или кода" });
    }

    await deleteExpiredCodes();
    await client.query("BEGIN");

    const codeResult = await client.query(
      `
        SELECT email, password_hash, code_hash, expires_at, attempts
        FROM registration_codes
        WHERE email = $1
      `,
      [normalizedEmail]
    );

    if (!codeResult.rows.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Код не найден или истёк" });
    }

    const registration = codeResult.rows[0];

    if (new Date(registration.expires_at) < new Date()) {
      await client.query("DELETE FROM registration_codes WHERE email = $1", [
        normalizedEmail,
      ]);
      await client.query("COMMIT");
      return res.status(400).json({ message: "Код не найден или истёк" });
    }

    if (registration.attempts >= MAX_VERIFY_ATTEMPTS) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Превышено число попыток" });
    }

    if (hashCode(normalizedCode) !== registration.code_hash) {
      await client.query(
        "UPDATE registration_codes SET attempts = attempts + 1 WHERE email = $1",
        [normalizedEmail]
      );
      await client.query("COMMIT");
      return res.status(400).json({ message: "Неверный код" });
    }

    const existingUser = await client.query(
      "SELECT 1 FROM users WHERE email = $1",
      [normalizedEmail]
    );

    if (existingUser.rows.length) {
      await client.query("DELETE FROM registration_codes WHERE email = $1", [
        normalizedEmail,
      ]);
      await client.query("COMMIT");
      return res.status(400).json({ message: "Пользователь уже существует" });
    }

    const newUser = await client.query(
      `
        INSERT INTO users (email, password_hash, full_name)
        VALUES ($1, $2, $3)
        RETURNING id, email, full_name, created_at
      `,
      [registration.email, registration.password_hash, null]
    );

    await client.query("DELETE FROM registration_codes WHERE email = $1", [
      normalizedEmail,
    ]);

    await client.query("COMMIT");

    res.status(201).json({
      message: "Регистрация завершена",
      user: newUser.rows[0],
    });
  } catch {
    await client.query("ROLLBACK").catch(() => {});
    res.status(500).json({ message: "Ошибка подтверждения кода" });
  } finally {
    client.release();
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: "Введите email и пароль" });
    }

    const userResult = await pool.query(
      `
        SELECT id, email, full_name, password_hash, created_at
        FROM users
        WHERE email = $1
      `,
      [normalizedEmail]
    );

    if (!userResult.rows.length) {
      return res.status(400).json({ message: "Пользователь не найден" });
    }

    const user = userResult.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(400).json({ message: "Неверный пароль" });
    }

    res.json({
      message: "Вход выполнен успешно",
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        created_at: user.created_at,
      },
    });
  } catch {
    res.status(500).json({ message: "Ошибка входа" });
  }
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});