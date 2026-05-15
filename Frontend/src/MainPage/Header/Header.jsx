import '../../main.css'
import './Header.css'
import logo from '../../mainIMG/logo.svg'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import AuthModal from '../../User/Auth/AuthModal'

const API_URL = 'http://localhost:3010'

function getAvatarSrc(avatarUrl) {
    if (!avatarUrl) return ''

    if (avatarUrl.startsWith('http')) {
        return avatarUrl
    }

    return `${API_URL}${avatarUrl}`
}

function getUserInitial(user) {
    const name = user?.full_name?.trim()
    const email = user?.email?.trim()

    if (name) {
        return name[0].toUpperCase()
    }

    if (email) {
        return email[0].toUpperCase()
    }

    return 'U'
}

export default function Header() {
    const [isAuthOpen, setIsAuthOpen] = useState(false)
    const [user, setUser] = useState(null)
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    const isAuth = Boolean(user)

    useEffect(() => {
        const checkAuth = () => {
            const savedUser = localStorage.getItem('user')

            if (!savedUser) {
                setUser(null)
                return
            }

            try {
                setUser(JSON.parse(savedUser))
            } catch (error) {
                console.error('Ошибка чтения пользователя из localStorage:', error)
                localStorage.removeItem('user')
                setUser(null)
            }
        }

        checkAuth()

        window.addEventListener('authChanged', checkAuth)
        window.addEventListener('storage', checkAuth)

        return () => {
            window.removeEventListener('authChanged', checkAuth)
            window.removeEventListener('storage', checkAuth)
        }
    }, [])

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 1180) {
                setIsMenuOpen(false)
            }
        }

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setIsMenuOpen(false)
            }
        }

        window.addEventListener('resize', handleResize)
        window.addEventListener('keydown', handleEscape)

        return () => {
            window.removeEventListener('resize', handleResize)
            window.removeEventListener('keydown', handleEscape)
        }
    }, [])

    useEffect(() => {
        document.body.style.overflow = isMenuOpen ? 'hidden' : ''

        return () => {
            document.body.style.overflow = ''
        }
    }, [isMenuOpen])

    const closeMenu = () => {
        setIsMenuOpen(false)
    }

    const openAuth = () => {
        setIsMenuOpen(false)
        setIsAuthOpen(true)
    }

    const userName = user?.full_name?.trim() || 'Новый пользователь'
    const userEmail = user?.email || 'email не указан'
    const avatarSrc = getAvatarSrc(user?.avatar_url)

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
                            className={`header-nav ${isMenuOpen ? 'is-open' : ''}`}
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
                                <div className="header-profile">
                                    <Link
                                        className="header-profile-avatar"
                                        to="/account"
                                        onClick={closeMenu}
                                        aria-label="Открыть личный кабинет"
                                    >
                                        {avatarSrc ? (
                                            <img src={avatarSrc} alt="Аватар пользователя" />
                                        ) : (
                                            <span>{getUserInitial(user)}</span>
                                        )}
                                    </Link>

                                    <div className="header-profile-tooltip">
                                        <p className="header-profile-service">
                                            Аккаунт Орион Тур
                                        </p>

                                        <p className="header-profile-name">
                                            {userName}
                                        </p>

                                        <p className="header-profile-email">
                                            {userEmail}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    className="login-link main-btn_site"
                                    type="button"
                                    onClick={openAuth}
                                >
                                    Войти
                                </button>
                            )}
                        </div>

                        <button
                            className={`burger-btn ${isMenuOpen ? 'is-active' : ''}`}
                            type="button"
                            aria-label={isMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
                            aria-expanded={isMenuOpen}
                            aria-controls="header-nav"
                            onClick={() => setIsMenuOpen((prev) => !prev)}
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