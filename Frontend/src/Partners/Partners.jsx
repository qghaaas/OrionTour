import '../main.css'
import "./Partners.css"

import part1 from './img/part1.svg'
import part2 from './img/part2.svg'
import part3 from './img/part3.svg'
import part4 from './img/part4.svg'
import part5 from './img/part5.svg'
import part6 from './img/part6.svg'
import part7 from './img/part7.svg'

const partners = [
    {
        name: "Sunmar",
        logo: part1,
    },
    {
        name: "Библио Глобус",
        logo: part2,
    },
    {
        name: "PAC Group",
        logo: part3,
    },
    {
        name: "Pegas Touristik",
        logo: part4,
    },
    {
        name: "Anex",
        logo: part5,
    },
    {
        name: "Coral Travel",
        logo: part6,
    },
    {
        name: "Fun&Sun",
        logo: part7,
    },
];

export default function Partners() {
    const marqueePartners = [...partners, ...partners];

    return (
        <section className="partners">

            <div className="name-title_page name-title_page-partners">
                <h1>Наши партнёры</h1>
                <p className="name-title_page-sub">
                    Мы работаем с проверенными туристическими операторами
                </p>
            </div>

            <div className="partners__slider">
                <div className="partners__track">

                    <div className="partners__group">
                        {marqueePartners.map((partner, index) => (
                            <div className="partners__item" key={`first-${partner.name}-${index}`}>
                                <img src={partner.logo} alt={partner.name} />
                            </div>
                        ))}
                    </div>

                    <div className="partners__group" aria-hidden="true">
                        {marqueePartners.map((partner, index) => (
                            <div className="partners__item" key={`second-${partner.name}-${index}`}>
                                <img src={partner.logo} alt="" />
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </section>
    );
}