import '../../main.css'
import './OffersDes.css'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import done from './img/Done.png'

export default function OffersDes() {
    const [offers, setOffers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        fetch('http://localhost:3010/api/offers-des')
            .then((res) => {
                if (!res.ok) {
                    throw new Error('Ошибка загрузки предложений')
                }

                return res.json()
            })
            .then((data) => {
                setOffers(data)
                setLoading(false)
            })
            .catch((err) => {
                console.error('Ошибка загрузки предложений:', err)
                setError('Не удалось загрузить предложения')
                setLoading(false)
            })
    }, [])

    if (loading) {
        return (
            <section className="offersdes">
                <div className="container">
                    <p>Загрузка предложений...</p>
                </div>
            </section>
        )
    }

    if (error) {
        return (
            <section className="offersdes">
                <div className="container">
                    <p>{error}</p>
                </div>
            </section>
        )
    }

    return (
        <section className="offersdes">
            <div className="container">
                <div className="offersdes-inner">
                    {offers.map((offer) => {
                        const mainImage =
                            offer.images.find((image) => image.is_main) ||
                            offer.images[0]

                        const previewImages = offer.images
                            .filter((image) => !image.is_main)
                            .slice(0, 3)

                        const remainingCount = offer.images.length - 4

                        return (
                            <div className="offersdes-card" key={offer.id}>
                                <div className="offersdes-gallery">
                                    <div className="offersdes-gallery_main">
                                        {mainImage && (
                                            <img
                                                src={mainImage.image_url}
                                                alt={offer.title}
                                            />
                                        )}

                                        <span className="offersdes-price">
                                            от {Number(offer.price).toLocaleString('ru-RU')} ₽
                                        </span>
                                    </div>

                                    <div className="offersdes-gallery_preview">
                                        {previewImages.map((image, index) => {
                                            const isLast = index === 2 && remainingCount > 0

                                            return (
                                                <div
                                                    className="offersdes-gallery_thumb"
                                                    key={image.id}
                                                >
                                                    <img
                                                        src={image.image_url}
                                                        alt={offer.title}
                                                    />

                                                    {isLast && (
                                                        <div className="offersdes-gallery_overlay">
                                                            +{remainingCount}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div className="offersdes-card_text">
                                    <div className="offersdes-card_title">
                                        <h2>{offer.title}</h2>
                                        <h3>{offer.location}</h3>
                                    </div>

                                    <p>{offer.description}</p>

                                    <ul className="offersdes-card_subtitle">
                                        <li>
                                            <img src={done} alt="" />
                                            <span>{offer.nights} ночей</span>
                                        </li>

                                        <li>
                                            <img src={done} alt="" />
                                            <span>{offer.flight}</span>
                                        </li>

                                        <li>
                                            <img src={done} alt="" />
                                            <span>{offer.food}</span>
                                        </li>
                                    </ul>

                                    <Link className="main-btn_site" to={`/tour/${offer.id}`}>
                                        Узнать подробнее
                                    </Link>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}