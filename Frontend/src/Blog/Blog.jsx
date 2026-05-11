import "../main.css";
import "./Blog.css";
import Calendar from "./img/Calendar.svg";
import Eye from "./img/Eye.svg";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Blog() {
    const [blogCards, setBlogCards] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("http://localhost:3010/api/blog-posts")
            .then((res) => res.json())
            .then((data) => setBlogCards(data))
            .catch((error) => console.error("Ошибка загрузки блога:", error))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <p>Загрузка...</p>;
    }

    return (
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
                            key={card.id}
                            to={`/blogPage/${card.id}`}
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
    );
}