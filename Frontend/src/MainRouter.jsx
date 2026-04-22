import { Route, Routes } from "react-router-dom";
import { HashRouter } from "react-router-dom";
import MainPageLink from "./Route/MainPageLink";
import DomesticTourPageLink from './Route/DomesticTourPageLink'



export default function MainRouter() {
    return (
        <>
            <HashRouter>
                <Routes>

                    <Route path="/" index element={<MainPageLink />} />
                    <Route path="/Home" element={<MainPageLink />} />
                    <Route path="/DomesticTourism" element={<DomesticTourPageLink />} />

                </Routes>
            </HashRouter>
        </>
    )
}