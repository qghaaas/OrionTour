import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Admin.css'

const API_URL = 'http://localhost:3010';

export default function AdminPanel() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('contacts');
    const [contacts, setContacts] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [reviewStatus, setReviewStatus] = useState('pending');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    

    const token = localStorage.getItem('adminToken');

    const adminFetch = async (url, options = {}) => {
        const response = await fetch(`${API_URL}${url}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                ...(options.headers || {})
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Ошибка запроса');
        }

        return data;
    };

    const loadContacts = async () => {
        try {
            setIsLoading(true);
            setMessage('');

            const data = await adminFetch('/api/admin/contact-requests');
            setContacts(data);
        } catch (error) {
            if (error.message === 'Нет доступа') {
                localStorage.removeItem('adminToken');
                navigate('/admin/login');
                return;
            }

            setMessage(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const loadReviews = async () => {
        try {
            setIsLoading(true);
            setMessage('');

            const data = await adminFetch(`/api/admin/reviews?status=${reviewStatus}`);
            setReviews(data);
        } catch (error) {
            if (error.message === 'Нет доступа') {
                localStorage.removeItem('adminToken');
                navigate('/admin/login');
                return;
            }

            setMessage(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!token) {
            navigate('/admin/login');
            return;
        }

        if (activeTab === 'contacts') {
            loadContacts();
        }

        if (activeTab === 'reviews') {
            loadReviews();
        }
    }, [activeTab, reviewStatus]);

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
    };

    const approveReview = async (id) => {
        try {
            await adminFetch(`/api/admin/reviews/${id}/approve`, {
                method: 'PATCH'
            });

            await loadReviews();
        } catch (error) {
            setMessage(error.message);
        }
    };

    const deleteReview = async (id) => {
        const isConfirmed = window.confirm('Удалить отзыв?');

        if (!isConfirmed) {
            return;
        }

        try {
            await adminFetch(`/api/admin/reviews/${id}`, {
                method: 'DELETE'
            });

            await loadReviews();
        } catch (error) {
            setMessage(error.message);
        }
    };

    return (
        <section className="admin-panel">
            <div className="admin-panel-header">
                <h1>Админ-панель</h1>

                <button type="button" onClick={handleLogout}>
                    Выйти
                </button>
            </div>

            <div className="admin-tabs">
                <button
                    type="button"
                    className={activeTab === 'contacts' ? 'active' : ''}
                    onClick={() => setActiveTab('contacts')}
                >
                    Обращения
                </button>

                <button
                    type="button"
                    className={activeTab === 'reviews' ? 'active' : ''}
                    onClick={() => setActiveTab('reviews')}
                >
                    Отзывы
                </button>
            </div>

            {message && (
                <p className="admin-message">
                    {message}
                </p>
            )}

            {isLoading && (
                <p>Загрузка...</p>
            )}

            {!isLoading && activeTab === 'contacts' && (
                <div className="admin-section">
                    <h2>Обращения с формы</h2>

                    {contacts.length === 0 && (
                        <p>Обращений пока нет.</p>
                    )}

                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>ФИО</th>
                                    <th>Телефон</th>
                                    <th>Email</th>
                                    <th>Вопрос</th>
                                    <th>Дата</th>
                                </tr>
                            </thead>

                            <tbody>
                                {contacts.map((item) => (
                                    <tr key={item.id}>
                                        <td>{item.id}</td>
                                        <td>{item.full_name}</td>
                                        <td>{item.phone}</td>
                                        <td>{item.email || '—'}</td>
                                        <td>{item.question}</td>
                                        <td>
                                            {new Date(item.created_at).toLocaleString('ru-RU')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {!isLoading && activeTab === 'reviews' && (
                <div className="admin-section">
                    <div className="admin-section-top">
                        <h2>Модерация отзывов</h2>

                        <select
                            value={reviewStatus}
                            onChange={(event) => setReviewStatus(event.target.value)}
                        >
                            <option value="pending">На модерации</option>
                            <option value="active">Опубликованные</option>
                            <option value="all">Все отзывы</option>
                        </select>
                    </div>

                    {reviews.length === 0 && (
                        <p>Отзывов нет.</p>
                    )}

                    <div className="admin-review-list">
                        {reviews.map((review) => (
                            <div className="admin-review-card" key={review.id}>
                                <div className="admin-review-card-top">
                                    <div>
                                        <strong>{review.author_name}</strong>
                                        <p>{review.user_email || 'Email не указан'}</p>
                                    </div>

                                    <span className={review.is_active ? 'admin-status active' : 'admin-status pending'}>
                                        {review.is_active ? 'Опубликован' : 'На модерации'}
                                    </span>
                                </div>

                                <p className="admin-review-rating">
                                    Оценка: {review.rating}/5
                                </p>

                                <p className="admin-review-text">
                                    {review.review_text}
                                </p>

                                <small>
                                    {new Date(review.created_at).toLocaleString('ru-RU')}
                                </small>

                                <div className="admin-review-actions">
                                    {!review.is_active && (
                                        <button
                                            type="button"
                                            onClick={() => approveReview(review.id)}
                                        >
                                            Опубликовать
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        className="danger"
                                        onClick={() => deleteReview(review.id)}
                                    >
                                        Удалить
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}