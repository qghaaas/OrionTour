import '../../main.css'
import './PopularDes.css'
import frontpop from './img/frontpop.png'
import arrowSwiper from '../../mainIMG/arrowSwiper.svg'

import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation } from 'swiper/modules'

import 'swiper/css'
import 'swiper/css/navigation'

export default function PopularDes() {
    const cards = [
        {
            id: 1,
            title: 'Fort Arabesque The Villas',
            location: 'Макади Бей, Хургада',
            description: 'Простая элегантность для тех, кто ищет эксклюзивный, роскошный отдых Виллы с одной или двумя спальнями',
            price: 'от 105 900 ₽',
            nights: '9 ночей',
            image: frontpop,
        },
        {
            id: 2,
            title: 'Fort Arabesque The Villas',
            location: 'Макади Бей, Хургада',
            description: 'Простая элегантность для тех, кто ищет эксклюзивный, роскошный отдых Виллы с одной или двумя спальнями',
            price: 'от 105 900 ₽',
            nights: '9 ночей',
            image: frontpop,
        },
        {
            id: 3,
            title: 'Fort Arabesque The Villas',
            location: 'Макади Бей, Хургада',
            description: 'Простая элегантность для тех, кто ищет эксклюзивный, роскошный отдых Виллы с одной или двумя спальнями',
            price: 'от 105 900 ₽',
            nights: '9 ночей',
            image: frontpop,
        },
        {
            id: 4,
            title: 'Fort Arabesque The Villas',
            location: 'Макади Бей, Хургада',
            description: 'Простая элегантность для тех, кто ищет эксклюзивный, роскошный отдых Виллы с одной или двумя спальнями',
            price: 'от 105 900 ₽',
            nights: '9 ночей',
            image: frontpop,
        },
    ]

    return (
        <section className="popdes">
            <div className="container">
                <div className="popdes-inner">

                    <h2>Популярные направления</h2>

                    <button className="popdes-btn popdes-prev" type="button">
                        <img src={arrowSwiper} alt="Назад" />
                    </button>

                    <Swiper
                        modules={[Navigation]}
                        navigation={{
                            prevEl: '.popdes-prev',
                            nextEl: '.popdes-next',
                        }}
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
                        {cards.map((card) => (
                            <SwiperSlide key={card.id}>
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
                                        <button className="main-btn_site" type="button">
                                            Забронировать
                                        </button>
                                    </div>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>

                    <button className="popdes-btn popdes-next" type="button">
                        <img src={arrowSwiper} alt="Вперёд" />
                    </button>
                </div>
            </div>
        </section>
    )
}