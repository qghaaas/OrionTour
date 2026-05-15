import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "../Admin.css";

export default function AdminAuth() {
    const navigate = useNavigate();

    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage('');

        try {
            setIsLoading(true);

            const response = await fetch('http://localhost:3010/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    login,
                    password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Ошибка входа');
            }

            localStorage.setItem('adminToken', data.token);

            navigate('/admin');
        } catch (error) {
            setMessage(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="admin-login-page">
            <form className="admin-login-form" onSubmit={handleSubmit}>
                <h1>Вход в админ-панель</h1>

                <input
                    type="text"
                    placeholder="Логин"
                    value={login}
                    onChange={(event) => setLogin(event.target.value)}
                    required
                />

                <input
                    type="password"
                    placeholder="Пароль"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                />

                {message && (
                    <p className="admin-message">
                        {message}
                    </p>
                )}

                <button type="submit" disabled={isLoading}>
                    {isLoading ? 'Вход...' : 'Войти'}
                </button>
            </form>
        </section>
    );
}