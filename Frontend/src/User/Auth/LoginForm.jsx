import { useState } from "react";
import eyeOpen from './img/eyeOpen.svg'
import eyeClose from './img/eyeCLose.svg'

export default function LoginForm({
  onOpenRegistration,
  onForgotPassword,
  onSuccess,
}) {
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSuccess();
  };

  return (
    <>
      <h2>Вход в личный кабинет</h2>

      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="E-mail" required />

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

        <button className="auth-forgot" type="button" onClick={onForgotPassword}>
          Забыли пароль?
        </button>

        <button className="auth-activeBTN" type="submit">
          Войти в кабинет
        </button>
      </form>

      <button className="auth-notreg" type="button" onClick={onOpenRegistration}>
        Ещё не зарегистрированы?
      </button>
    </>
  );
}