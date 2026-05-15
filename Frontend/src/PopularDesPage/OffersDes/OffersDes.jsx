import '../../main.css'
import './OffersDes.css'
import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import done from './img/Done.png'
import GalleryModal from '../../GalleryModal/GalleryModal'



export default function OffersDes() {
    const [offers, setOffers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [activeOfferId, setActiveOfferId] = useState(null)
    const [activeImageIndex, setActiveImageIndex] = useState(0)

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

    const activeOffer = useMemo(() => {
        return offers.find((offer) => offer.id === activeOfferId) || null
    }, [offers, activeOfferId])

    const activeGalleryImages = useMemo(() => {
        if (!activeOffer?.images?.length) return []

        return activeOffer.images.filter((image) => Boolean(image.image_url))
    }, [activeOffer])

    const isGalleryOpen = Boolean(activeOffer && activeGalleryImages.length > 0)

    const openGallery = (offerId, imageId) => {
        const currentOffer = offers.find((offer) => offer.id === offerId)
        const currentImages =
            currentOffer?.images?.filter((image) => Boolean(image.image_url)) || []

        const imageIndex = currentImages.findIndex((image) => image.id === imageId)

        setActiveOfferId(offerId)
        setActiveImageIndex(imageIndex >= 0 ? imageIndex : 0)
    }

    const closeGallery = () => {
        setActiveOfferId(null)
        setActiveImageIndex(0)
    }

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
                        const offerImages =
                            offer.images?.filter((image) => Boolean(image.image_url)) || []

                        const mainImage =
                            offerImages.find((image) => image.is_main) ||
                            offerImages[0]

                        const previewImages = offerImages
                            .filter((image) => image.id !== mainImage?.id)
                            .slice(0, 3)

                        const totalPhotos = Number(offer.images_count) || offerImages.length

                        return (
                            <div className="offersdes-card" key={offer.id}>
                                <div className="offersdes-gallery">
                                    <button
                                        className="offersdes-gallery_main"
                                        type="button"
                                        onClick={() => openGallery(offer.id, mainImage?.id)}
                                        disabled={!mainImage}
                                    >
                                        {mainImage && (
                                            <img
                                                src={mainImage.image_url}
                                                alt={offer.title}
                                            />
                                        )}

                                        <span className="offersdes-price">
                                            от {Number(offer.price).toLocaleString('ru-RU')} ₽
                                        </span>
                                    </button>

                                    <div className="offersdes-gallery_preview">
                                        {previewImages.map((image, index) => {
                                            const isLastPreview =
                                                index === previewImages.length - 1

                                            return (
                                                <button
                                                    className="offersdes-gallery_thumb"
                                                    key={image.id}
                                                    type="button"
                                                    onClick={() => openGallery(offer.id, image.id)}
                                                >
                                                    <img
                                                        src={image.image_url}
                                                        alt={`${offer.title} фото ${index + 2}`}
                                                    />

                                                    {isLastPreview && totalPhotos > 0 && (
                                                        <span className="offersdes-gallery_overlay">
                                                            +{totalPhotos} <br /> фото
                                                        </span>
                                                    )}
                                                </button>
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

            <GalleryModal
                isOpen={isGalleryOpen}
                title={activeOffer?.title || ''}
                images={activeGalleryImages}
                activeIndex={activeImageIndex}
                onChangeIndex={setActiveImageIndex}
                onClose={closeGallery}
            />
        </section>
    )
}