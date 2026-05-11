import '../main.css';
import './ContactInfo.css';
import { YMaps, Map, Placemark } from '@pbe/react-yandex-maps';
import plane from './img/plane.png'

export default function ContactInfo() {
    const mapCenter = [54.720754, 20.499825];

    return (
        <section className="contact-info">
            <h1 className="name-title_page">Контактная информация</h1>

            <div className="container">
                <div className="contact-info_inner">
                    <h2>
                        <span>Наш офис по адресу:</span>
                        г. Калининград, <br />
                        площадь Победы, 4
                    </h2>

                    <div className="contact-map">
                        <YMaps>
                            <Map
                                defaultState={{
                                    center: mapCenter,
                                    zoom: 16,
                                }}
                                width="100%"
                                height="100%"
                                options={{
                                    suppressMapOpenBlock: true,
                                }}
                                modules={['control.ZoomControl', 'control.FullscreenControl']}
                            >
                                <Placemark
                                    geometry={mapCenter}
                                    properties={{
                                        balloonContent: 'Орион-Тур',
                                    }}
                                />
                            </Map>
                        </YMaps>
                    </div>
                </div>
            </div>

            <div className="contact-form">
                <div className='bg-plane'><img src={plane} alt="" /></div>
                <div className="container">
                    <div className="contact-form_inner">
                        <div className='contact-form_title'>
                            <h3>Возникли вопросы? <br />
                                Заполните форму и мы с Вами свяжемся</h3>
                        </div>

                        <div className="contact-form_block">
                            <form className="contact-form_form">

                                <div className="contact-form_inputs">

                                    <input
                                        type="text"
                                        placeholder="ФИО"
                                    />

                                    <input
                                        type="tel"
                                        placeholder="+7 (999) 999-99-99"
                                    />

                                    <input
                                        type="email"
                                        placeholder="E-mail"
                                    />

                                    <textarea
                                        placeholder="Какой вопрос?"
                                    ></textarea>

                                </div>

                                <div className="contact-form_checkboxes">
                                    <label className="contact-checkbox">
                                        <input type="checkbox" />

                                        <span className="checkmark"></span>

                                        <span className="checkbox-text">
                                            Я согласен на обработку персональных данных
                                        </span>
                                    </label>

                                    <label className="contact-checkbox">
                                        <input type="checkbox" />

                                        <span className="checkmark"></span>

                                        <span className="checkbox-text">
                                            Я согласен получать рекламу
                                        </span>
                                    </label>
                                </div>

                                <button
                                    className="main-btn_site contact-form_button"
                                    type="submit"
                                >
                                    Отправить заявку
                                </button>

                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}