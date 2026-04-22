import '../../main.css'
import './TravelDes.css'
import travelBg from './img/travelBg.png'
import { useState } from 'react'

export default function TravelDes() {
    const [requestText, setRequestText] = useState('')
    const [message, setMessage] = useState('')

    const handleSubmit = async () => {
        try {
            const response = await fetch('http://localhost:3010/api/travel-requests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    request_text: requestText,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                setMessage(data.message || 'Ошибка отправки')
                return
            }

            setMessage('Заявка отправлена')
            setRequestText('')
        } catch (error) {
            console.error(error)
            setMessage('Ошибка сервера')
        }
    }

    return (
        <section className="travdes">
            <div className="container">
                <div className="travdes-inner">
                    <h2>Конструктор путешествий</h2>

                    <div className="travdes-form">
                        <img src={travelBg} alt="" />

                        <div className="travdes-content">
                            <h3>
                                Забудьте про поиск <br />
                                и начните путешествие
                            </h3>

                            <p>
                                Мы поможем подобрать для вас уникальные маршруты,
                                билеты и отели учитвая Ваши предпочтения
                            </p>

                            <input
                                placeholder="Хочу отель на берегу моря в Италии"
                                type="text"
                                value={requestText}
                                onChange={(e) => setRequestText(e.target.value)}
                            />
                            {message && <p>{message}</p>}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}