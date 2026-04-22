import '../main.css'
import './DomesticTour.css'
import domtourpagefront from './img/domtourpagefront.png'


export default function DomesticTour() {
    const domtourcard = [
        {
            id: 1,
            title: "Комбинированный экскурсионный тур по историческим памятникам",
            price: "999",
            description: "Экскурсионный тур по Кёнигсбергскому кафедральному собору, музеям и старинным крепостным стенам, вечерняя прогулка по набережной и дегустация местной кухни.",
            image: domtourpagefront,
        },
        {
            id: 2,
            title: "Комбинированный экскурсионный тур по историческим памятникам",
            price: "999",
            description: "Экскурсионный тур по Кёнигсбергскому кафедральному собору, музеям и старинным крепостным стенам, вечерняя прогулка по набережной и дегустация местной кухни.",
            image: domtourpagefront,
        },
        {
            id: 3,
            title: "Комбинированный экскурсионный тур по историческим памятникам",
            price: "999",
            description: "Экскурсионный тур по Кёнигсбергскому кафедральному собору, музеям и старинным крепостным стенам, вечерняя прогулка по набережной и дегустация местной кухни.",
            image: domtourpagefront,
        },
        {
            id: 4,
            title: "Комбинированный экскурсионный тур по историческим памятникам",
            price: "999",
            description: "Экскурсионный тур по Кёнигсбергскому кафедральному собору, музеям и старинным крепостным стенам, вечерняя прогулка по набережной и дегустация местной кухни.",
            image: domtourpagefront,
        },
    ]
    return (
        <>
            <section className="domtour-page">
                <h1 className='name-title_page'>Туры в Калининград </h1>
                <div className="container">
                    <div className="domtour-page_inner">

                        {domtourcard.map(card => (
                            <div className="domtour-page_card" key={card.id}>
                                <img src={card.image} alt={card.title} width="374px" height="330px" />

                                <div className='domtour-page_card-content'>
                                    <h2>{card.title}</h2>
                                    <span>от {card.price} ₽</span>
                                    <p>{card.description}</p>

                                    <button className='main-btn_site' type='submit'>
                                        Купить
                                    </button>
                                </div>
                            </div>
                        ))}

                    </div>
                </div>
            </section>
        </>
    )
}