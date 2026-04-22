import '../../main.css'
import './Reviews.css'
import arrowSwiper from '../../mainIMG/arrowSwiper.svg'
import star from '../../mainIMG/star.svg'
import { useEffect, useRef, useState } from 'react'

import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation } from 'swiper/modules'

import 'swiper/css'
import 'swiper/css/navigation'

export default function Reviews() {
    const [reviews, setReviews] = useState([])
    const swiperRef = useRef(null)

    useEffect(() => {
        fetch('http://localhost:3010/api/reviews')
            .then((res) => res.json())
            .then((data) => setReviews(data))
            .catch((err) => console.error('Ошибка загрузки отзывов:', err))
    }, [])

    useEffect(() => {
        if (!reviews.length || !swiperRef.current) return

        requestAnimationFrame(() => {
            swiperRef.current.update()
            swiperRef.current.slideToLoop(1, 0, false)
        })
    }, [reviews])

    if (!reviews.length) return null

    return (
        <section className="reviews">
            <div className="container">
                <div className="reviews-inner">
                    <h2>Отзывы наших клиентов</h2>

                    <Swiper
                        modules={[Navigation]}
                        className="reviews-swiper"
                        onSwiper={(swiper) => {
                            swiperRef.current = swiper
                        }}
                        navigation={{
                            prevEl: '.reviews-btn-prev',
                            nextEl: '.reviews-btn-next',
                        }}
                        centeredSlides={true}
                        slidesPerView="auto"
                        spaceBetween={24}
                        loop={true}
                        speed={600}
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
                                        {Array.from({ length: review.rating }).map((_, index) => (
                                            <li key={index}>
                                                <img src={star} alt="" />
                                            </li>
                                        ))}
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