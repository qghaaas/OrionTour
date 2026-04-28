import { useState } from "react";
import eyeOpen from "./img/eyeOpen.svg";
import eyeClose from "./img/eyeCLose.svg";

const API_URL = "http://localhost:3010/api/auth";

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export default function LoginForm({ onOpenRegistration, onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (!normalizedEmail || !normalizedPassword) {
      setError("Введите email и пароль");
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setError("Введите корректный email");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          password: normalizedPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Ошибка входа");
        return;
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("authChanged"));

      setEmail("");
      setPassword("");
      onSuccess?.(data.user);
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2>Вход в личный кабинет</h2>

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

        {error && <p className="auth-error">{error}</p>}

        <button className="auth-activeBTN" type="submit" disabled={loading}>
          {loading ? "Вход..." : "Войти в кабинет"}
        </button>

      </form>

      <button className="auth-notreg" type="button" onClick={onOpenRegistration}>
        Ещё не зарегистрированы?
      </button>
    </>
  );
}