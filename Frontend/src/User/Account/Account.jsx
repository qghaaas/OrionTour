import '../../main.css'
import './Account.css'
import order from './img/order.svg'
import favorites from './img/favorites.svg'
import star from './img/star.svg'
import wrench from './img/wrench.svg'
import { useState } from "react";




export default function Account() {
    const [active, setActive] = useState("orders");
    const user = JSON.parse(localStorage.getItem("user"));

    const handleLogout = () => {
        localStorage.removeItem("user");
        window.dispatchEvent(new Event("authChanged"));
        window.location.href = "/";
    };

    return (
        <section className='account'>
            <h1 className='name-title_page'>Личный кабинет</h1>
            <div className="container">
                <div className="account-inner">

                    <aside className='account-aside'>
                        <div className="account-aside_user">
                            <div className='user-avatar'></div>

                            <p>Новый пользователь</p>
                            <span>{user?.email || "email не указан"}</span>
                        </div>

                        <ul className="aside_select-list">
                            <li className={`orders-item ${active === "orders" ? "active" : ""}`}>
                                <div className="aside-item-main">
                                    <img src={order} alt="" />
                                    <button type="button" onClick={() => setActive("orders")}>
                                        Заказы
                                    </button>
                                </div>

                                <ul className={`aside_select-list-nested ${active === "orders" ? "show" : ""}`}>
                                    <li>
                                        <button type="button">Активные</button>
                                    </li>
                                    <li>
                                        <button type="button">Неактивные</button>
                                    </li>
                                </ul>
                            </li>

                            <li className={active === "favorites" ? "active" : ""}>
                                <img src={favorites} alt="" />
                                <button type='button' onClick={() => setActive("favorites")}>
                                    Избранное
                                </button>
                            </li>

                            <li className={active === "reviews" ? "active" : ""}>
                                <img src={star} alt="" />
                                <button type='button' onClick={() => setActive("reviews")}>
                                    Мои отзывы
                                </button>
                            </li>

                            <li className={active === "settings" ? "active" : ""}>
                                <img src={wrench} alt="" />
                                <button type='button' onClick={() => setActive("settings")}>
                                    Настройки профиля
                                </button>
                            </li>
                        </ul>

                        <button
                            className='exit-account'
                            type="button"
                            onClick={handleLogout}
                        >
                            Выход
                        </button>
                    </aside>

                    <div className="active-content"></div>
                </div>
            </div>
        </section>
    );
}