import { useState } from "react";
import eyeOpen from "./img/eyeOpen.svg";
import eyeClose from "./img/eyeCLose.svg";


const API_URL = "http://localhost:3010/api/auth";

export default function LoginForm({
  onOpenRegistration,
  onForgotPassword,
  onSuccess,
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!email.trim() || !password.trim()) {
      setError("Введите email и пароль");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Ошибка входа");
        return;
      }

      setSuccess(data.message || "Вход выполнен успешно");

      localStorage.setItem("user", JSON.stringify(data.user));

      if (onSuccess) {
        onSuccess(data.user);
      }

      setEmail("");
      setPassword("");
    } catch (err) {
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
          required
        />

        <div className="password-field">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
          >
            <img src={showPassword ? eyeClose : eyeOpen} alt="" />
          </button>
        </div>

        <button className="auth-forgot" type="button" onClick={onForgotPassword}>
          Забыли пароль?
        </button>

        <button className="auth-activeBTN" type="submit" disabled={loading}>
          {loading ? "Вход..." : "Войти в кабинет"}
        </button>

        {error && <p className="auth-error">{error}</p>}
        {success && <p className="auth-success">{success}</p>}
      </form>

      <button className="auth-notreg" type="button" onClick={onOpenRegistration}>
        Ещё не зарегистрированы?
      </button>
    </>
  );
}