import "../main.css";
import "./BlogPage.css";

import blogPageMain from "./img/blogPageMain.jpg";
import blogPage1 from "./img/blogPage1.png";
import blogPage2 from "./img/blogPage2.png";
import blogPage3 from "./img/blogPage3.png";

export default function BlogPage() {
    const countries = [
        {
            id: 1,
            title: "Исландия",
            text: "На протяжении многих лет мировым лидером в этом вопросе остается Исландия, где практически отсутствует тяжкая преступность, а полиция традиционно не носит огнестрельное оружие, что создает атмосферу абсолютного спокойствия.",
            images: [blogPage1],
        },
        {
            id: 2,
            title: "Ирландия",
            text: "Ирландия также занимает лидирующие позиции благодаря своему историческому нейтралитету и стабильной внутренней политике, обеспечивающей гражданам защиту от внешних и внутренних угроз. В южном полушарии образцом безопасности выступает Новая Зеландия, которая благодаря своей географической удаленности и развитой правовой системе остается одной из самых мирных стран на планете.",
            images: [blogPage2, blogPage3],
            subtext: `Страна славится не только красивыми пейзажами, рыжеволосыми жителями, пабами, народными танцами и легендами о лепреконах. Уровень образования здесь очень высок, вероятность военных конфликтов минимальна, а серьезные преступления — большая редкость.

За последнее десятилетие качество жизни ирландцев непрерывно росло, достигнув 2-го места в мировом рейтинге. Может, причина такого успеха кроется в философском подходе к решению всех проблем за пинтой красного эля?`,
        },
        {
            id: 3,
            title: "Новая Зеландия",
            text: "GGgkmdf;gkdfg",
            images: [blogPage1],
        },
    ];

    return (
        <section className="blog-page">
            <div className="name-title_page">
                <h1>Блог</h1>
                <p className="name-title_page-sub">
                    полезные статьи, гиды в путешествиях, новости компании
                </p>
            </div>

            <div className="container">
                <div className="blog-page_inner">
                    <div className="blog-mainBG">
                        <img src={blogPageMain} alt="" />
                    </div>

                    <div className="blog-page_content">
                        <h2 className="blog-page-title">
                            <span>5</span> самых безопасных стран мира
                        </h2>

                        {countries.map((item, index) => (
                            <div className="blog-page_item" key={item.id}>
                                <h3 className="blog-page-title_inner">
                                    <span>{index + 1}</span> {item.title}
                                </h3>

                                <p className="blog-page_text">{item.text}</p>

                                <div
                                    className={`blog-page_gallery blog-page_gallery--${Math.min(
                                        item.images.length,
                                        3
                                    )}`}
                                >
                                    {item.images.map((image, imageIndex) => (
                                        <img
                                            key={imageIndex}
                                            src={image}
                                            alt={item.title}
                                            className="blog-page_img"
                                        />
                                    ))}
                                </div>

                                {item.subtext && (
                                    <div className="blog-page_subtext">
                                        {item.subtext.split("\n\n").map((paragraph, paragraphIndex) => (
                                            <p key={paragraphIndex}>{paragraph}</p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}