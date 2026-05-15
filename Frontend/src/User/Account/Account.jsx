import '../../main.css';
import './Account.css';
import order from './img/order.svg';
import favorites from './img/favorites.svg';
import star from './img/star.svg';
import wrench from './img/wrench.svg';
import { useCallback, useEffect, useState } from 'react';
import OrdersContent from './Components/OrdersContent/OrdersContent';
import FavoritesContent from './Components/FavoritesContent';

const API_URL = 'http://localhost:3010';

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

function getStoredUser() {
    try {
        return JSON.parse(localStorage.getItem('user'));
    } catch {
        localStorage.removeItem('user');
        return null;
    }
}

function getAvatarSrc(avatarUrl) {
    if (!avatarUrl) return '';

    return avatarUrl.startsWith('http')
        ? avatarUrl
        : `${API_URL}${avatarUrl}`;
}

async function fetchJson(url, options = {}, fallbackMessage = 'Ошибка запроса') {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || fallbackMessage);
    }

    return data;
}

function RatingStars({ value, onChange }) {
    const [hoveredRating, setHoveredRating] = useState(0);

    const isInteractive = typeof onChange === 'function';
    const currentRating = Number(hoveredRating || value) || 0;

    return (
        <div
            className={
                isInteractive
                    ? 'account-rating-stars account-rating-stars-interactive'
                    : 'account-rating-stars'
            }
            onMouseLeave={isInteractive ? () => setHoveredRating(0) : undefined}
        >
            {[1, 2, 3, 4, 5].map((starValue) => {
                const isActive = starValue <= currentRating;

                if (!isInteractive) {
                    return (
                        <span
                            key={starValue}
                            className={`account-rating-star ${isActive ? 'active' : ''}`}
                        >
                            <img src={star} alt="" />
                        </span>
                    );
                }

                return (
                    <button
                        key={starValue}
                        type="button"
                        className={`account-rating-star ${isActive ? 'active' : ''}`}
                        onMouseEnter={() => setHoveredRating(starValue)}
                        onFocus={() => setHoveredRating(starValue)}
                        onClick={() => onChange(starValue)}
                        aria-label={`Поставить оценку ${starValue} из 5`}
                    >
                        <img src={star} alt="" />
                    </button>
                );
            })}
        </div>
    );
}

export default function Account() {
    const [active, setActive] = useState('orders');
    const [ordersTab, setOrdersTab] = useState('active');

    const [user, setUser] = useState(getStoredUser);

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

    const loadReviews = useCallback(async () => {
        if (!user?.id) return;

        try {
            setIsReviewsLoading(true);
            setReviewMessage('');

            const data = await fetchJson(
                `${API_URL}/api/users/${user.id}/reviews`,
                {},
                'Ошибка загрузки отзывов'
            );

            setReviews(data);
        } catch (error) {
            setReviewMessage(error.message);
        } finally {
            setIsReviewsLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        if (active === 'reviews') {
            loadReviews();
        }

        if (active === 'settings') {
            setSettingsName(profileName);
            setSelectedAvatar(profileAvatar);
            setSettingsMessage('');
        }
    }, [active, loadReviews, profileName, profileAvatar]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('authChanged'));
        window.location.href = '/';
    };

    const validateReview = () => {
        const name = authorName.trim();
        const text = reviewText.trim();

        if (!user?.id) return 'Необходимо войти в аккаунт';
        if (!name) return 'Введите имя';
        if (name.length < 2) return 'Имя должно содержать минимум 2 символа';
        if (!text) return 'Введите текст отзыва';
        if (text.length < 10) return 'Отзыв должен содержать минимум 10 символов';

        return '';
    };

    const handleReviewSubmit = async (event) => {
        event.preventDefault();

        const validationMessage = validateReview();

        if (validationMessage) {
            setReviewMessage(validationMessage);
            return;
        }

        try {
            setIsReviewSubmitting(true);
            setReviewMessage('');

            await fetchJson(
                `${API_URL}/api/reviews`,
                {
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
                },
                'Ошибка отправки отзыва'
            );

            setAuthorName('');
            setRating(5);
            setReviewText('');
            setReviewMessage('Отзыв отправлен на модерацию');

            await loadReviews();
        } catch (error) {
            setReviewMessage(error.message);
        } finally {
            setIsReviewSubmitting(false);
        }
    };

    const handleProfileSubmit = async (event) => {
        event.preventDefault();

        const trimmedName = settingsName.trim();

        if (!user?.id) {
            setSettingsMessage('Необходимо войти в аккаунт');
            return;
        }

        if (trimmedName && trimmedName.length < 2) {
            setSettingsMessage('Никнейм должен содержать минимум 2 символа');
            return;
        }

        try {
            setIsSettingsSubmitting(true);
            setSettingsMessage('');

            const data = await fetchJson(
                `${API_URL}/api/users/${user.id}/profile`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        full_name: trimmedName,
                        avatar_url: selectedAvatar
                    })
                },
                'Ошибка сохранения профиля'
            );

            localStorage.setItem('user', JSON.stringify(data.user));

            setUser(data.user);
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

    const openOrdersTab = (tab) => {
        setActive('orders');
        setOrdersTab(tab);
    };

    const renderReviewsContent = () => (
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
                    <RatingStars value={rating} onChange={setRating} />
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
                            <div className="account-review-card-rating">
                                <RatingStars value={Number(review.rating)} />
                            </div>

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

    const renderSettingsContent = () => (
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

    const renderContent = () => {
        switch (active) {
            case 'orders':
                return <OrdersContent ordersTab={ordersTab} />;

            case 'favorites':
                return <FavoritesContent />;

            case 'reviews':
                return renderReviewsContent();

            case 'settings':
                return renderSettingsContent();

            default:
                return <OrdersContent ordersTab={ordersTab} />;
        }
    };

    if (!user) {
        return (
            <section className="account">
                <h1 className="name-title_page">Личный кабинет</h1>

                <div className="account-empty">
                    <p>Необходимо войти в аккаунт.</p>
                </div>
            </section>
        );
    }

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
                        <span>{user.email || 'email не указан'}</span>
                    </div>

                    <ul className="aside_select-list">
                        <li className={`orders-item ${active === 'orders' ? 'active' : ''}`}>
                            <div className="aside-item-main">
                                <img src={order} alt="Заказы" />

                                <button
                                    type="button"
                                    onClick={() => openOrdersTab('active')}
                                >
                                    Заказы
                                </button>
                            </div>

                            <ul className={`aside_select-list-nested ${active === 'orders' ? 'show' : ''}`}>
                                <li>
                                    <button
                                        type="button"
                                        className={ordersTab === 'active' ? 'active-nested' : ''}
                                        onClick={() => openOrdersTab('active')}
                                    >
                                        Активные
                                    </button>
                                </li>

                                <li>
                                    <button
                                        type="button"
                                        className={ordersTab === 'inactive' ? 'active-nested' : ''}
                                        onClick={() => openOrdersTab('inactive')}
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