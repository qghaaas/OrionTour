import { Route, Routes } from "react-router-dom";
import { HashRouter } from "react-router-dom";
import MainPageLink from "./Route/MainPageLink";
import DomesticTourPageLink from './Route/DomesticTourPageLink'
import PopularDesPageLink from "./Route/PopularDesPageLink";
import AccountLink from "./Route/AccountLink";
import ContactInfoLink from "./Route/ContactInfoLink";
import AboutUsLink from "./Route/AboutUsLink";
import BlogLink from './Route/BlogLink'
import BlogPageLink from './Route/BlogPageLink'
import Globe from "./Globe/Globe";
import AdminPanelLink from './Route/AdminPanelLink'
import AdminAuthLink from './Route/AdminAuthLink'


export default function MainRouter() {
    return (
        <>
            <HashRouter>
                <Routes>

                    <Route path="/" index element={<MainPageLink />} />
                    <Route path="/Home" element={<MainPageLink />} />
                    <Route path="/DomesticTourism" element={<DomesticTourPageLink />} />
                    <Route path="/Directions" element={<PopularDesPageLink />} />
                    <Route path="/account" element={<AccountLink />} />
                    <Route path="/ContactInfo" element={<ContactInfoLink />} />
                    <Route path="/AboutUs" element={<AboutUsLink />} />
                    <Route path="/Blog" element={<BlogLink />} />
                    <Route path="/blogPage/:id" element={<BlogPageLink />} />
                    <Route path="/interactive-globe" element={<Globe />} />
                    <Route path="/admin/login" element={<AdminAuthLink />} />
                    <Route path="/admin" element={<AdminPanelLink />} />

                </Routes>
            </HashRouter>
        </>
    )
}