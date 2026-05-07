import closeBtn from '../../img/closeBtn.png'



export default function OrderCard({ order }) {
    return (
        <div className="order-card">

            <img
                className="order-image"
                src={order.image}
                alt={order.title}
            />

            <div className="order-info">
                <div className='order-info-title'>
                    <h3>{order.title}</h3>

                    <p>{order.country}</p>
                </div>

                <ul className='order-info_list'>
                    <li><p>
                        {order.dateFrom} - {order.dateTo}
                    </p></li>
                    <li><p>{order.people}</p></li>
                    <li><p>{order.room}</p></li>
                    <li> <p>{order.food}</p></li>
                </ul>

                <strong>{order.price} ₽</strong>

            </div>

            <button
                className="delete-order"
                type="button"
            >
                <img src={closeBtn} alt="" />
            </button>

        </div>
    );
}