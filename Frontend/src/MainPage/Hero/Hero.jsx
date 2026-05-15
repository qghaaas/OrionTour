import '../../main.css'
import './Hero.css'
import './HeroCatalog.css'
import Header from '../Header/Header'
import Plane from './img/Plane.svg'
import Hotel from './img/Hotel.svg'
import GlobeMini from '../../Globe/GlobeMini'
import { useCallback, useEffect, useState } from 'react'

import { Link } from 'react-router-dom'

const API_URL = 'http://localhost:3010/api'
const CATALOG_PAGE_SIZE = 9

function getDirectionName(direction) {
    if (!direction) return ''

    return direction.name_ru || direction.name || direction.name_en || direction.country_slug || ''
}

function getTourLink(tourId) {
    return `#/tours/${tourId}`
}

function formatCount(count, type = 'tours') {
    const value = Number(count) || 0
    const lastDigit = value % 10
    const lastTwoDigits = value % 100

    const forms = type === 'hotels'
        ? ['отель', 'отеля', 'отелей']
        : ['тур', 'тура', 'туров']

    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return `${value} ${forms[2]}`
    if (lastDigit === 1) return `${value} ${forms[0]}`
    if (lastDigit >= 2 && lastDigit <= 4) return `${value} ${forms[1]}`

    return `${value} ${forms[2]}`
}

function buildCatalogParams({ tab, directionId, filter, page = 1, limit = CATALOG_PAGE_SIZE }) {
    const params = new URLSearchParams()

    params.set('type', tab === 'hotels' ? 'hotels' : 'tours')
    params.set('page', String(page))
    params.set('limit', String(limit))

    if (directionId) {
        params.set('direction_id', String(directionId))
    }

    if (filter.maxPrice.trim()) {
        params.set('max_price', filter.maxPrice.trim())
    }

    if (filter.from.trim()) {
        params.set('departure_from', filter.from.trim())
    }

    if (filter.date) {
        params.set('date', filter.date)
    }

    return params
}

function CatalogCard({ item }) {
    return (
        <Link
            className="hero-catalog-card"
            to={`/tour/${item.id}`}
        >
            <div className="hero-catalog-card__image-wrap">
                {item.image ? (
                    <img
                        className="hero-catalog-card__image"
                        src={item.image}
                        alt={item.title}
                    />
                ) : (
                    <div className="hero-catalog-card__image-placeholder">
                        ORION
                    </div>
                )}
            </div>

            <div className="hero-catalog-card__body">
                <div className="hero-catalog-card__topline">
                    <span>{item.location || item.direction_name}</span>
                    {item.hotel_rating ? <span>{Number(item.hotel_rating)} ★</span> : null}
                </div>

                <h3>{item.title}</h3>

                <div className="hero-catalog-card__footer">
                    <strong>от {Number(item.price).toLocaleString('ru-RU')} ₽</strong>
                    <span>{item.nights} ночей</span>
                </div>
            </div>
        </Link>
    )
}

function CatalogModal({
    open,
    activeTab,
    selectedDirection,
    loading,
    appending,
    error,
    items,
    total,
    hasMore,
    onClose,
    onLoadMore,
}) {
    if (!open) return null

    const selectedName = getDirectionName(selectedDirection)
    const totalLabel = formatCount(total || items.length, activeTab)
    const countLabel = total > items.length && items.length > 0
        ? `${items.length} из ${totalLabel}`
        : totalLabel

    return (
        <div className="hero-catalog-modal" role="dialog" aria-modal="true" aria-label="Каталог туров и отелей">
            <button
                type="button"
                className="hero-catalog-modal__backdrop"
                aria-label="Закрыть каталог"
                onClick={onClose}
            />

            <div className="hero-catalog-modal__content">
                <div className="hero-catalog-modal__head">
                    <div>
                        <span className="hero-catalog-panel__eyebrow">
                            {activeTab === 'hotels' ? 'Отели' : 'Туры'}
                        </span>
                        <h2>{selectedName || 'Результаты поиска'}</h2>
                    </div>

                    <div className="hero-catalog-modal__head-actions">
                        <span className="hero-catalog-panel__count">
                            {loading && items.length === 0 ? 'Загрузка...' : countLabel}
                        </span>

                        <button
                            type="button"
                            className="hero-catalog-modal__close"
                            aria-label="Закрыть каталог"
                            onClick={onClose}
                        >
                            ×
                        </button>
                    </div>
                </div>

                {error ? <div className="hero-catalog-message hero-catalog-message--error">{error}</div> : null}

                {!loading && !error && items.length === 0 ? (
                    <div className="hero-catalog-message">
                        Данные о турах пока не добавили
                    </div>
                ) : null}

                <div className="hero-catalog-list" aria-busy={loading || appending}>
                    {items.map((item) => <CatalogCard key={item.id} item={item} />)}
                </div>

                {hasMore ? (
                    <button
                        className="hero-catalog-more main-btn_site"
                        type="button"
                        onClick={onLoadMore}
                        disabled={loading || appending}
                    >
                        {appending ? 'Загрузка...' : 'Показать ещё'}
                    </button>
                ) : null}
            </div>
        </div>
    )
}

export default function Hero() {
    const [activeTab, setActiveTab] = useState('tours')
    const [directions, setDirections] = useState([])
    const [selectedDirection, setSelectedDirection] = useState(null)
    const [catalogItems, setCatalogItems] = useState([])
    const [isCatalogLoading, setIsCatalogLoading] = useState(false)
    const [isCatalogAppending, setIsCatalogAppending] = useState(false)
    const [catalogError, setCatalogError] = useState('')
    const [catalogPage, setCatalogPage] = useState(1)
    const [catalogTotal, setCatalogTotal] = useState(0)
    const [catalogHasMore, setCatalogHasMore] = useState(false)
    const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false)
    const [filter, setFilter] = useState({
        from: '',
        to: '',
        maxPrice: '',
        date: '',
    })

    useEffect(() => {
        let isMounted = true

        async function loadDirections() {
            try {
                const response = await fetch(`${API_URL}/directions`)

                if (!response.ok) {
                    throw new Error(`Ошибка загрузки направлений: ${response.status}`)
                }

                const data = await response.json()

                if (isMounted) {
                    setDirections(Array.isArray(data) ? data : [])
                }
            } catch (error) {
                console.error('Ошибка загрузки направлений для каталога:', error)
            }
        }

        loadDirections()

        return () => {
            isMounted = false
        }
    }, [])

    useEffect(() => {
        if (!isCatalogModalOpen) return undefined

        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setIsCatalogModalOpen(false)
            }
        }

        window.addEventListener('keydown', handleEscape)

        return () => {
            document.body.style.overflow = previousOverflow
            window.removeEventListener('keydown', handleEscape)
        }
    }, [isCatalogModalOpen])

    const findDirectionById = useCallback((directionId) => {
        if (!directionId) return null

        return directions.find((direction) => String(direction.id) === String(directionId)) || null
    }, [directions])

    const loadCatalog = useCallback(async ({
        tab = activeTab,
        direction = selectedDirection,
        nextFilter = filter,
        page = 1,
        append = false,
    } = {}) => {
        const currentDirection = direction || findDirectionById(nextFilter.to)
        const params = buildCatalogParams({
            tab,
            directionId: currentDirection?.id,
            filter: nextFilter,
            page,
        })

        if (append) {
            setIsCatalogAppending(true)
        } else {
            setIsCatalogLoading(true)
        }

        setCatalogError('')

        try {
            const response = await fetch(`${API_URL}/catalog?${params.toString()}`)

            if (!response.ok) {
                throw new Error(`Ошибка загрузки каталога: ${response.status}`)
            }

            const data = await response.json()
            const nextItems = Array.isArray(data.items) ? data.items : []

            setCatalogItems((currentItems) => (
                append ? [...currentItems, ...nextItems] : nextItems
            ))
            setCatalogPage(Number(data.page) || page)
            setCatalogTotal(Number(data.total) || nextItems.length)
            setCatalogHasMore(Boolean(data.has_more))
        } catch (error) {
            console.error('Ошибка загрузки каталога:', error)

            if (!append) {
                setCatalogItems([])
                setCatalogTotal(0)
                setCatalogHasMore(false)
            }

            setCatalogError('Не удалось загрузить каталог. Проверь сервер и базу данных.')
        } finally {
            setIsCatalogLoading(false)
            setIsCatalogAppending(false)
        }
    }, [activeTab, filter, selectedDirection, findDirectionById])

    const handleTabChange = (nextTab) => {
        setActiveTab(nextTab)

        if (isCatalogModalOpen) {
            const direction = selectedDirection || findDirectionById(filter.to)
            loadCatalog({ tab: nextTab, direction, nextFilter: filter, page: 1 })
        }
    }

    const handleInputChange = (field, value) => {
        setFilter((currentFilter) => ({
            ...currentFilter,
            [field]: value,
        }))

        if (field === 'to') {
            setSelectedDirection(findDirectionById(value))
        }
    }

    const handleSubmit = (event) => {
        event?.preventDefault()

        const direction = selectedDirection || findDirectionById(filter.to)

        setSelectedDirection(direction)
        setIsCatalogModalOpen(true)
        loadCatalog({ direction, nextFilter: filter, page: 1 })
    }

    const handleLoadMore = () => {
        const direction = selectedDirection || findDirectionById(filter.to)

        loadCatalog({
            direction,
            nextFilter: filter,
            page: catalogPage + 1,
            append: true,
        })
    }

    return (
        <section className="hero">
            <Header />
            <div className="container hero-container">
                <div className="hero-left">
                    <p className="hero-top-text">
                        Откройте мир вместе с нами<br />
                        Выберите направление на интерактивном глобусе и найдите тур за пару минут
                    </p>

                    <div className="hero-links">
                        <button
                            type="button"
                            className="hero-btn primary-btn"
                            onClick={() => handleSubmit()}
                        >
                            Подобрать тур
                        </button>
                        <button
                            type="button"
                            className="hero-btn secondary-btn"
                        >
                            Популярные направления
                        </button>
                    </div>

                    <div className="tour-filter">
                        <div className="tour-filter_select">
                            <button
                                type="button"
                                className={`tour-filter_tab ${activeTab === 'tours' ? 'active' : ''}`}
                                onClick={() => handleTabChange('tours')}
                            >
                                <img className="planesvg" src={Plane} alt="Туры" />
                                <span>Туры</span>
                            </button>

                            <button
                                type="button"
                                className={`tour-filter_tab ${activeTab === 'hotels' ? 'active' : ''}`}
                                onClick={() => handleTabChange('hotels')}
                            >
                                <img src={Hotel} alt="Отели" />
                                <span>Отели</span>
                            </button>
                        </div>

                        <form className="filter-item" onSubmit={handleSubmit}>
                            <input
                                type="text"
                                placeholder="Откуда"
                                value={filter.from}
                                onChange={(event) => handleInputChange('from', event.target.value)}
                            />
                            <select
                                className="hero-filter-select"
                                value={filter.to}
                                onChange={(event) => handleInputChange('to', event.target.value)}
                                aria-label="Куда"
                            >
                                <option value="">Куда</option>
                                {directions.map((direction) => (
                                    <option key={direction.id} value={direction.id}>
                                        {getDirectionName(direction)}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="number"
                                min="0"
                                placeholder="Стоимость"
                                value={filter.maxPrice}
                                onChange={(event) => handleInputChange('maxPrice', event.target.value)}
                            />
                            <input
                                type="date"
                                value={filter.date}
                                onChange={(event) => handleInputChange('date', event.target.value)}
                            />
                            <button className="main-btn_site" type="submit">Найти</button>
                        </form>
                    </div>
                </div>

                <div className="hero-right">
                    <GlobeMini />
                </div>
            </div>

            <CatalogModal
                open={isCatalogModalOpen}
                activeTab={activeTab}
                selectedDirection={selectedDirection}
                loading={isCatalogLoading}
                appending={isCatalogAppending}
                error={catalogError}
                items={catalogItems}
                total={catalogTotal}
                hasMore={catalogHasMore}
                onClose={() => setIsCatalogModalOpen(false)}
                onLoadMore={handleLoadMore}
            />
        </section>
    )
}
