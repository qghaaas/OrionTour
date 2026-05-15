import { useState } from "react";
import eyeOpen from "./img/eyeOpen.svg";
import eyeClose from "./img/eyeCLose.svg";

const API_URL = "http://localhost:3010/api/auth";

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const NETWORK_ERROR_MESSAGE =
  "Не удалось подключиться к серверу. Проверьте интернет-соединение, отключите VPN или прокси и попробуйте снова.";

const getLoginErrorMessage = (status, serverMessage) => {
  if (serverMessage) return serverMessage;

  switch (status) {
    case 400:
      return "Проверьте корректность email и пароля.";
    case 401:
    case 403:
      return "Неверный email или пароль.";
    case 404:
      return "Аккаунт с такой почтой не найден.";
    case 429:
      return "Слишком много попыток входа. Подождите несколько минут и попробуйте снова.";
    case 500:
    case 502:
    case 503:
    case 504:
      return "Сервер временно недоступен. Попробуйте войти позже.";
    default:
      return "Не удалось войти в аккаунт. Проверьте данные и попробуйте снова.";
  }
};

const getResponseData = async (response) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

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
      setError("Введите email и пароль.");
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setError("Введите корректный email.");
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

      const data = await getResponseData(response);

      if (!response.ok) {
        setError(getLoginErrorMessage(response.status, data.message));
        return;
      }

      if (!data.user) {
        setError("Сервер не вернул данные пользователя. Попробуйте войти позже.");
        return;
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("authChanged"));

      setEmail("");
      setPassword("");

      onSuccess?.(data.user);
    } catch {
      setError(NETWORK_ERROR_MESSAGE);
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
          autoComplete="email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="password-field">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Пароль"
            value={password}
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="button"
            className="password-toggle"
            aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
            onClick={() => setShowPassword((prev) => !prev)}
          >
            <img
              src={showPassword ? eyeClose : eyeOpen}
              alt=""
              aria-hidden="true"
            />
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