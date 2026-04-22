import '../main.css'
import './DomesticTour.css'
import { useEffect, useState } from 'react'

export default function DomesticTour() {
    const [domtourcard, setDomtourcard] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        fetch('http://localhost:3010/api/domestic-tours/kaliningrad')
            .then((res) => {
                if (!res.ok) {
                    throw new Error('Ошибка загрузки туров')
                }
                return res.json()
            })
            .then((data) => {
                setDomtourcard(data)
                setLoading(false)
            })
            .catch((err) => {
                console.error('Ошибка загрузки туров в Калининград:', err)
                setError('Не удалось загрузить туры')
                setLoading(false)
            })
    }, [])

    if (loading) {
        return (
            <section className="domtour-page">
                <h1 className="name-title_page">Туры в Калининград</h1>
                <div className="container">
                    <p>Загрузка туров...</p>
                </div>
            </section>
        )
    }

    if (error) {
        return (
            <section className="domtour-page">
                <h1 className="name-title_page">Туры в Калининград</h1>
                <div className="container">
                    <p>{error}</p>
                </div>
            </section>
        )
    }

    return (
        <section className="domtour-page">
            <h1 className="name-title_page">Туры в Калининград</h1>
            <div className="container">
                <div className="domtour-page_inner">
                    {domtourcard.map((card) => (
                        <div className="domtour-page_card" key={card.id}>
                            <img
                                src={card.image}
                                alt={card.title}
                                width="374"
                                height="330"
                            />

                            <div className="domtour-page_card-content">
                                <h2>{card.title}</h2>
                                <span>
                                    от {Number(card.price).toLocaleString('ru-RU')} ₽
                                </span>
                                <p>{card.description}</p>

                                <button className="main-btn_site" type="button">
                                    Купить
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}