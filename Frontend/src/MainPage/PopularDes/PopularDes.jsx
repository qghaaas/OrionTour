import '../../main.css'
import './PopularDes.css'
import arrowSwiper from '../../mainIMG/arrowSwiper.svg'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'



export default function PopularDes() {
    const [cards, setCards] = useState([])
    const swiperRef = useRef(null)

    useEffect(() => {
        fetch('http://localhost:3010/api/popular-tours')
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setCards(data.slice(0, 3))
                }
            })
            .catch((err) => console.error('Ошибка загрузки популярных туров:', err))
    }, [])

    const swiperCards = cards.length === 3 ? [...cards, ...cards] : cards

    return (
        <section className="popdes">
            <div className="container">
                <div className="popdes-inner">
                    <h2>Популярные направления</h2>

                    <button
                        className="popdes-btn popdes-prev"
                        type="button"
                        onClick={() => swiperRef.current?.slidePrev()}
                    >
                        <img src={arrowSwiper} alt="Назад" />
                    </button>

                    <Swiper
                        onSwiper={(swiper) => {
                            swiperRef.current = swiper
                        }}
                        loop={cards.length === 3}
                        watchOverflow={false}
                        spaceBetween={71}
                        slidesPerView={3}
                        breakpoints={{
                            0: {
                                slidesPerView: 1,
                            },
                            768: {
                                slidesPerView: 2,
                            },
                            1200: {
                                slidesPerView: 3,
                            },
                        }}
                        className="pop-swiper"
                    >
                        {swiperCards.map((card, index) => (
                            <SwiperSlide key={`${card.id}-${index}`}>
                                <div className="pop-card">
                                    <div className="pop-card_top">
                                        <img src={card.image} alt={card.title} />
                                        <span>{card.price}</span>
                                    </div>

                                    <div className="pop-card_text">
                                        <div className="pop-card_title">
                                            <h3>{card.title}</h3>
                                            <span>{card.location}</span>
                                            <p>{card.description}</p>
                                        </div>

                                        <span className="pop-card_time">{card.nights}</span>

                                        <Link
                                            className="main-btn_site"
                                            to={`/tour/${card.id}`}
                                        >
                                            Забронировать
                                        </Link>
                                    </div>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>

                    <button
                        className="popdes-btn popdes-next"
                        type="button"
                        onClick={() => swiperRef.current?.slideNext()}
                    >
                        <img src={arrowSwiper} alt="Вперёд" />
                    </button>
                </div>
            </div>
        </section>
    )
}