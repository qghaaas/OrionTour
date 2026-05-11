import ContactInfo from "../ContactInfo/ContactInfo";
import Footer from "../MainPage/Footer/Footer";
import Header from "../MainPage/Header/Header";


export default function ContactInfoLink() {
    return (
        <>
            <Header />
            <ContactInfo />
            <Footer variant="contactInfo-footer" />
        </>
    )
}