import { useEffect, useState } from 'react';
import './Regtest.css';

const API_URL = 'http://localhost:3010/api/auth';

export default function RegisterWithCode() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');

  const [codeSent, setCodeSent] = useState(false);
  const [timer, setTimer] = useState(0);

  const [loadingSend, setLoadingSend] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  const resetMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleSendCode = async () => {
    resetMessages();

    if (!fullName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Заполните все поля');
      return;
    }

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    try {
      setLoadingSend(true);

      const response = await fetch(`${API_URL}/register/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Ошибка отправки кода');
        return;
      }

      setCodeSent(true);
      setTimer(data.resendAfter || 30);
      setSuccess(data.message || 'Код отправлен');
    } catch (err) {
      setError('Ошибка соединения с сервером');
    } finally {
      setLoadingSend(false);
    }
  };

  const handleVerifyCode = async () => {
    resetMessages();

    if (!code.trim()) {
      setError('Введите код');
      return;
    }

    try {
      setLoadingVerify(true);

      const response = await fetch(`${API_URL}/register/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Ошибка подтверждения кода');
        return;
      }

      setSuccess(data.message || 'Регистрация завершена');
      setCode('');
      setCodeSent(false);
      setTimer(0);

      setFullName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError('Ошибка соединения с сервером');
    } finally {
      setLoadingVerify(false);
    }
  };

  const handleResendCode = async () => {
    if (timer > 0) return;
    await handleSendCode();
  };

  return (
    <div className="register-card">
      <h2 className="register-title">Регистрация</h2>

      <div className="register-form">
        <input
          type="text"
          placeholder="ФИО"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          disabled={codeSent}
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={codeSent}
        />

        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={codeSent}
        />

        <input
          type="password"
          placeholder="Повторите пароль"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={codeSent}
        />

        {!codeSent && (
          <button
            className="primary-btn"
            onClick={handleSendCode}
            disabled={loadingSend}
          >
            {loadingSend ? 'Отправка...' : 'Зарегистрироваться'}
          </button>
        )}

        {codeSent && (
          <div className="code-block">
            <input
              type="text"
              placeholder="Введите 4-значный код"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={4}
            />

            <button
              className="primary-btn"
              onClick={handleVerifyCode}
              disabled={loadingVerify}
            >
              {loadingVerify ? 'Проверка...' : 'Подтвердить код'}
            </button>

            <button
              className="secondary-btn"
              onClick={handleResendCode}
              disabled={timer > 0 || loadingSend}
            >
              {timer > 0
                ? `Отправить новый код через ${timer} сек`
                : 'Отправить новый код'}
            </button>
          </div>
        )}

        {error && <p className="message error">{error}</p>}
        {success && <p className="message success">{success}</p>}
      </div>
    </div>
  );
}