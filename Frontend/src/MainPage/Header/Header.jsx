import '../../main.css'
import './Header.css'
import logo from '../../mainIMG/logo.svg'
import { Link } from 'react-router-dom'
import { useEffect, useState } from "react"
import AuthModal from '../../User/Auth/AuthModal'

export default function Header() {
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [isAuth, setIsAuth] = useState(false);

    useEffect(() => {
        const checkAuth = () => {
            const savedUser = localStorage.getItem("user");
            setIsAuth(!!savedUser);
        };

        checkAuth();

        window.addEventListener("authChanged", checkAuth);

        return () => {
            window.removeEventListener("authChanged", checkAuth);
        };
    }, []);

    return (
        <>
            <header>
                <div className="container">
                    <div className="header-inner">
                        <Link className='logo-link' to="/">
                            <img src={logo} alt="logo" />
                        </Link>

                        <nav className="header-nav">
                            <ul className='header-menu'>
                                <li><Link to="/Directions">Направления</Link></li>
                                <li><Link to="#">Поиск тура</Link></li>
                                <li><Link to="/DomesticTourism">Внутренний туризм</Link></li>
                                <li><Link to="#">Блог</Link></li>
                                <li><Link to="#">Конструктор</Link></li>
                                <li><Link to="#">О нас</Link></li>
                                <li><Link to="#">Контакты</Link></li>
                            </ul>
                        </nav>

                        {isAuth ? (
                            <Link className="login-link main-btn_site" to="/account">
                                Личный кабинет
                            </Link>
                        ) : (
                            <button
                                className="login-link main-btn_site"
                                onClick={() => setIsAuthOpen(true)}
                            >
                                Войти
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {!isAuth && (
                <AuthModal
                    isOpen={isAuthOpen}
                    onClose={() => setIsAuthOpen(false)}
                />
            )}
        </>
    );
}