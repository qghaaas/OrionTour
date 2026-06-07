import OrderCard from './OrderCard';

export default function ActiveOrders({ orders = [], onCancel, processingOrderId = null }) {
    return (
        <div className="orders-list">
            {orders.map((order) => (
                <OrderCard
                    key={order.id}
                    order={order}
                    type="active"
                    onCancel={onCancel}
                    isActionDisabled={Number(processingOrderId) === Number(order.id)}
                />
            ))}
        </div>
    );
}