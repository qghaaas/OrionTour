import { useState } from "react";
import eyeOpen from "./img/eyeOpen.svg";
import eyeClose from "./img/eyeCLose.svg";

const API_URL = "http://localhost:3010/api/auth";

export default function RegistrationForm({ onOpenLogin, onCodeSent }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loadingSend, setLoadingSend] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const resetMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    resetMessages();

    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError("Заполните все поля");
      return;
    }

    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    if (password.length < 6) {
      setError("Пароль должен содержать минимум 6 символов");
      return;
    }

    try {
      setLoadingSend(true);

      const response = await fetch(`${API_URL}/register/send-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Ошибка отправки кода");
        return;
      }

      setSuccess(data.message || "Код отправлен");

      if (onCodeSent) {
        onCodeSent({
          email,
          password,
        });
      }
    } catch (err) {
      setError("Ошибка соединения с сервером");
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

        <input
          type={showPassword ? "text" : "password"}
          placeholder="Повторите пароль"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <button className="auth-activeBTN" type="submit" disabled={loadingSend}>
          {loadingSend ? "Отправка..." : "Зарегистрироваться"}
        </button>

        {error && <p className="auth-error">{error}</p>}
        {success && <p className="auth-success">{success}</p>}
      </form>
    </div>
  );
}