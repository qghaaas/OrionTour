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

    const sectionRef = useRef(null)
    const swiperRef = useRef(null)
    const prevRef = useRef(null)
    const nextRef = useRef(null)

    const getStartIndex = () => {
        if (typeof window === 'undefined') return 0

        return window.innerWidth > 768 && reviews.length > 2 ? 1 : 0
    }

    useEffect(() => {
        fetch('http://localhost:3010/api/reviews')
            .then((res) => res.json())
            .then((data) => setReviews(Array.isArray(data) ? data : []))
            .catch((err) => console.error('Ошибка загрузки отзывов:', err))
    }, [])

    useEffect(() => {
        if (!reviews.length) return

        const updateSwiper = () => {
            const swiper = swiperRef.current

            if (!swiper || swiper.destroyed) return

            const startIndex = getStartIndex()

            swiper.update()
            swiper.slideTo(startIndex, 0, false)
        }

        const frameId = requestAnimationFrame(updateSwiper)

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    requestAnimationFrame(updateSwiper)
                }
            },
            {
                threshold: 0.25,
            }
        )

        if (sectionRef.current) {
            observer.observe(sectionRef.current)
        }

        window.addEventListener('resize', updateSwiper)

        return () => {
            cancelAnimationFrame(frameId)
            observer.disconnect()
            window.removeEventListener('resize', updateSwiper)
        }
    }, [reviews.length])

    if (!reviews.length) return null

    return (
        <section className="reviews" ref={sectionRef}>
            <div className="container">
                <div className="reviews-inner">
                    <h2>Отзывы наших клиентов</h2>

                    <Swiper
                        modules={[Navigation]}
                        className="reviews-swiper"
                        onSwiper={(swiper) => {
                            swiperRef.current = swiper
                        }}
                        onInit={(swiper) => {
                            swiperRef.current = swiper

                            requestAnimationFrame(() => {
                                if (!swiper || swiper.destroyed) return

                                if (prevRef.current && nextRef.current) {
                                    swiper.params.navigation.prevEl = prevRef.current
                                    swiper.params.navigation.nextEl = nextRef.current

                                    swiper.navigation.destroy()
                                    swiper.navigation.init()
                                    swiper.navigation.update()
                                }

                                swiper.update()
                                swiper.slideTo(getStartIndex(), 0, false)
                            })
                        }}
                        navigation={{
                            prevEl: prevRef.current,
                            nextEl: nextRef.current,
                        }}
                        observer={true}
                        observeParents={true}
                        resizeObserver={true}
                        watchOverflow={true}
                        loop={false}
                        rewind={reviews.length > 2}
                        speed={600}
                        initialSlide={getStartIndex()}
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
                            <button ref={prevRef} className="reviews-btn reviews-btn-prev" type="button">
                                <img src={arrowSwiper} alt="Назад" />
                            </button>

                            <button ref={nextRef} className="reviews-btn reviews-btn-next" type="button">
                                <img src={arrowSwiper} alt="Вперёд" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}