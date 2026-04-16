import { useState } from 'react';
import './Logtest.css';

const API_URL = 'http://localhost:3010/api/auth';

export default function LoginUser() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async () => {
    setError('');
    setSuccess('');

    if (!email.trim() || !password.trim()) {
      setError('Введите email и пароль');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Ошибка входа');
        return;
      }

      setSuccess(data.message || 'Вход выполнен успешно');

      localStorage.setItem('user', JSON.stringify(data.user));

      setEmail('');
      setPassword('');
    } catch (err) {
      setError('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-card">
      <h2 className="login-title">Вход</h2>

      <div className="login-form">
        <input
          type="email"
          placeholder="Введите email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Введите пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="login-btn"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? 'Вход...' : 'Войти'}
        </button>

        {error && <p className="login-message error">{error}</p>}
        {success && <p className="login-message success">{success}</p>}
      </div>
    </div>
  );
}