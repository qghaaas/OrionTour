import '../../main.css'
import './Hero.css'
import Header from '../Header/Header'
import Plane from './img/Plane.svg'
import Hotel from './img/Hotel.svg'
import GlobeMini from '../../Globe/GlobeMini'
import { useState } from "react";

export default function Hero() {
    const [activeTab, setActiveTab] = useState("tours");

    const markers = [
        { globe_lat: 55.7558, globe_lng: 37.6173 },
        { globe_lat: 48.8566, globe_lng: 2.3522 },
        { globe_lat: 40.7128, globe_lng: -74.006 },
    ];

    const openFullGlobe = () => {
        console.log("Открываем основной глобус");
    };

    return (
        <section className="hero">
            <Header />
            <div className="container hero-container">
                {/* Левая колонка — текст + tour-filter */}
                <div className="hero-left">
                    <p className="hero-top-text">
                        Откройте мир вместе с нами<br/>
                        Выберите направление на интерактивном глобусе и найдите тур за пару минут
                    </p>

                    <div className="hero-links">
                        <button className="hero-btn primary-btn">Подобрать тур</button>
                        <button className="hero-btn secondary-btn">Популярные направления</button>
                    </div>

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

                {/* Правая колонка — глобус */}
                <div className="hero-right">
                    <GlobeMini markers={markers} onClick={openFullGlobe} />
                </div>
            </div>
        </section>
    )
}