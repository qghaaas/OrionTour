import "../main.css";
import "./BlogPage.css";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";



export default function BlogPage() {
    const { id } = useParams();
    const [blogPost, setBlogPost] = useState(null);
    const [loading, setLoading] = useState(true);

    const countedPostRef = useRef(null);

    useEffect(() => {
        setLoading(true);

        fetch(`http://localhost:3010/api/blog-posts/${id}`)
            .then((res) => res.json())
            .then((data) => setBlogPost(data))
            .catch((error) => {
                console.error("Ошибка загрузки статьи:", error);
                setBlogPost(null);
            })
            .finally(() => setLoading(false));

        if (countedPostRef.current !== id) {
            countedPostRef.current = id;

            fetch(`http://localhost:3010/api/blog-posts/${id}/increment-views`, {
                method: "POST",
            }).catch((error) =>
                console.error("Ошибка обновления просмотров:", error)
            );
        }
    }, [id]);

    if (loading) {
        return <p>Загрузка...</p>;
    }

    if (!blogPost) {
        return <p>Статья не найдена</p>;
    }


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
                        <img src={blogPost.main_image} alt={blogPost.title} />
                    </div>

                    <div className="blog-page_content">
                        <h2 className="blog-page-title">
                            {blogPost.title}
                        </h2>

                        {blogPost.sections.map((item, index) => (
                            <div className="blog-page_item" key={item.id}>
                                <h3 className="blog-page-title_inner">
                                    <span>{index + 1}</span> {item.title}
                                </h3>

                                <p className="blog-page_text">{item.text}</p>

                                {item.images?.length > 0 && (
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
                                )}

                                {item.subtext && (
                                    <div className="blog-page_subtext">
                                        {item.subtext
                                            .split("\n\n")
                                            .map((paragraph, paragraphIndex) => (
                                                <p key={paragraphIndex}>
                                                    {paragraph}
                                                </p>
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