import '../../main.css'
import './Directions.css'
import star from '../../mainIMG/star.svg'
import { useEffect, useState } from 'react'
import { YMaps, Map, Placemark } from '@pbe/react-yandex-maps'

export default function Directions() {
    const [tour, setTour] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        fetch('http://localhost:3010/api/tours/1/details')
            .then((res) => {
                if (!res.ok) {
                    throw new Error('Ошибка загрузки данных тура')
                }
                return res.json()
            })
            .then((data) => {
                setTour(data)
                setLoading(false)
            })
            .catch((err) => {
                console.error('Ошибка загрузки направления:', err)
                setError('Не удалось загрузить данные')
                setLoading(false)
            })
    }, [])

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
                </div>
            </section>
        )
    }

    if (!tour) {
        return (
            <section className="directions">
                <div className="container">
                    <p>Тур не найден</p>
                </div>
            </section>
        )
    }

    const mainImage =
        tour.images?.find((img) => img.is_main)?.image_url ||
        tour.images?.[0]?.image_url ||
        ''

    const sideImages = tour.images?.filter((img) => !img.is_main).slice(0, 4) || []

    const morePhotoImage =
        tour.images?.[5]?.image_url ||
        sideImages[sideImages.length - 1]?.image_url ||
        mainImage

    return (
        <section className="directions">
            <div className="container">
                <div className="directions-inner">
                    <div className="directions-top">
                        <div className="directions-top_title">
                            <div className="directions-top_title-inner">
                                <h2>{tour.title}</h2>

                                <div className="directions-top_title-rev">
                                    <span>{Number(tour.hotel_rating)}</span>
                                    <img src={star} alt="star" />
                                </div>
                            </div>

                            <div className="directions-top_title-bot">
                                <span>{tour.nights} ночей</span>
                                <h3>{tour.location_name}</h3>
                            </div>
                        </div>

                        <div className="directions-top_img">
                            <div className="directions-gallery">
                                <div className="directions-gallery-main">
                                    {mainImage && (
                                        <img src={mainImage} alt={tour.title} />
                                    )}
                                </div>

                                <div className="directions-gallery-grid">
                                    {sideImages.map((img) => (
                                        <div className="directions-gallery-small" key={img.id}>
                                            <img src={img.image_url} alt={tour.title} />
                                        </div>
                                    ))}

                                    <div className="directions-gallery-small directions-gallery-more">
                                        <img src={morePhotoImage} alt="more photos" />
                                        <div className="directions-gallery-overlay">
                                            +40 фото
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="directions-main">
                        <div className="directions-des_loc">
                            <div className="directions-description">
                                <p style={{ whiteSpace: 'pre-line' }}>
                                    {tour.full_description}
                                </p>
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
                                                }}
                                                width="100%"
                                                height="250px"
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
            </div>
        </section>
    )
}