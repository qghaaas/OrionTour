import '../../main.css'
import './Reviews.css'
import arrowSwiper from '../../mainIMG/arrowSwiper.svg'
import star from './img/star.svg'

import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation } from 'swiper/modules'

import 'swiper/css'
import 'swiper/css/navigation'

export default function Reviews() {
    const reviews = [
        {
            id: 1,
            name: 'Алина Михалкова',
            initials: 'АМ',
            description:
                'Все было организовано на высшем уровне: от подбора тура до трансфера. Менеджеры были внимательны и отзывчивы, всегда готовы помочь с любыми вопросами. Особенно понравился индивидуальный подход и профессионализм команды. Рекомендую всем, кто ищет надежного туроператора!',
        },
        {
            id: 2,
            name: 'Ренат Ефимов',
            initials: 'РЕ',
            description:
                'Все было организовано на высшем уровне: от подбора тура до трансфера. Менеджеры были внимательны и отзывчивы, всегда готовы помочь с любыми вопросами. Особенно понравился индивидуальный подход и профессионализм команды. Рекомендую всем, кто ищет надежного туроператора!',
        },
        {
            id: 3,
            name: 'Анна Морозова',
            initials: 'АМ',
            description:
                'Все было организовано на высшем уровне: от подбора тура до трансфера. Менеджеры были внимательны и отзывчивы, всегда готовы помочь с любыми вопросами. Особенно понравился индивидуальный подход и профессионализм команды. Рекомендую всем, кто ищет надежного туроператора!',
        },
        {
            id: 4,
            name: 'Игорь Павлов',
            initials: 'ИП',
            description:
                'Все было организовано на высшем уровне: от подбора тура до трансфера. Менеджеры были внимательны и отзывчивы, всегда готовы помочь с любыми вопросами. Особенно понравился индивидуальный подход и профессионализм команды. Рекомендую всем, кто ищет надежного туроператора!',
        },
    ]

    return (
        <section className="reviews">
            <div className="container">
                <div className="reviews-inner">
                    <h2>Отзывы наших клиентов</h2>

                    <Swiper
                        modules={[Navigation]}
                        className="reviews-swiper"
                        navigation={{
                            prevEl: '.reviews-btn-prev',
                            nextEl: '.reviews-btn-next',
                        }}
                        centeredSlides={true}
                        slidesPerView="auto"
                        spaceBetween={24}
                        loop={true}
                        speed={600}
                        slideToClickedSlide={true}
                    >
                        {reviews.map((review) => (
                            <SwiperSlide key={review.id} className="reviews-slide">
                                <div className="reviews-card">
                                    <div className="reviews-card_top">
                                        <span className="reviews-avatar">{review.initials}</span>
                                        <p>{review.name}</p>
                                    </div>

                                    <p className="reviews-card_desc">{review.description}</p>

                                    <ul className="reviews-card_star">
                                        <li><img src={star} alt="" /></li>
                                        <li><img src={star} alt="" /></li>
                                        <li><img src={star} alt="" /></li>
                                        <li><img src={star} alt="" /></li>
                                        <li><img src={star} alt="" /></li>
                                    </ul>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>

                    <div className="reviews-nav">
                        <button className="reviews-btn reviews-btn-prev" type="button">
                            <img src={arrowSwiper} alt="Назад" />
                        </button>

                        <button className="reviews-btn reviews-btn-next" type="button">
                            <img src={arrowSwiper} alt="Вперед" />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    )
}