import '../../main.css';
import './Account.css';

import order from './img/order.svg';
import favorites from './img/favorites.svg';
import star from './img/star.svg';
import wrench from './img/wrench.svg';

import { useEffect, useState } from 'react';

import OrdersContent from './Components/OrdersContent/OrdersContent';
import FavoritesContent from './Components/FavoritesContent';

const AVATAR_OPTIONS = [
    {
        label: 'Синий',
        value: '/uploads/avatars/orion-avatar-blue.png'
    },
    {
        label: 'Зелёный',
        value: '/uploads/avatars/orion-avatar-green.png'
    },
    {
        label: 'Оранжевый',
        value: '/uploads/avatars/orion-avatar-orange.png'
    },
    {
        label: 'Красный',
        value: '/uploads/avatars/orion-avatar-red.png'
    },
    {
        label: 'Фиолетовый',
        value: '/uploads/avatars/orion-avatar-purple.png'
    }
];

const API_URL = 'http://localhost:3010';

function getAvatarSrc(avatarUrl) {
    if (!avatarUrl) return '';

    if (avatarUrl.startsWith('http')) {
        return avatarUrl;
    }

    return `${API_URL}${avatarUrl}`;
}

export default function Account() {
    const [active, setActive] = useState('orders');
    const [ordersTab, setOrdersTab] = useState('active');

    const user = JSON.parse(localStorage.getItem('user'));

    const [profileName, setProfileName] = useState(user?.full_name || '');
    const [profileAvatar, setProfileAvatar] = useState(user?.avatar_url || '');

    const [settingsName, setSettingsName] = useState(user?.full_name || '');
    const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar_url || '');
    const [settingsMessage, setSettingsMessage] = useState('');
    const [isSettingsSubmitting, setIsSettingsSubmitting] = useState(false);

    const [reviews, setReviews] = useState([]);
    const [authorName, setAuthorName] = useState('');
    const [rating, setRating] = useState(5);
    const [reviewText, setReviewText] = useState('');
    const [reviewMessage, setReviewMessage] = useState('');
    const [isReviewsLoading, setIsReviewsLoading] = useState(false);
    const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('authChanged'));
        window.location.href = '/';
    };

    const loadReviews = async () => {
        if (!user?.id) return;

        try {
            setIsReviewsLoading(true);
            setReviewMessage('');

            const response = await fetch(`${API_URL}/api/users/${user.id}/reviews`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Ошибка загрузки отзывов');
            }

            setReviews(data);
        } catch (error) {
            setReviewMessage(error.message);
        } finally {
            setIsReviewsLoading(false);
        }
    };

    useEffect(() => {
        if (active === 'reviews') {
            loadReviews();
        }

        if (active === 'settings') {
            setSettingsName(profileName);
            setSelectedAvatar(profileAvatar);
            setSettingsMessage('');
        }
    }, [active, user?.id]);

    const handleReviewSubmit = async (event) => {
        event.preventDefault();
        setReviewMessage('');

        if (!user?.id) {
            setReviewMessage('Необходимо войти в аккаунт');
            return;
        }

        if (!authorName.trim()) {
            setReviewMessage('Введите имя');
            return;
        }

        if (authorName.trim().length < 2) {
            setReviewMessage('Имя должно содержать минимум 2 символа');
            return;
        }

        if (!reviewText.trim()) {
            setReviewMessage('Введите текст отзыва');
            return;
        }

        if (reviewText.trim().length < 10) {
            setReviewMessage('Отзыв должен содержать минимум 10 символов');
            return;
        }

        try {
            setIsReviewSubmitting(true);

            const response = await fetch(`${API_URL}/api/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: user.id,
                    author_name: authorName.trim(),
                    rating,
                    review_text: reviewText.trim()
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Ошибка отправки отзыва');
            }

            setReviewMessage('Отзыв отправлен на модерацию');
            setAuthorName('');
            setReviewText('');
            setRating(5);

            await loadReviews();
        } catch (error) {
            setReviewMessage(error.message);
        } finally {
            setIsReviewSubmitting(false);
        }
    };

    const handleProfileSubmit = async (event) => {
        event.preventDefault();
        setSettingsMessage('');

        if (!user?.id) {
            setSettingsMessage('Необходимо войти в аккаунт');
            return;
        }

        if (settingsName.trim() && settingsName.trim().length < 2) {
            setSettingsMessage('Никнейм должен содержать минимум 2 символа');
            return;
        }

        try {
            setIsSettingsSubmitting(true);

            const response = await fetch(`${API_URL}/api/users/${user.id}/profile`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    full_name: settingsName.trim(),
                    avatar_url: selectedAvatar
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Ошибка сохранения профиля');
            }

            localStorage.setItem('user', JSON.stringify(data.user));

            setProfileName(data.user.full_name || '');
            setProfileAvatar(data.user.avatar_url || '');
            setSettingsMessage('Профиль сохранён');

            window.dispatchEvent(new Event('authChanged'));
        } catch (error) {
            setSettingsMessage(error.message);
        } finally {
            setIsSettingsSubmitting(false);
        }
    };

    const renderReviewsContent = () => {
        return (
            <div className="account-reviews">
                <h2>Мои отзывы</h2>

                <form className="account-review-form" onSubmit={handleReviewSubmit}>
                    <label>
                        Ваше имя
                        <input
                            type="text"
                            value={authorName}
                            onChange={(event) => setAuthorName(event.target.value)}
                            placeholder="Введите имя"
                        />
                    </label>

                    <label>
                        Оценка
                        <select
                            value={rating}
                            onChange={(event) => setRating(Number(event.target.value))}
                        >
                            <option value={5}>5 звёзд</option>
                            <option value={4}>4 звезды</option>
                            <option value={3}>3 звезды</option>
                            <option value={2}>2 звезды</option>
                            <option value={1}>1 звезда</option>
                        </select>
                    </label>

                    <label>
                        Текст отзыва
                        <textarea
                            value={reviewText}
                            onChange={(event) => setReviewText(event.target.value)}
                            placeholder="Расскажите о вашем опыте"
                            rows={5}
                        />
                    </label>

                    <button
                        type="submit"
                        className="main-btn_site"
                        disabled={isReviewSubmitting}
                    >
                        {isReviewSubmitting ? 'Отправка...' : 'Отправить отзыв'}
                    </button>
                </form>

                {reviewMessage && (
                    <p className="account-review-message">
                        {reviewMessage}
                    </p>
                )}

                <div className="account-review-list">
                    <h3>История отзывов</h3>

                    {isReviewsLoading && (
                        <p>Загрузка...</p>
                    )}

                    {!isReviewsLoading && reviews.length === 0 && (
                        <p>Вы ещё не оставляли отзывы.</p>
                    )}

                    {!isReviewsLoading && reviews.map((review) => (
                        <div className="account-review-card" key={review.id}>
                            <div className="account-review-card-top">
                                <strong>
                                    Оценка: {review.rating}/5
                                </strong>

                                <span
                                    className={
                                        review.is_active
                                            ? 'review-status active'
                                            : 'review-status pending'
                                    }
                                >
                                    {review.is_active ? 'Опубликован' : 'На модерации'}
                                </span>
                            </div>

                            <p className="account-review-author">
                                {review.author_name}
                            </p>

                            <p>{review.review_text}</p>

                            <small>
                                {new Date(review.created_at).toLocaleString('ru-RU')}
                            </small>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderSettingsContent = () => {
        return (
            <div className="account-settings">
                <h2>Настройки профиля</h2>

                <form className="account-settings-form" onSubmit={handleProfileSubmit}>
                    <label>
                        Никнейм
                        <input
                            type="text"
                            value={settingsName}
                            onChange={(event) => setSettingsName(event.target.value)}
                            placeholder="Введите никнейм"
                            maxLength={50}
                        />
                    </label>

                    <div className="account-avatar-settings">
                        <p>Выберите аватар</p>

                        <div className="account-avatar-list">
                            {AVATAR_OPTIONS.map((avatar) => (
                                <button
                                    type="button"
                                    key={avatar.value}
                                    className={
                                        selectedAvatar === avatar.value
                                            ? 'account-avatar-option active'
                                            : 'account-avatar-option'
                                    }
                                    onClick={() => setSelectedAvatar(avatar.value)}
                                >
                                    <img
                                        src={getAvatarSrc(avatar.value)}
                                        alt={avatar.label}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {settingsMessage && (
                        <p className="account-settings-message">
                            {settingsMessage}
                        </p>
                    )}

                    <button
                        type="submit"
                        className="main-btn_site"
                        disabled={isSettingsSubmitting}
                    >
                        {isSettingsSubmitting ? 'Сохранение...' : 'Сохранить'}
                    </button>
                </form>
            </div>
        );
    };

    const renderContent = () => {
        if (active === 'orders') {
            return <OrdersContent ordersTab={ordersTab} />;
        }

        if (active === 'favorites') {
            return <FavoritesContent />;
        }

        if (active === 'reviews') {
            return renderReviewsContent();
        }

        if (active === 'settings') {
            return renderSettingsContent();
        }

        return <OrdersContent ordersTab={ordersTab} />;
    };

    return (
        <section className="account">
            <h1 className="name-title_page">Личный кабинет</h1>

            <div className="account-inner">
                <aside className="account-aside">
                    <div className="account-aside_user">
                        <div className="user-avatar">
                            {profileAvatar && (
                                <img
                                    src={getAvatarSrc(profileAvatar)}
                                    alt="Аватар пользователя"
                                />
                            )}
                        </div>

                        <p>{profileName || 'Новый пользователь'}</p>
                        <span>{user?.email || 'email не указан'}</span>
                    </div>

                    <ul className="aside_select-list">
                        <li className={`orders-item ${active === 'orders' ? 'active' : ''}`}>
                            <div className="aside-item-main">
                                <img src={order} alt="Заказы" />

                                <button
                                    type="button"
                                    onClick={() => {
                                        setActive('orders');
                                        setOrdersTab('active');
                                    }}
                                >
                                    Заказы
                                </button>
                            </div>

                            <ul className={`aside_select-list-nested ${active === 'orders' ? 'show' : ''}`}>
                                <li>
                                    <button
                                        type="button"
                                        className={ordersTab === 'active' ? 'active-nested' : ''}
                                        onClick={() => {
                                            setActive('orders');
                                            setOrdersTab('active');
                                        }}
                                    >
                                        Активные
                                    </button>
                                </li>

                                <li>
                                    <button
                                        type="button"
                                        className={ordersTab === 'inactive' ? 'active-nested' : ''}
                                        onClick={() => {
                                            setActive('orders');
                                            setOrdersTab('inactive');
                                        }}
                                    >
                                        Неактивные
                                    </button>
                                </li>
                            </ul>
                        </li>

                        <li className={active === 'favorites' ? 'active' : ''}>
                            <img src={favorites} alt="Избранное" />

                            <button
                                type="button"
                                onClick={() => setActive('favorites')}
                            >
                                Избранное
                            </button>
                        </li>

                        <li className={active === 'reviews' ? 'active' : ''}>
                            <img src={star} alt="Мои отзывы" />

                            <button
                                type="button"
                                onClick={() => setActive('reviews')}
                            >
                                Мои отзывы
                            </button>
                        </li>

                        <li className={active === 'settings' ? 'active' : ''}>
                            <img src={wrench} alt="Настройки профиля" />

                            <button
                                type="button"
                                onClick={() => setActive('settings')}
                            >
                                Настройки профиля
                            </button>
                        </li>
                    </ul>

                    <button
                        className="exit-account"
                        type="button"
                        onClick={handleLogout}
                    >
                        Выход
                    </button>
                </aside>

                <div className="active-content">
                    {renderContent()}
                </div>
            </div>
        </section>
    );
}