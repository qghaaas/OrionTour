import '../../main.css'
import './Header.css'
import logo from '../../mainIMG/logo.svg'
import { Link } from 'react-router-dom'


export default function Header() {
    return (
        <>
            <header>
                <div className="container">
                    <div className="header-inner">
                        <Link className='logo-link' to="#"> <img src={logo} alt="" /></Link>

                        <nav className="header-nav">
                            <ul className='header-menu'>
                                <li>
                                    <Link to="#">Направления</Link>
                                </li>
                                <li>
                                    <Link to="#">Поиск тура</Link>
                                </li>
                                <li>
                                    <Link to="#">Внутренний туризм</Link>
                                </li>
                                <li>
                                    <Link to="#">Блог</Link>
                                </li>
                                <li>
                                    <Link to="#">Конструктор</Link>
                                </li>
                                <li>
                                    <Link to="#">О нас</Link>
                                </li>
                                <li>
                                    <Link to="#">Контакты</Link>
                                </li>
                            </ul>
                        </nav>

                        <Link className='login-link' to="#">Войти</Link>
                    </div>
                </div>
            </header>
        </>
    )
}