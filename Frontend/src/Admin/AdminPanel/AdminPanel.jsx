import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Admin.css'

const ORDER_STATUS_OPTIONS = [
    { value: 'new', label: 'Новая заявка' },
    { value: 'pending', label: 'В обработке' },
    { value: 'confirmed', label: 'Подтверждён' },
    { value: 'paid', label: 'Оплачен' },
    { value: 'completed', label: 'Завершён' },
    { value: 'cancelled', label: 'Отменён' }
];

const ORDER_FILTER_OPTIONS = [
    { value: 'active', label: 'Активные' },
    { value: 'new', label: 'Новые' },
    { value: 'pending', label: 'В обработке' },
    { value: 'confirmed', label: 'Подтверждённые' },
    { value: 'paid', label: 'Оплаченные' },
    { value: 'inactive', label: 'Неактивные' },
    { value: 'all', label: 'Все заказы' }
];

function formatDate(date) {
    if (!date) return 'Уточняется';

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return date;
    }

    return parsedDate.toLocaleDateString('ru-RU');
}

function formatPrice(value) {
    const price = Number(value);

    if (!Number.isFinite(price)) {
        return 'Стоимость уточняется';
    }

    return `${price.toLocaleString('ru-RU')} ₽`;
}

function getOrderStatusLabel(status) {
    return ORDER_STATUS_OPTIONS.find((option) => option.value === status)?.label || status || 'Статус не указан';
}

export default function AdminPanel() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('contacts');
    const [contacts, setContacts] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [orders, setOrders] = useState([]);
    const [reviewStatus, setReviewStatus] = useState('pending');
    const [orderStatus, setOrderStatus] = useState('active');
    const [orderDrafts, setOrderDrafts] = useState({});
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [processingOrderId, setProcessingOrderId] = useState(null);

    const API_URL = 'http://localhost:3010';
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

        const data = await response.json().catch(() => ({}));

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

    const loadOrders = async () => {
        try {
            setIsLoading(true);
            setMessage('');

            const data = await adminFetch(`/api/admin/orders?status=${orderStatus}`);
            const nextOrders = Array.isArray(data.orders) ? data.orders : [];

            setOrders(nextOrders);
            setOrderDrafts(
                nextOrders.reduce((acc, order) => {
                    acc[order.id] = {
                        status: order.status || 'new',
                        manager_comment: order.manager_comment || ''
                    };

                    return acc;
                }, {})
            );
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

        if (activeTab === 'orders') {
            loadOrders();
        }
    }, [activeTab, reviewStatus, orderStatus]);

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

    const changeOrderDraft = (orderId, field, value) => {
        setOrderDrafts((prev) => ({
            ...prev,
            [orderId]: {
                ...(prev[orderId] || {}),
                [field]: value
            }
        }));
    };

    const updateOrder = async (orderId) => {
        const draft = orderDrafts[orderId];

        if (!draft?.status) {
            setMessage('Выберите статус заказа');
            return;
        }

        try {
            setProcessingOrderId(orderId);
            setMessage('');

            await adminFetch(`/api/admin/orders/${orderId}/status`, {
                method: 'PATCH',
                body: JSON.stringify({
                    status: draft.status,
                    manager_comment: draft.manager_comment || ''
                })
            });

            setMessage('Заказ обновлён. Пользователь увидит новый статус в личном кабинете.');
            await loadOrders();
        } catch (error) {
            setMessage(error.message);
        } finally {
            setProcessingOrderId(null);
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

                <button
                    type="button"
                    className={activeTab === 'orders' ? 'active' : ''}
                    onClick={() => setActiveTab('orders')}
                >
                    Заказы
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
                                        className="danger"
                                        type="button"
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

            {!isLoading && activeTab === 'orders' && (
                <div className="admin-section">
                    <div className="admin-section-top">
                        <div>
                            <h2>Заказы пользователей</h2>
                            <p className="admin-section-subtitle">
                                Новая заявка появляется здесь сразу после нажатия «Забронировать» на странице тура.
                            </p>
                        </div>

                        <select
                            value={orderStatus}
                            onChange={(event) => setOrderStatus(event.target.value)}
                        >
                            {ORDER_FILTER_OPTIONS.map((option) => (
                                <option value={option.value} key={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {orders.length === 0 && (
                        <p>Заказов пока нет.</p>
                    )}

                    <div className="admin-order-list">
                        {orders.map((order) => {
                            const draft = orderDrafts[order.id] || {
                                status: order.status || 'new',
                                manager_comment: order.manager_comment || ''
                            };

                            return (
                                <div className="admin-order-card" key={order.id}>
                                    <div className="admin-order-main">
                                        <div className="admin-order-image">
                                            {order.image ? (
                                                <img src={order.image} alt={order.title} />
                                            ) : (
                                                <span>ORION TOUR</span>
                                            )}
                                        </div>

                                        <div className="admin-order-info">
                                            <div className="admin-order-topline">
                                                <span className="admin-order-number">Заказ №{order.id}</span>
                                                <span className={`admin-order-status admin-order-status-${order.status}`}>
                                                    {getOrderStatusLabel(order.status)}
                                                </span>
                                            </div>

                                            <h3>{order.title || 'Тур не указан'}</h3>

                                            <p className="admin-order-user">
                                                Клиент: {order.user_full_name || 'Без имени'} · {order.user_email || 'email не указан'}
                                            </p>

                                            <div className="admin-order-grid">
                                                <span>Направление: <strong>{order.country || '—'}</strong></span>
                                                <span>Даты: <strong>{formatDate(order.start_date)} — {formatDate(order.end_date)}</strong></span>
                                                <span>Туристы: <strong>{order.people_count || 1}</strong></span>
                                                <span>Стоимость: <strong>{formatPrice(order.total_price)}</strong></span>
                                            </div>

                                            {order.user_comment && (
                                                <p className="admin-order-comment">
                                                    Комментарий клиента: {order.user_comment}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="admin-order-controls">
                                        <label>
                                            Статус
                                            <select
                                                value={draft.status}
                                                onChange={(event) => changeOrderDraft(order.id, 'status', event.target.value)}
                                            >
                                                {ORDER_STATUS_OPTIONS.map((option) => (
                                                    <option value={option.value} key={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>

                                        <label>
                                            Комментарий менеджера
                                            <textarea
                                                value={draft.manager_comment}
                                                onChange={(event) => changeOrderDraft(order.id, 'manager_comment', event.target.value)}
                                                placeholder="Например: менеджер проверяет наличие мест, скоро свяжемся"
                                                rows={3}
                                            />
                                        </label>

                                        <button
                                            type="button"
                                            onClick={() => updateOrder(order.id)}
                                            disabled={processingOrderId === order.id}
                                        >
                                            {processingOrderId === order.id ? 'Сохранение...' : 'Сохранить'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </section>
    );
}
