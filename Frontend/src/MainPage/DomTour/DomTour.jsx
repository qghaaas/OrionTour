import '../../main.css'
import './DomTour.css'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'


export default function DomTour() {
    const [domtour, setDomtour] = useState([])

    useEffect(() => {
        fetch('http://localhost:3010/api/domestic-categories')
            .then((res) => res.json())
            .then((data) => {
                const normalizedData = data.map((item) => ({
                    ...item,
                    image_url: item.image_url?.startsWith('http')
                        ? item.image_url
                        : `http://localhost:3010${item.image_url}`,
                }))
                setDomtour(normalizedData)
            })
            .catch((err) => console.error('Ошибка загрузки внутреннего туризма:', err))
    }, [])

    return (
        <section className="domtour">
            <div className="container">
                <div className="domtour-inner">
                    <div className="domtour-title">
                        <h2>Внутренний туризм</h2>
                        <p>
                            Экскурсии по Калининграду и по области. Мы предлагаем
                            уникальные возможности для знакомства с историческим
                            наследием и природной красотой Калининградской области
                        </p>
                    </div>

                    <div className="domtour-grid">
                        {domtour.map((tour, index) => (
                            <Link
                                key={tour.id}
                                to="/DomesticTourism"
                                state={{
                                    categoryTitle: tour.title || tour.description,
                                }}
                                className={`domtour-item domcards${index + 1}`}
                            >
                                <img src={tour.image_url} alt={tour.title || tour.description} />
                                <p>{tour.description || tour.title}</p>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}