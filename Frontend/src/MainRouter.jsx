import { Route, Routes } from "react-router-dom";
import { HashRouter } from "react-router-dom";
import MainPageLink from "./Route/MainPageLink";
import DomesticTourPageLink from './Route/DomesticTourPageLink'
import PopularDesPageLink from "./Route/PopularDesPageLink";


export default function MainRouter() {
    return (
        <>
            <HashRouter>
                <Routes>

                    <Route path="/" index element={<MainPageLink />} />
                    <Route path="/Home" element={<MainPageLink />} />
                    <Route path="/DomesticTourism" element={<DomesticTourPageLink />} />
                    <Route path="/Directions" element={<PopularDesPageLink />} />

                </Routes>
            </HashRouter>
        </>
    )
}