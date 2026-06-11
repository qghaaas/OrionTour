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
    const [activeReview, setActiveReview] = useState(null)

    const sectionRef = useRef(null)
    const swiperRef = useRef(null)
    const prevRef = useRef(null)
    const nextRef = useRef(null)

    const getStartIndex = () => {
        if (typeof window === 'undefined') return 0
        return window.innerWidth > 768 && reviews.length > 2 ? 1 : 0
    }

    const closeModal = () => {
        setActiveReview(null)
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

            swiper.update()
            swiper.slideTo(getStartIndex(), 0, false)
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

    useEffect(() => {
        if (!activeReview) return

        const handleEsc = (event) => {
            if (event.key === 'Escape') {
                closeModal()
            }
        }

        document.body.classList.add('modal-open')
        window.addEventListener('keydown', handleEsc)

        return () => {
            document.body.classList.remove('modal-open')
            window.removeEventListener('keydown', handleEsc)
        }
    }, [activeReview])

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
                        {reviews.map((review) => (
                            <SwiperSlide key={review.id} className="reviews-slide">
                                <ReviewCard review={review} onOpen={setActiveReview} />
                            </SwiperSlide>
                        ))}
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

            {activeReview && (
                <ReviewsModal review={activeReview} onClose={closeModal} />
            )}
        </section>
    )
}

function ReviewCard({ review, onOpen }) {
    const descRef = useRef(null)
    const [isClamped, setIsClamped] = useState(false)

    const rating = Math.max(0, Math.min(5, Number(review.rating)))

    useEffect(() => {
        const desc = descRef.current

        if (!desc) return

        const checkClamp = () => {
            setIsClamped(desc.scrollHeight > desc.clientHeight + 1)
        }

        const frameId = requestAnimationFrame(checkClamp)

        const resizeObserver = new ResizeObserver(checkClamp)
        resizeObserver.observe(desc)

        window.addEventListener('resize', checkClamp)

        return () => {
            cancelAnimationFrame(frameId)
            resizeObserver.disconnect()
            window.removeEventListener('resize', checkClamp)
        }
    }, [review.description])

    return (
        <article className="reviews-card">
            <div className="reviews-card_top">
                <span className="reviews-avatar">{review.initials}</span>
                <p>{review.name}</p>
            </div>

            <p ref={descRef} className="reviews-card_desc">
                {review.description}
            </p>

            <div className="reviews-card_bottom">
                {isClamped && (
                    <button
                        className="reviews-read-more"
                        type="button"
                        onClick={() =>
                            onOpen({
                                ...review,
                                rating,
                            })
                        }
                    >
                        Читать полностью
                    </button>
                )}

                <ul className="reviews-card_star" aria-label={`Оценка ${rating} из 5`}>
                    {Array.from({ length: rating }).map((_, index) => (
                        <li key={index}>
                            <img src={star} alt="" />
                        </li>
                    ))}
                </ul>
            </div>
        </article>
    )
}

function ReviewsModal({ review, onClose }) {
    return (
        <div className="reviews-modal" onMouseDown={onClose}>
            <article className="reviews-modal_card" onMouseDown={(event) => event.stopPropagation()}>
                <button className="reviews-modal_close" type="button" onClick={onClose}>
                    ×
                </button>

                <div className="reviews-card_top reviews-modal_top">
                    <span className="reviews-avatar">{review.initials}</span>
                    <p>{review.name}</p>
                </div>

                <p className="reviews-modal_desc">{review.description}</p>

                <ul className="reviews-card_star reviews-modal_star" aria-label={`Оценка ${review.rating} из 5`}>
                    {Array.from({ length: review.rating }).map((_, index) => (
                        <li key={index}>
                            <img src={star} alt="" />
                        </li>
                    ))}
                </ul>
            </article>
        </div>
    )
}