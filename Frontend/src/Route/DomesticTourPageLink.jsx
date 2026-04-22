import DomesticTour from "../DomesticTourPage/DomesticTour";
import Footer from "../MainPage/Footer/Footer";
import Header from "../MainPage/Header/Header";



export default function DomesticTourPage() {
    return (
        <>
            <Header />
            <DomesticTour />
            <Footer variant="domestic-tour" />
        </>
    )
}