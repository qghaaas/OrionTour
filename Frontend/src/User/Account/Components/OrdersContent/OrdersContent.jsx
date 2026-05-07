import '../../../../main.css'
import './Orders.css';

import ActiveOrders from './ActiveOrders';
import InactiveOrders from './InactiveOrders';

export default function OrdersContent({ ordersTab }) {
    return (
        <div className="orders-content">
            <h1>
                {ordersTab === "active"
                    ? "Активные заказы"
                    : "Неактивные заказы"}
            </h1>

            {ordersTab === "active" ? (
                <ActiveOrders />
            ) : (
                <InactiveOrders />
            )}
        </div>
    );
}