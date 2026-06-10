import '../../../../main.css';
import './Orders.css';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ActiveOrders from './ActiveOrders';
import InactiveOrders from './InactiveOrders';
import { Link } from 'react-router-dom';


const API_URL = 'http://localhost:3010';

function clearStoredAuth() {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
}

function getStoredAuthToken() {
    return localStorage.getItem('authToken') || '';
}

async function fetchOrdersJson(url, options = {}, fallbackMessage = 'Ошибка запроса') {
    const token = getStoredAuthToken();

    if (!token) {
        throw new Error('Необходимо войти в аккаунт');
    }

    const response = await fetch(url, {
        ...options,
        headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${token}`
        }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            clearStoredAuth();
            window.dispatchEvent(new Event('authChanged'));
        }

        throw new Error(data.message || fallbackMessage);
    }

    return data;
}

function getEmptyState(tab) {
    if (tab === 'active') {
        return {
            title: 'Активных заказов пока нет',
            text: 'Когда вы забронируете тур, здесь появится заявка, статус обработки и быстрые действия по заказу.',
            action: 'Перейти к турам',
            link: '/Directions'
        };
    }

    return {
        title: 'Неактивных заказов пока нет',
        text: 'Здесь будут отображаться отменённые, завершённые и архивные заказы.',
        action: 'Смотреть туры',
        link: '/Directions'
    };
}

export default function OrdersContent({ ordersTab, onChangeTab, user }) {
    const [orders, setOrders] = useState([]);
    const [counts, setCounts] = useState({ active: 0, inactive: 0 });
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [processingOrderId, setProcessingOrderId] = useState(null);

    const normalizedTab = ordersTab === 'inactive' ? 'inactive' : 'active';

    const loadOrders = useCallback(async () => {
        if (!user?.id) {
            setOrders([]);
            setCounts({ active: 0, inactive: 0 });
            return;
        }

        try {
            setIsLoading(true);
            setMessage('');

            const data = await fetchOrdersJson(
                `${API_URL}/api/users/${user.id}/orders?status=${normalizedTab}`,
                {},
                'Ошибка загрузки заказов'
            );

            setOrders(Array.isArray(data.orders) ? data.orders : []);
            setCounts({
                active: Number(data.counts?.active) || 0,
                inactive: Number(data.counts?.inactive) || 0
            });
        } catch (error) {
            setOrders([]);
            setCounts({ active: 0, inactive: 0 });
            setMessage(error.message);
        } finally {
            setIsLoading(false);
        }
    }, [normalizedTab, user?.id]);

    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    const handleCancelOrder = async (orderId) => {
        if (!user?.id || !orderId) return;

        const isConfirmed = window.confirm('Отменить этот активный заказ?');

        if (!isConfirmed) return;

        try {
            setProcessingOrderId(orderId);
            setMessage('');

            await fetchOrdersJson(
                `${API_URL}/api/users/${user.id}/orders/${orderId}/status`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ status: 'cancelled' })
                },
                'Ошибка отмены заказа'
            );

            setMessage('Заказ отменён и перенесён в неактивные.');
            await loadOrders();
        } catch (error) {
            setMessage(error.message);
        } finally {
            setProcessingOrderId(null);
        }
    };

    const emptyState = useMemo(() => getEmptyState(normalizedTab), [normalizedTab]);

    return (
        <div className="orders-content">
            <h1>
                {normalizedTab === 'active'
                    ? 'Активные заказы'
                    : 'Неактивные заказы'}
            </h1>

            <div className="orders-tabs">
                <button
                    type="button"
                    className={normalizedTab === 'active' ? 'active' : ''}
                    onClick={() => onChangeTab?.('active')}
                >
                    Активные <span>{counts.active}</span>
                </button>

                <button
                    type="button"
                    className={normalizedTab === 'inactive' ? 'active' : ''}
                    onClick={() => onChangeTab?.('inactive')}
                >
                    Неактивные <span>{counts.inactive}</span>
                </button>
            </div>

            {message && (
                <p className="orders-message">
                    {message}
                </p>
            )}

            {isLoading && (
                <div className="orders-loading">
                    Загрузка заказов...
                </div>
            )}

            {!isLoading && orders.length > 0 && (
                normalizedTab === 'active' ? (
                    <ActiveOrders
                        orders={orders}
                        onCancel={handleCancelOrder}
                        processingOrderId={processingOrderId}
                    />
                ) : (
                    <InactiveOrders orders={orders} />
                )
            )}

            {!isLoading && orders.length === 0 && (
                <div className="orders-empty-state">
                    <span>✈</span>
                    <h2>{emptyState.title}</h2>
                    <p>{emptyState.text}</p>
                    <Link className="main-btn_site" to={emptyState.link}>
                        {emptyState.action}
                    </Link>
                </div>
            )}
        </div>
    );
}