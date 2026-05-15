import '../../main.css'
import './Header.css'
import logo from '../../mainIMG/logo.svg'
import { Link } from 'react-router-dom'
import { useEffect, useState } from "react"
import AuthModal from '../../User/Auth/AuthModal'



export default function Header() {
    const [isAuthOpen, setIsAuthOpen] = useState(false)
    const [isAuth, setIsAuth] = useState(false)
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    useEffect(() => {
        const checkAuth = () => {
            const savedUser = localStorage.getItem("user")
            setIsAuth(!!savedUser)
        }

        checkAuth()

        window.addEventListener("authChanged", checkAuth)

        return () => {
            window.removeEventListener("authChanged", checkAuth)
        }
    }, [])

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 1180) {
                setIsMenuOpen(false)
            }
        }

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                setIsMenuOpen(false)
            }
        }

        window.addEventListener("resize", handleResize)
        window.addEventListener("keydown", handleEscape)

        return () => {
            window.removeEventListener("resize", handleResize)
            window.removeEventListener("keydown", handleEscape)
        }
    }, [])

    useEffect(() => {
        document.body.style.overflow = isMenuOpen ? "hidden" : ""

        return () => {
            document.body.style.overflow = ""
        }
    }, [isMenuOpen])

    const closeMenu = () => {
        setIsMenuOpen(false)
    }

    const openAuth = () => {
        setIsMenuOpen(false)
        setIsAuthOpen(true)
    }

    return (
        <>
            <header className="site-header">
                <div className="container">
                    <div className="header-inner">
                        <Link className="logo-link" to="/" onClick={closeMenu}>
                            <img src={logo} alt="logo" />
                        </Link>

                        <nav
                            id="header-nav"
                            className={`header-nav ${isMenuOpen ? "is-open" : ""}`}
                        >
                            <ul className="header-menu">
                                <li><Link to="/Directions" onClick={closeMenu}>Направления</Link></li>
                                <li><Link to="#" onClick={closeMenu}>Поиск тура</Link></li>
                                <li><Link to="/DomesticTourism" onClick={closeMenu}>Внутренний туризм</Link></li>
                                <li><Link to="/Blog" onClick={closeMenu}>Блог</Link></li>
                                <li><Link to="#" onClick={closeMenu}>Конструктор</Link></li>
                                <li><Link to="/AboutUs" onClick={closeMenu}>О нас</Link></li>
                                <li><Link to="/ContactInfo" onClick={closeMenu}>Контакты</Link></li>
                            </ul>
                        </nav>

                        <div className="header-auth">
                            {isAuth ? (
                                <Link className="login-link main-btn_site" to="/account">
                                    Личный кабинет
                                </Link>
                            ) : (
                                <button
                                    className="login-link main-btn_site"
                                    type="button"
                                    onClick={() => setIsAuthOpen(true)}
                                >
                                    Войти
                                </button>
                            )}
                        </div>

                        <button
                            className={`burger-btn ${isMenuOpen ? "is-active" : ""}`}
                            type="button"
                            aria-label={isMenuOpen ? "Закрыть меню" : "Открыть меню"}
                            aria-expanded={isMenuOpen}
                            aria-controls="header-nav"
                            onClick={() => setIsMenuOpen(prev => !prev)}
                        >
                            <span></span>
                            <span></span>
                            <span></span>
                        </button>
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
    )
}