import { useState } from "react";
import eyeOpen from './img/eyeOpen.svg'
import eyeClose from './img/eyeCLose.svg'

export default function RegistrationForm({
  onOpenLogin,
  onCodeSent,
}) {
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onCodeSent(email);
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
            required
          />

          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
          >
            <img
              src={showPassword ? eyeClose : eyeOpen}
              alt=""
            />
          </button>
        </div>

        <input
          type={showPassword ? "text" : "password"}
          placeholder="Повторите пароль"
          required
        />

        <button className="auth-activeBTN" type="submit">
          Зарегистрироваться
        </button>
      </form>
    </div>
  );
}