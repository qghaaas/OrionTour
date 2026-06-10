import '../../main.css'
import './Footer.css'
import { Link } from 'react-router-dom'
import logo from '../../mainIMG/logo.svg'
import telegram from './img/telegram.svg'
import vk from './img/vk.svg'
import location from './img/location.svg'
import phone from './img/Phone.svg'
import atsign from './img/Atsign.svg'



export default function Footer({ variant = 'default', className = '' }) {
    return (
        <footer className={`footer footer-${variant} ${className}`}>
    <div className="container">
        <div className="footer-inner">
            <Link className="footer-logo" to="/">
                <img src={logo} alt="Логотип Орион Тур" />
            </Link>

            <div className="footer-content">
                <nav className="footer-nav" aria-label="Навигация в подвале сайта">
                    <div className="footer-column">
                        <h3>Компания</h3>

                        <ul className="footer-list">
                            <li><Link to="/">Главная страница</Link></li>
                            <li><Link to="/AboutUs">О нас</Link></li>
                            <li><Link to="/ContactInfo">Контакты</Link></li>
                        </ul>
                    </div>

                    <div className="footer-column">
                        <h3>Туры</h3>

                        <ul className="footer-list">
                            <li><Link to="/Directions">Направления</Link></li>
                            <li><Link to="#">Поиск тура</Link></li>
                            <li><Link to="/DomesticTourism">Внутренний туризм</Link></li>
                            <li><Link to="/Blog">Блог</Link></li>
                        </ul>
                    </div>
                </nav>

                <div className="footer-contacts">
                    <h3>Контакты</h3>

                    <ul className="footer-list footer-contact-list">
                        <li>
                            <img src={location} alt="" />
                            <Link to="#">orion_tour_39</Link>
                        </li>

                        <li>
                            <img src={phone} alt="" />
                            <Link to="tel:+74012759599">+7 (4012) 75-95-99</Link>
                        </li>

                        <li>
                            <img src={atsign} alt="" />
                            <Link to="#">Калининград, площадь Победы, 4</Link>
                        </li>
                    </ul>
                </div>

                <div className="footer-social">
                    <h3>Соц.сети</h3>

                    <div className="footer-social-icons">
                        <Link to="#" aria-label="Telegram">
                            <img src={telegram} alt="" />
                        </Link>

                        <Link to="#" aria-label="VK">
                            <img src={vk} alt="" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    </div>
</footer>
    )
}