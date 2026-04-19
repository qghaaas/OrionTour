import '../../main.css'
import './Hero.css'
import Header from '../Header/Header'
import Plane from './img/Plane.svg'
import Hotel from './img/Hotel.svg'
import { useState } from "react";



export default function Hero() {
    const [activeTab, setActiveTab] = useState("tours");

    return (
        <>
            <section className="hero">
                <Header />
                <div className="container">
                    <div className="hero-inner">
                        <h2>Выберите подходящие вам параметры <br />
                            и найдите свой идеальный отпуск!
                        </h2>

                        <div className="tour-filter">
                            <div className="tour-filter_select">
                                <button
                                    type="button"
                                    className={`tour-filter_tab ${activeTab === "tours" ? "active" : ""}`}
                                    onClick={() => setActiveTab("tours")}
                                >
                                    <img className='planesvg' src={Plane} alt="Туры" />
                                    <span>Туры</span>
                                </button>

                                <button
                                    type="button"
                                    className={`tour-filter_tab ${activeTab === "hotels" ? "active" : ""}`}
                                    onClick={() => setActiveTab("hotels")}
                                >
                                    <img src={Hotel} alt="Отели" />
                                    <span>Отели</span>
                                </button>
                            </div>

                            <form className="filter-item">
                                <input type="text" placeholder="Откуда" />
                                <input type="text" placeholder="Куда" />
                                <input type="number" placeholder="Стоимость" />
                                <input type="date" />
                                <button className='main-btn_site' type="submit">Найти</button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}