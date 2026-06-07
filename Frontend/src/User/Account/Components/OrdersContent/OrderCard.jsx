import { Link } from 'react-router-dom';

const ACTIVE_STATUSES = ['active', 'new', 'pending', 'confirmed', 'paid'];

const STATUS_LABELS = {
    active: 'Активен',
    new: 'Новая заявка',
    pending: 'В обработке',
    confirmed: 'Подтверждён',
    paid: 'Оплачен',
    completed: 'Завершён',
    cancelled: 'Отменён',
    canceled: 'Отменён',
    expired: 'Истёк',
    archived: 'В архиве'
};

const STATUS_PROGRESS = {
    active: 0,
    new: 0,
    pending: 1,
    confirmed: 2,
    paid: 3
};

const PROGRESS_STEPS = ['Заявка', 'Проверка', 'Подтверждение', 'Оплата'];

function normalizeStatus(status = '') {
    return String(status || '').trim().toLowerCase();
}

function formatDate(date) {
    if (!date) return 'Дата уточняется';

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return date;
    }

    return parsedDate.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function formatDateRange(startDate, endDate) {
    if (!startDate && !endDate) {
        return 'Даты уточняются менеджером';
    }

    return `${formatDate(startDate)} — ${formatDate(endDate)}`;
}

function formatPrice(price) {
    const numericPrice = Number(price);

    if (!Number.isFinite(numericPrice)) return 'Стоимость уточняется';

    return `${numericPrice.toLocaleString('ru-RU')} ₽`;
}

function getPeopleLabel(count) {
    const peopleCount = Number(count) || 0;

    if (peopleCount <= 0) return 'Количество туристов уточняется';

    const lastDigit = peopleCount % 10;
    const lastTwoDigits = peopleCount % 100;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
        return `${peopleCount} туристов`;
    }

    if (lastDigit === 1) return `${peopleCount} турист`;
    if (lastDigit >= 2 && lastDigit <= 4) return `${peopleCount} туриста`;

    return `${peopleCount} туристов`;
}

function getStatusLabel(status) {
    const normalizedStatus = normalizeStatus(status);

    return STATUS_LABELS[normalizedStatus] || 'Статус уточняется';
}

function getProgressLevel(status) {
    const normalizedStatus = normalizeStatus(status);

    return STATUS_PROGRESS[normalizedStatus] ?? 0;
}

export default function OrderCard({ order, type = 'active', onCancel, isActionDisabled = false }) {
    const normalizedStatus = normalizeStatus(order.status);
    const isActiveOrder = ACTIVE_STATUSES.includes(normalizedStatus);
    const canCancel = type === 'active' && isActiveOrder;
    const route = order.tour_id ? `/tour/${order.tour_id}` : '/Directions';
    const image = order.image || order.image_url || '';
    const progressLevel = getProgressLevel(order.status);

    return (
        <article className={`order-card order-card-${type}`}>
            <div className="order-image-wrap">
                {image ? (
                    <img
                        className="order-image"
                        src={image}
                        alt={order.title || 'Тур'}
                    />
                ) : (
                    <div className="order-image-placeholder">
                        <span>ORION</span>
                        <strong>TOUR</strong>
                    </div>
                )}

                <span className={`order-status order-status-${normalizedStatus || 'unknown'}`}>
                    {getStatusLabel(order.status)}
                </span>
            </div>

            <div className="order-info">
                <div className="order-info-head">
                    <div className="order-info-title">
                        <p className="order-number">Заказ №{order.id}</p>
                        <h3>{order.title || 'Тур уточняется'}</h3>
                        <p>{order.country || order.location_name || 'Направление уточняется'}</p>
                    </div>

                    <strong className="order-price">
                        {formatPrice(order.total_price ?? order.price)}
                    </strong>
                </div>

                <ul className="order-info-list">
                    <li>
                        <span>Даты поездки</span>
                        <p>{formatDateRange(order.start_date, order.end_date)}</p>
                    </li>

                    <li>
                        <span>Туристы</span>
                        <p>{getPeopleLabel(order.people_count)}</p>
                    </li>

                    <li>
                        <span>Размещение</span>
                        <p>{order.room_type || 'Тип номера уточняется менеджером'}</p>
                    </li>

                    <li>
                        <span>Питание</span>
                        <p>{order.food || 'Условия питания уточняются'}</p>
                    </li>
                </ul>

                {type === 'active' ? (
                    <>
                        <div className="order-progress" aria-label="Этапы заказа">
                            {PROGRESS_STEPS.map((step, index) => (
                                <span
                                    key={step}
                                    className={index <= progressLevel ? 'order-progress-step done' : 'order-progress-step'}
                                >
                                    {step}
                                </span>
                            ))}
                        </div>

                        {order.manager_comment && (
                            <p className="order-manager-note">
                                <strong>Комментарий менеджера:</strong> {order.manager_comment}
                            </p>
                        )}
                    </>
                ) : (
                    <p className="order-archive-note">
                        Заказ сохранён в истории. Его можно использовать как основу для повторной поездки или отзыва.
                    </p>
                )}

                <div className="order-actions">
                    <Link className="order-action-primary" to={route}>
                        Открыть тур
                    </Link>

                    {type === 'active' ? (
                        <a className="order-action-secondary" href="tel:+74012999999">
                            Связаться с менеджером
                        </a>
                    ) : (
                        <Link className="order-action-secondary" to={route}>
                            Повторить поездку
                        </Link>
                    )}

                    {canCancel && (
                        <button
                            className="order-action-danger"
                            type="button"
                            onClick={() => onCancel?.(order.id)}
                            disabled={isActionDisabled}
                        >
                            {isActionDisabled ? 'Отмена...' : 'Отменить'}
                        </button>
                    )}
                </div>
            </div>
        </article>
    );
}