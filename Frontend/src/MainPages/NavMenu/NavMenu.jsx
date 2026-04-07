import { Link } from 'react-router-dom'


export default function Navmenu() {
    return (
        <>
            <nav>
                <div className="container">
                    <ul>
                        <Link to='/Направления'><li>Направления</li></Link>
                        <Link to='/Поиск тура'><li>Поиск тура</li></Link>
                        <Link to='/Внутренний туризм'><li>Внутренний туризм</li></Link>
                    </ul>
                    
                </div>
            </nav>
        </>
    )
}