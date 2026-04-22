import DomTour from "../MainPage/DomTour/DomTour"
import Footer from "../MainPage/Footer/Footer"
import Hero from "../MainPage/Hero/Hero"
import PopularDes from "../MainPage/PopularDes/PopularDes"
import Reviews from "../MainPage/Reviews/Reviews"
import TravelDes from "../MainPage/TravelDes/TravelDes"


export default function MainPageLink() {
    return (
        <>
            <Hero />
            <PopularDes />
            <DomTour />
            <TravelDes />
            <Reviews />
            <Footer />
        </>
    )
}