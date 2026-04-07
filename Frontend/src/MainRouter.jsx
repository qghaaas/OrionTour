import { HashRouter, Routes, Route } from "react-router-dom";
import Mainlink from "./Routes/MainLink";
import Directionslink from "./Routes/Directionslink";
import Searchfortourslink from "./Routes/SearchforToursLink";
import Domestictourismlink from "./Routes/DomesticTourismLink";



export default function MainRouter(){
    return(
        <>
        <HashRouter>
            <Routes>
                <Route path="/" index element={<Mainlink/>}/>
                <Route path="/Направления" index element={<Directionslink/>}/>
                <Route path="/Поиск тура" index element={<Searchfortourslink/>}/>
                <Route path="/Внутренний туризм" index element={<Domestictourismlink/>}/>
            </Routes>
        </HashRouter>
        </>
    )
}