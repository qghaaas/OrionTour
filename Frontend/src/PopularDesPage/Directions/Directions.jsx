import '../../main.css'
import './Directions.css'
import star from '../../mainIMG/star.svg'
import { Link, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { YMaps, Map, Placemark } from '@pbe/react-yandex-maps'
import GalleryModal from '../../GalleryModal/GalleryModal'


export default function Directions({ defaultTourId = 1 }) {
    const { id } = useParams()

    const tourId = id || defaultTourId

    const [tour, setTour] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [isGalleryOpen, setIsGalleryOpen] = useState(false)
    const [activeImageIndex, setActiveImageIndex] = useState(0)

    useEffect(() => {
        let isMounted = true

        setLoading(true)
        setError('')
        setTour(null)

        fetch(`http://localhost:3010/api/tours/${tourId}/details`)
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
                                </div>

                                <button className="main-btn_site" type="button">
                                    Забронировать
                                </button>
                            </div>
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
                onChangeIndex={setActiveImageIndex}
                onClose={closeGallery}
            />
        </section>
    )
}