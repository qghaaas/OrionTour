import '../main.css'
import './Blog.css'
import BlogImage1 from './img/blogimg.png'
import Calendar from './img/Calendar.svg'
import Eye from './img/Eye.svg'
import { Link } from 'react-router-dom'


export default function Blog() {
    const blogCards = [
        {
            id: 1,
            image: BlogImage1,
            views: 7000,
            date: "11.04.2026",
            title: "5 самых безопасных стран мира",
        },
        {
            id: 2,
            image: BlogImage1,
            views: 6560,
            date: "5.04.2026",
            title: "Как путешествовать по Европе в 2026 году",
        },
        {
            id: 3,
            image: BlogImage1,
            views: 6560,
            date: "5.04.2026",
            title: "Как купить дешёвые билеты на самолёт",
        },
        {
            id: 4,
            image: BlogImage1,
            views: 6560,
            date: "5.04.2026",
            title: "Как купить дешёвые билеты на самолёт",
        },
        {
            id: 5,
            image: BlogImage1,
            views: 6560,
            date: "5.04.2026",
            title: "Как купить дешёвые билеты на самолёт",
        },
        {
            id: 6,
            image: BlogImage1,
            views: 6560,
            date: "5.04.2026",
            title: "Как купить дешёвые билеты на самолёт",
        },
        {
            id: 7,
            image: BlogImage1,
            views: 6560,
            date: "5.04.2026",
            title: "Как купить дешёвые билеты на самолёт",
        },
        {
            id: 8,
            image: BlogImage1,
            views: 6560,
            date: "5.04.2026",
            title: "Как купить дешёвые билеты на самолёт",
        },
        {
            id: 9,
            image: BlogImage1,
            views: 6560,
            date: "5.04.2026",
            title: "Как купить дешёвые билеты на самолёт",
        },
    ];
    return (
        <>

            <section className="blog">
                <div className="name-title_page">
                    <h1>Блог</h1>
                    <p className="name-title_page-sub">
                        полезные статьи, гиды в путешествиях, новости компании
                    </p>
                </div>

                <div className="container">
                    <div className="blog-inner">
                        {blogCards.map((card) => (
                            <Link
                                to={"/blogPage"}
                                className="blog-link" 
                            >
                                <div
                                    className="blog-card"
                                    style={{ backgroundImage: `url(${card.image})` }}
                                >
                                    <div className="blog-card_item">
                                        <div>
                                            <img src={Eye} alt="Eye" />
                                            <span>{card.views}</span>
                                        </div>

                                        <div>
                                            <img src={Calendar} alt="Calendar" />
                                            <span>{card.date}</span>
                                        </div>
                                    </div>

                                    <h2>{card.title}</h2>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
        </>
    )
}