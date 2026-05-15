import Header from '../MainPage/Header/Header'
import Directions from '../PopularDesPage/Directions/Directions'
import Footer from '../MainPage/Footer/Footer'
import OffersDes from '../PopularDesPage/OffersDes/OffersDes'
import { useParams } from 'react-router-dom'

const DEFAULT_TOUR_ID = 1

export default function PopularDesPageLink() {
    const { id } = useParams()

    const parsedTourId = Number(id)
    const currentTourId = Number.isFinite(parsedTourId) && parsedTourId > 0
        ? parsedTourId
        : DEFAULT_TOUR_ID

    return (
        <>
            <Header />
            <Directions defaultTourId={currentTourId} />
            <OffersDes currentTourId={currentTourId} />
            <Footer />
        </>
    )
}