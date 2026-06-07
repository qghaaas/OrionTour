import OrderCard from './OrderCard';

export default function InactiveOrders({ orders = [] }) {
    return (
        <div className="orders-list">
            {orders.map((order) => (
                <OrderCard
                    key={order.id}
                    order={order}
                    type="inactive"
                />
            ))}
        </div>
    );
}