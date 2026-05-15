import { Route, Routes, HashRouter } from 'react-router-dom'
import { lazy, Suspense } from 'react'
const MainPageLink = lazy(() => import('./Route/MainPageLink'))
const DomesticTourPageLink = lazy(() => import('./Route/DomesticTourPageLink'))
const PopularDesPageLink = lazy(() => import('./Route/PopularDesPageLink'))
const AccountLink = lazy(() => import('./Route/AccountLink'))
const ContactInfoLink = lazy(() => import('./Route/ContactInfoLink'))
const AboutUsLink = lazy(() => import('./Route/AboutUsLink'))
const BlogLink = lazy(() => import('./Route/BlogLink'))
const BlogPageLink = lazy(() => import('./Route/BlogPageLink'))
const Globe = lazy(() => import('./Globe/Globe'))
const AdminPanelLink = lazy(() => import('./Route/AdminPanelLink'))
const AdminAuthLink = lazy(() => import('./Route/AdminAuthLink'))
import './main.css'



function PageLoader() {
    return (
        <div className="page-loader">
            <span>Загрузка страницы</span>
            <span className="page-loader-dots">
                <span></span>
                <span></span>
                <span></span>
            </span>
        </div>
    )
}

export default function MainRouter() {
    return (
        <HashRouter>
            <Suspense fallback={<PageLoader />}>
                <Routes>
                    <Route path="/" element={<MainPageLink />} />
                    <Route path="/Home" element={<MainPageLink />} />
                    <Route path="/DomesticTourism" element={<DomesticTourPageLink />} />
                    <Route path="/Directions" element={<PopularDesPageLink defaultTourId={1} />} />
                    <Route path="/tour/:id" element={<PopularDesPageLink />} />
                    <Route path="/account" element={<AccountLink />} />
                    <Route path="/ContactInfo" element={<ContactInfoLink />} />
                    <Route path="/AboutUs" element={<AboutUsLink />} />
                    <Route path="/Blog" element={<BlogLink />} />
                    <Route path="/blogPage/:id" element={<BlogPageLink />} />
                    <Route path="/interactive-globe" element={<Globe />} />
                    <Route path="/admin/login" element={<AdminAuthLink />} />
                    <Route path="/admin" element={<AdminPanelLink />} />
                </Routes>
            </Suspense>
        </HashRouter>
    )
}