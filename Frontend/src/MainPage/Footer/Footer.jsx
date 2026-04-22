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
                    <Link to="#">
                        <img src={logo} alt="Логотип" />
                    </Link>

                    <nav className='footer-menu'>
                        <ul className="footer-item">
                            <li><Link to="#">Главная страница</Link></li>
                            <li><Link to="#">Направления</Link></li>
                            <li><Link to="#">Поиск тура</Link></li>
                        </ul>
                        <ul className="footer-item">
                            <li><Link to="#">Внутренний туризм</Link></li>
                            <li><Link to="#">Направления</Link></li>
                            <li><Link to="#">Блог</Link></li>
                        </ul>
                        <ul className="footer-item">
                            <li><Link to="#">Контакты</Link></li>
                            <li><Link to="#">О нас</Link></li>
                        </ul>
                        <ul className="footer-item footer-item_sep">
                            <li>
                                <img src={location} alt="" />
                                <Link to="#">orion_tour_39</Link>
                            </li>
                            <li>
                                <img src={phone} alt="" />
                                <Link to="#">+7 (4012) 75-95-99</Link>
                            </li>
                            <li>
                                <img src={atsign} alt="" />
                                <Link to="#">Калининград, площадь Победы, 4</Link>
                            </li>
                        </ul>
                        <div className="social-link">
                            <p>Соц.сети</p>
                            <div>
                                <Link to="#">
                                    <img src={telegram} alt="Telegram" />
                                </Link>
                                <Link to="#">
                                    <img src={vk} alt="VK" />
                                </Link>
                            </div>
                        </div>
                    </nav>
                </div>
            </div>
        </footer>
    )
}