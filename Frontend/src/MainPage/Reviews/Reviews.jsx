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
            .then((data) => setReviews(Array.isArray(data) ? data : []))
            .catch((err) => console.error('Ошибка загрузки отзывов:', err))
    }, [])

    useEffect(() => {
        if (!reviews.length || !swiperRef.current) return

        requestAnimationFrame(() => {
            swiperRef.current.update()

            if (reviews.length > 1) {
                swiperRef.current.slideToLoop(0, 0, false)
            }
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
                        loop={reviews.length > 2}
                        speed={600}
                        breakpoints={{
                            0: {
                                slidesPerView: 1,
                                centeredSlides: false,
                                spaceBetween: 0,
                            },
                            769: {
                                slidesPerView: 'auto',
                                centeredSlides: true,
                                spaceBetween: 24,
                            },
                        }}
                    >
                        {reviews.map((review) => {
                            const rating = Math.max(0, Math.min(5, Number(review.rating) || 0))
                            const description = review.description?.trim() || 'Пользователь пока не добавил текст отзыва.'
                            const name = review.name?.trim() || 'Пользователь'
                            const initials = review.initials?.trim() || name.slice(0, 1).toUpperCase()

                            return (
                                <SwiperSlide key={review.id} className="reviews-slide">
                                    <article className="reviews-card">
                                        <div className="reviews-card_top">
                                            <span className="reviews-avatar">{initials}</span>
                                            <p>{name}</p>
                                        </div>

                                        <p className="reviews-card_desc">{description}</p>

                                        <ul className="reviews-card_star" aria-label={`Оценка ${rating} из 5`}>
                                            {Array.from({ length: rating }).map((_, index) => (
                                                <li key={index}>
                                                    <img src={star} alt="" />
                                                </li>
                                            ))}
                                        </ul>
                                    </article>
                                </SwiperSlide>
                            )
                        })}
                    </Swiper>

                    {reviews.length > 1 && (
                        <div className="reviews-nav">
                            <button className="reviews-btn reviews-btn-prev" type="button">
                                <img src={arrowSwiper} alt="Назад" />
                            </button>

                            <button className="reviews-btn reviews-btn-next" type="button">
                                <img src={arrowSwiper} alt="Вперёд" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}