import { useState } from "react";
import eyeOpen from "./img/eyeOpen.svg";
import eyeClose from "./img/eyeCLose.svg";

const API_URL = "http://localhost:3010/api/auth";

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const NETWORK_ERROR_MESSAGE =
  "Не удалось подключиться к серверу. Проверьте интернет-соединение, отключите VPN или прокси и повторите попытку.";

const getResponseData = async (response) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

const getRegistrationErrorMessage = (status, data) => {
  const serverMessage = data?.message;
  const serverCode = data?.code;

  if (serverCode === "EMAIL_EXISTS" || status === 409) {
    return "Пользователь с такой почтой уже зарегистрирован. Попробуйте войти в аккаунт.";
  }

  if (serverCode === "INVALID_EMAIL") {
    return "Введите корректный адрес электронной почты.";
  }

  if (status === 400) {
    return serverMessage || "Проверьте правильность заполнения формы.";
  }

  if (status === 401 || status === 403) {
    return "Сервер отклонил запрос регистрации. Попробуйте отключить VPN или прокси и повторить попытку.";
  }

  if (status === 404) {
    return "Адрес регистрации не найден на сервере. Проверьте настройки API.";
  }
1233
  if (status === 429) {
    return "Слишком много попыток регистрации. Подождите несколько минут и попробуйте снова.";
  }

  if (status === 500 || status === 502 || status === 503 || status === 504) {
    return "Сервер временно недоступен. (Попробуйте отключить VPN или прокси и повторить попытку.)";
  }

  return (
    serverMessage ||
    "Не удалось зарегистрироваться. Проверьте соединение, отключите VPN и повторите попытку."
  );
};

export default function RegistrationForm({ onOpenLogin, onCodeSent }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loadingSend, setLoadingSend] = useState(false);

  const [error, setError] = useState("");

  const resetMessages = () => {
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    resetMessages();

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();
    const normalizedConfirmPassword = confirmPassword.trim();

    if (!normalizedEmail || !normalizedPassword || !normalizedConfirmPassword) {
      setError("Заполните все поля.");
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setError("Введите корректный адрес электронной почты.");
      return;
    }

    if (normalizedPassword !== normalizedConfirmPassword) {
      setError("Пароли не совпадают.");
      return;
    }

    if (normalizedPassword.length < 6) {
      setError("Пароль должен содержать минимум 6 символов.");
      return;
    }

    try {
      setLoadingSend(true);

      const response = await fetch(`${API_URL}/register/send-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          password: normalizedPassword,
        }),
      });

      const data = await getResponseData(response);

      if (!response.ok) {
        setError(getRegistrationErrorMessage(response.status, data));
        return;
      }

      onCodeSent?.({
        email: normalizedEmail,
        password: normalizedPassword,
      });
    } catch {
      setError(NETWORK_ERROR_MESSAGE);
    } finally {
      setLoadingSend(false);
    }
  };

  return (
    <div>
      <h2>Регистрация</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="E-mail"
          value={email}
          autoComplete="email"
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <div className="password-field">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Пароль"
            value={password}
            autoComplete="new-password"
            onChange={(e) => setPassword(e.target.value)}
            required
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

        <input
          type={showPassword ? "text" : "password"}
          placeholder="Повторите пароль"
          value={confirmPassword}
          autoComplete="new-password"
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        {error && <p className="auth-error">{error}</p>}

        <button className="auth-activeBTN" type="submit" disabled={loadingSend}>
          {loadingSend ? "Отправка..." : "Зарегистрироваться"}
        </button>
      </form>

      {onOpenLogin && (
        <button className="auth-notreg" type="button" onClick={onOpenLogin}>
          Уже зарегистрированы?
        </button>
      )}
    </div>
  );
}