import OrderCard from './OrderCard';
import orderImg from '../../img/order.png'

export default function ActiveOrders() {

    const activeOrders = [
        {
            id: 1,
            title: "Hard Rock Hotel Maldives",
            country: "Мальдивы, Южный Мале Атолл",
            dateFrom: "01.01.2026",
            dateTo: "10.01.2026",
            people: "1 взрослый человек",
            room: "Однокомнатная вилла",
            food: "Завтраки оплачены",
            price: "477 900",
            image: orderImg
        }
    ];

    return (
        <div className="orders-list">

            {activeOrders.map(order => (
                <OrderCard
                    key={order.id}
                    order={order}
                />
            ))}

        </div>
    );
}