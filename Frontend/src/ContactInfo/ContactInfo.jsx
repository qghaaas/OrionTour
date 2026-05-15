import { useState } from 'react';
import '../main.css';
import './ContactInfo.css';
import { YMaps, Map, Placemark } from '@pbe/react-yandex-maps';
import plane from './img/plane.png'



export default function ContactInfo() {
    const mapCenter = [54.720754, 20.499825];
    const initialContactForm = {
        full_name: '',
        phone: '',
        email: '',
        question: '',
        personal_data_agreement: false,
        marketing_consent: false
    };

    const [contactForm, setContactForm] = useState(initialContactForm);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formMessage, setFormMessage] = useState('');

    const handleContactChange = (event) => {
        const { name, value, type, checked } = event.target;

        setContactForm((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleContactSubmit = async (event) => {
        event.preventDefault();
        setFormMessage('');

        if (!contactForm.personal_data_agreement) {
            setFormMessage('Необходимо согласие на обработку персональных данных');
            return;
        }

        try {
            setIsSubmitting(true);

            const response = await fetch('http://localhost:3010/api/contact-requests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(contactForm)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Ошибка при отправке заявки');
            }

            setFormMessage('Заявка успешно отправлена');
            setContactForm(initialContactForm);
        } catch (error) {
            setFormMessage(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };
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
                            <form className="contact-form_form" onSubmit={handleContactSubmit}>
                                <div className="contact-form_inputs">
                                    <input
                                        type="text"
                                        name="full_name"
                                        placeholder="ФИО"
                                        value={contactForm.full_name}
                                        onChange={handleContactChange}
                                        required
                                    />

                                    <input
                                        type="tel"
                                        name="phone"
                                        placeholder="+7 (999) 999-99-99"
                                        value={contactForm.phone}
                                        onChange={handleContactChange}
                                        required
                                    />

                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="E-mail"
                                        value={contactForm.email}
                                        onChange={handleContactChange}
                                    />

                                    <textarea
                                        name="question"
                                        placeholder="Какой вопрос?"
                                        value={contactForm.question}
                                        onChange={handleContactChange}
                                        required
                                    ></textarea>
                                </div>

                                <div className="contact-form_checkboxes">
                                    <label className="contact-checkbox">
                                        <input
                                            type="checkbox"
                                            name="personal_data_agreement"
                                            checked={contactForm.personal_data_agreement}
                                            onChange={handleContactChange}
                                        />

                                        <span className="checkmark"></span>

                                        <span className="checkbox-text">
                                            Я согласен на обработку персональных данных
                                        </span>
                                    </label>

                                    <label className="contact-checkbox">
                                        <input
                                            type="checkbox"
                                            name="marketing_consent"
                                            checked={contactForm.marketing_consent}
                                            onChange={handleContactChange}
                                        />

                                        <span className="checkmark"></span>

                                        <span className="checkbox-text">
                                            Я согласен получать рекламу
                                        </span>
                                    </label>
                                </div>

                                {formMessage && (
                                    <p className="contact-form_message">
                                        {formMessage}
                                    </p>
                                )}

                                <button
                                    className="main-btn_site contact-form_button"
                                    type="submit"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Отправка...' : 'Отправить заявку'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}