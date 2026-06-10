import '../../main.css'
import './Directions.css'
import star from '../../mainIMG/star.svg'
import { Link, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { YMaps, Map, Placemark } from '@pbe/react-yandex-maps'
import GalleryModal from '../../GalleryModal/GalleryModal'

const API_URL = 'http://localhost:3010'

function clearStoredAuth() {
    localStorage.removeItem('user')
    localStorage.removeItem('authToken')
}

function getStoredAuth() {
    const token = localStorage.getItem('authToken') || ''

    if (!token) {
        return { token: '', user: null }
    }

    try {
        const user = JSON.parse(localStorage.getItem('user') || 'null')

        if (!user?.id) {
            clearStoredAuth()
            return { token: '', user: null }
        }

        return { token, user }
    } catch {
        clearStoredAuth()
        return { token: '', user: null }
    }
}

function getBookingErrorMessage(status, serverMessage) {
    if (serverMessage) return serverMessage

    if (status === 401 || status === 403) {
        return 'Войдите в аккаунт, чтобы забронировать тур.'
    }

    if (status === 409) {
        return 'Этот тур уже есть в активных заказах.'
    }

    return 'Не удалось создать заявку. Попробуйте ещё раз.'
}

export default function Directions({ defaultTourId = 1 }) {
    const { id } = useParams()

    const tourId = id || defaultTourId

    const [tour, setTour] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [isGalleryOpen, setIsGalleryOpen] = useState(false)
    const [activeImageIndex, setActiveImageIndex] = useState(0)

    const [isBooking, setIsBooking] = useState(false)
    const [bookingResult, setBookingResult] = useState(null)

    useEffect(() => {
        let isMounted = true

        setLoading(true)
        setError('')
        setTour(null)
        setBookingResult(null)

        fetch(`${API_URL}/api/tours/${tourId}/details`)
            .then((res) => {
                if (!res.ok) {
                    throw new Error('Ошибка загрузки данных тура')
                }

                return res.json()
            })
            .then((data) => {
                if (!isMounted) return

                setTour(data)
                setLoading(false)
            })
            .catch((err) => {
                if (!isMounted) return

                console.error('Ошибка загрузки тура:', err)
                setError('Не удалось загрузить данные тура')
                setLoading(false)
            })

        return () => {
            isMounted = false
        }
    }, [tourId])

    const galleryImages = useMemo(() => {
        if (!tour?.images?.length) return []

        return tour.images.filter((img) => Boolean(img.image_url))
    }, [tour])

    const mainImageObject = useMemo(() => {
        return galleryImages.find((img) => img.is_main) || galleryImages[0] || null
    }, [galleryImages])

    const mainImage = mainImageObject?.image_url || ''

    const sideImages = useMemo(() => {
        return galleryImages
            .filter((img) => img.id !== mainImageObject?.id)
            .slice(0, 5)
    }, [galleryImages, mainImageObject])

    const totalPhotos = Number(tour?.images_count) || galleryImages.length

    const openGallery = (imageId) => {
        if (!galleryImages.length) return

        const index = galleryImages.findIndex((img) => img.id === imageId)

        setActiveImageIndex(index >= 0 ? index : 0)
        setIsGalleryOpen(true)
    }

    const closeGallery = () => {
        setIsGalleryOpen(false)
        setActiveImageIndex(0)
    }

    const handleBookTour = async () => {
        const { token, user } = getStoredAuth()

        if (!token || !user?.id) {
            setBookingResult({
                type: 'warning',
                message: 'Чтобы тур попал в активные заказы, сначала войдите в аккаунт.'
            })
            return
        }

        try {
            setIsBooking(true)
            setBookingResult(null)

            const response = await fetch(`${API_URL}/api/users/${user.id}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    tour_id: Number(tourId),
                    people_count: 1,
                    room_type: 'Стандарт'
                })
            })

            const data = await response.json().catch(() => ({}))

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    clearStoredAuth()
                    window.dispatchEvent(new Event('authChanged'))
                }

                setBookingResult({
                    type: response.status === 409 ? 'info' : 'error',
                    message: getBookingErrorMessage(response.status, data.message),
                    order: data.order || null
                })
                return
            }

            setBookingResult({
                type: 'success',
                message: `Заявка создана. Заказ №${data.order?.id || ''} уже появился в активных заказах.`,
                order: data.order || null
            })
        } catch (err) {
            console.error('Ошибка бронирования тура:', err)
            setBookingResult({
                type: 'error',
                message: 'Не удалось подключиться к серверу. Проверьте, запущен ли backend.'
            })
        } finally {
            setIsBooking(false)
        }
    }

    if (loading) {
        return (
            <section className="directions">
                <div className="container">
                    <p>Загрузка...</p>
                </div>
            </section>
        )
    }

    if (error) {
        return (
            <section className="directions">
                <div className="container">
                    <p>{error}</p>

                    <Link className="main-btn_site directions-back-link" to="/">
                        На главную
                    </Link>
                </div>
            </section>
        )
    }

    if (!tour) {
        return (
            <section className="directions">
                <div className="container">
                    <p>Тур не найден</p>

                    <Link className="main-btn_site directions-back-link" to="/">
                        На главную
                    </Link>
                </div>
            </section>
        )
    }

    return (
        <section className="directions">
            <div className="container">
                <div className="directions-top">
                    <div className="directions-top_title">
                        <div className="directions-top_title-inner">
                            <h2>{tour.title}</h2>

                            {tour.hotel_rating ? (
                                <div className="directions-top_title-rev">
                                    <span>{Number(tour.hotel_rating)}</span>
                                    <img src={star} alt="star" />
                                </div>
                            ) : null}
                        </div>

                        <div className="directions-top_title-bot">
                            <span>{tour.nights} ночей</span>
                            <h3>{tour.location_name || tour.direction_name}</h3>
                        </div>
                    </div>

                    <div className="directions-top_img">
                        <div className="directions-gallery">
                            <button
                                className="directions-gallery-main"
                                type="button"
                                onClick={() => openGallery(mainImageObject?.id)}
                                disabled={!mainImage}
                            >
                                {mainImage ? (
                                    <img src={mainImage} alt={tour.title} />
                                ) : (
                                    <span>Нет изображения</span>
                                )}
                            </button>

                            <div className="directions-gallery-grid">
                                {sideImages.map((img, index) => {
                                    const isLastPreview = index === 4

                                    return (
                                        <button
                                            className={`directions-gallery-small ${
                                                isLastPreview ? 'directions-gallery-more' : ''
                                            }`}
                                            key={img.id}
                                            type="button"
                                            onClick={() => openGallery(img.id)}
                                        >
                                            <img
                                                src={img.image_url}
                                                alt={`${tour.title} фото ${index + 2}`}
                                            />

                                            {isLastPreview && totalPhotos > 0 ? (
                                                <span className="directions-gallery-overlay">
                                                    +{totalPhotos} <br /> фото
                                                </span>
                                            ) : null}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="directions-inner">
                    <div className="directions-des_loc">
                        <div className="directions-description">
                            <p style={{ whiteSpace: 'pre-line' }}>
                                {tour.full_description || tour.short_description}
                            </p>

                            <div className="directions-booking-box">
                                <div>
                                    <span>Стоимость</span>
                                    <strong>
                                        от {Number(tour.price).toLocaleString('ru-RU')} ₽
                                    </strong>
                                    <p className="directions-booking-note">
                                        Нажмите «Забронировать» — заявка появится в активных заказах, а менеджер увидит её и свяжется с вами.
                                    </p>
                                </div>

                                <button
                                    className="main-btn_site"
                                    type="button"
                                    onClick={handleBookTour}
                                    disabled={isBooking}
                                >
                                    {isBooking ? 'Создаём заявку...' : 'Забронировать'}
                                </button>
                            </div>

                            {bookingResult && (
                                <div className={`directions-booking-message ${bookingResult.type}`}>
                                    <p>{bookingResult.message}</p>

                                    <div className="directions-booking-actions">
                                        {bookingResult.type === 'warning' ? (
                                            <span>Войдите через кнопку «Войти» в шапке сайта.</span>
                                        ) : (
                                            <Link to="/account">
                                                Открыть активные заказы
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="directions-loc">
                            <p>Где находится</p>

                            {tour.hotel_lat && tour.hotel_lng ? (
                                <div className="directions-map">
                                    <YMaps>
                                        <Map
                                            defaultState={{
                                                center: [
                                                    Number(tour.hotel_lat),
                                                    Number(tour.hotel_lng),
                                                ],
                                                zoom: 15,
                                                controls: [],
                                            }}
                                            width="100%"
                                            height="100%"
                                        >
                                            <Placemark
                                                geometry={[
                                                    Number(tour.hotel_lat),
                                                    Number(tour.hotel_lng),
                                                ]}
                                            />
                                        </Map>
                                    </YMaps>
                                </div>
                            ) : (
                                <p>Координаты не указаны</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <GalleryModal
                isOpen={isGalleryOpen}
                title={tour.title}
                images={galleryImages}
                activeIndex={activeImageIndex}
                onClose={closeGallery}
            />
        </section>
    )
}
