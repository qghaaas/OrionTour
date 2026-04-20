import { useState } from "react";
import eyeOpen from "./img/eyeOpen.svg";
import eyeClose from "./img/eyeCLose.svg";

const API_URL = "http://localhost:3010/api/auth";

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export default function RegistrationForm({ onCodeSent }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();
    const normalizedConfirmPassword = confirmPassword.trim();

    if (
      !normalizedEmail ||
      !normalizedPassword ||
      !normalizedConfirmPassword
    ) {
      setError("Заполните все поля");
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setError("Введите корректный email");
      return;
    }

    if (normalizedPassword.length < 6) {
      setError("Пароль должен содержать минимум 6 символов");
      return;
    }

    if (normalizedPassword !== normalizedConfirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/register/send-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          password: normalizedPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Ошибка отправки кода");
        return;
      }

      onCodeSent?.({
        email: normalizedEmail,
        password: normalizedPassword,
      });
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2>Регистрация</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="password-field">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword((prev) => !prev)}
          >
            <img src={showPassword ? eyeClose : eyeOpen} alt="Показать пароль" />
          </button>
        </div>

        <input
          type={showPassword ? "text" : "password"}
          placeholder="Повторите пароль"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {error && <p className="auth-error">{error}</p>}

        <button className="auth-activeBTN" type="submit" disabled={loading}>
          {loading ? "Отправка..." : "Зарегистрироваться"}
        </button>

      </form>
    </>
  );
}