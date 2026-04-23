import '../../main.css'
import './OffersDes.css'
import { Link } from 'react-router-dom'
import Offers1 from './img/Offers1.png'
import Offers2 from './img/Offers2.png'
import Offers3 from './img/Offers3.png'
import Offers4 from './img/Offers4.png'
import done from './img/Done.png'



export default function OffersDes() {
    const offers = [
        {
            id: 1,
            title: "Rixos Premium Seagate",
            location: "Египет, Шарм-эль-Шейх",
            description: "Виллы над водой и на пляже с частными бассейнами, рестораны с мировой кухней, уникальная музыкальная атмосфера Hard Rock",
            price: 110200,
            nights: 9,
            flight: "с прямым вылетом из Москвы",
            food: "ультра всё включено",
            images: [
                { id: 1, image_url: Offers1 },
                { id: 2, image_url: Offers2 },
                { id: 3, image_url: Offers3 },
                { id: 4, image_url: Offers4 }
            ]
        },
        {
            id: 2,
            title: "Hard Rock Hotel Maldives",
            location: "Мальдивы, Южный Мале Атолл",
            description: "Отель расположен среди красивых пейзажей, создавая место, полное природной красоты полуострова Южный Синай, окруженный потрясающими садами и полем для гольфа",
            price: 477900,
            nights: 7,
            flight: "вылет из Москвы",
            food: "завтраки",
            images: [
                { id: 1, image_url: Offers1 },
                { id: 2, image_url: Offers2 },
                { id: 3, image_url: Offers3 },
                { id: 4, image_url: Offers4 },
            ]
        }
    ]

    return (
        <section className="offersdes">
            <div className="container">
                <div className="offersdes-inner">
                    {offers.map((offer) => {
                        const mainImage = offer.images[0]
                        const previewImages = offer.images.slice(1, 4)
                        const remainingCount = offer.images.length - 4

                        return (
                            <div className="offersdes-card" key={offer.id}>
                                <div className="offersdes-gallery">
                                    <div className="offersdes-gallery_main">
                                        <img src={mainImage.image_url} alt={offer.title} />
                                        <span className="offersdes-price">
                                            от {offer.price.toLocaleString('ru-RU')} ₽
                                        </span>
                                    </div>

                                    <div className="offersdes-gallery_preview">
                                        {previewImages.map((image, index) => {
                                            const isLast = index === 2 && remainingCount > 0

                                            return (
                                                <div className="offersdes-gallery_thumb" key={image.id}>
                                                    <img src={image.image_url} alt={offer.title} />
                                                    {isLast && (
                                                        <div className="offersdes-gallery_overlay">
                                                            +{remainingCount}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div className="offersdes-card_text">
                                    <div className="offersdes-card_title">
                                        <h2>{offer.title}</h2>
                                        <h3>{offer.location}</h3>
                                    </div>

                                    <p>{offer.description}</p>

                                    <ul className='offersdes-card_subtitle'>
                                        <li><img src={done} alt="" /><span>{offer.nights} ночей</span></li>
                                        <li><img src={done} alt="" /><span>{offer.flight}</span></li>
                                        <li><img src={done} alt="" /><span>{offer.food}</span></li>
                                    </ul>

                                    <Link className='main-btn_site' to="#">Узнать подробнее</Link>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}