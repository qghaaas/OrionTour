import '../../main.css'
import './DomTour.css'
import frontdom from './img/frontdom.png'

export default function DomTour() {
    const domtour = [
        {
            id: 1,
            description: 'Туры в Калининград',
            image: frontdom,
        },
        {
            id: 2,
            description: 'Туры в Калининград',
            image: frontdom,
        },
        {
            id: 3,
            description: 'Экскурсии по Светлогорску, Зеленоградску, Пионерску',
            image: frontdom,
        },
        {
            id: 4,
            description: 'Индивидуальные экскурсии',
            image: frontdom,
        },
    ]

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
                            <div
                                key={tour.id}
                                className={`domtour-item domcards${index + 1}`}
                            >
                                <img src={tour.image} alt={tour.description} />
                                <p>{tour.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}