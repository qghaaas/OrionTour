import '../../main.css'
import './Directions.css'
import star from '../../mainIMG/star.svg'



export default function Directions() {
    return (
        <>
            <section className="directions">
                <div className="container">
                    <div className="directions-inner">

                        <div className="directions-top">
                            <div className="directions-top_title">
                                <div className='directions-top_title-inner'>
                                    <h2>Fort Arabesque The Villas</h2>
                                    <div className='directions-top_title-rev'>
                                        <span>4</span>
                                        <img src={star} alt="star" />
                                    </div>
                                </div>

                                <div className='directions-top_title-bot'>
                                    <span>9 ночей</span>
                                    <h3>Макади Бей, Хургада</h3>
                                </div>
                            </div>

                            <div className="directions-top_img">
                                <div>
                                    <img src="" alt="" />
                                </div>
                            </div>
                        </div>


                        <div className="directions-main">
                            <div className='directions-des_loc'>
                                <p>Простая элегантность для тех, кто ищет эксклюзивный, роскошный отдых. 65 вилл с одной или двумя спальнями,
                                    все с просторной стойкой регистрации и гостиной, современной ванной комнатой и частной террасой с доступом к бассейну с подогревом.
                                </p>
                                <p>Роскошные удобства включают широкий выбор кофе / чая и натуральных трав, полностью укомплектованный мини-бар, собственный DVD-плеер, ЖК-телевизор с плоским экраном
                                    и библиотеку последних международных фильмов.</p>

                                <div className='directions-loc'>
                                    <p>Где находится</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}