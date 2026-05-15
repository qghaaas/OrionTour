import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls, Stars, useTexture } from '@react-three/drei';
import * as THREE from 'three';

import { latLngToCartesian } from './spherical';

import earthDay from './img/earthDay.jpg';
import earthNight from './img/earthNight.jpg';
import earthBump from './img/earthBump.jpg';

import searchIcon from './img/search.svg';
import closeIcon from './img/close.svg';
import SunIcon from './img/SunIcon.svg';
import MoonIcon from './img/MoonIcon.svg';

import './Globe.css';
import './GlobeCatalog.css';

const API_URL = 'http://localhost:3010/api';

const GLOBE_RADIUS = 4;
const CAMERA_START_Z = 12;
const CAMERA_END_Z = 8;
const GLOBE_CATALOG_PAGE_SIZE = 5;

const LIGHTS = {
  light: {
    ambient: { intensity: 0.55, color: '#ffffff' },
    directional: { intensity: 1.15, color: '#ffffff' },
  },
  dark: {
    ambient: { intensity: 1.1, color: '#777777' },
    directional: { intensity: 1.25, color: '#aaaaaa' },
  },
};

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function normalizeDirection(row) {
  const lat = toNumber(row.globe_lat ?? row.lat);
  const lng = toNumber(row.globe_lng ?? row.lng);

  if (lat === null || lng === null) return null;

  return {
    id: row.id,
    lat,
    lng,
    nameRu: row.name_ru || row.name || '',
    nameEn: row.name_en || row.name || row.country_slug || '',
    name: row.name || row.name_ru || row.name_en || row.country_slug || '',
    slug: row.country_slug,
    flagUrl: row.flag_url,
    popularityScore: Number(row.popularity_score) || 0,
    popularityLevel: row.popularity_level || null,
    popularityColor: row.popularity_color || null,
    toursCount: Number(row.tours_count ?? 0),
    hotelsCount: Number(row.hotels_count ?? 0),
    priceFrom: Number(row.price_from ?? 0),
    isDomestic: Boolean(row.is_domestic),
  };
}

function getMarkerName(marker, language) {
  return language === 'en'
    ? marker.nameEn || marker.nameRu || marker.name || marker.slug
    : marker.nameRu || marker.name || marker.nameEn || marker.slug;
}

function getPopularityLevel(marker) {
  if (marker.popularityLevel) return marker.popularityLevel;

  if (marker.popularityScore < 60) return 'low';
  if (marker.popularityScore < 80) return 'medium';
  return 'high';
}

function getPopularityColor(level) {
  if (level === 'low') return '#27ae60';
  if (level === 'medium') return '#f1c40f';
  if (level === 'high') return '#e74c3c';

  return 'rgba(255, 255, 255, 0.6)';
}

const FLAG_CODE_BY_SLUG = {
  ru: 'ru',
  russia: 'ru',
  kaliningrad: 'ru',

  fr: 'fr',
  france: 'fr',

  de: 'de',
  germany: 'de',

  egypt: 'eg',
  maldives: 'mv',
};

function getFlagCode(marker) {
  const slug = marker.slug?.toLowerCase();

  if (!slug) return '';

  if (/^[a-z]{2}$/.test(slug)) {
    return slug;
  }

  return FLAG_CODE_BY_SLUG[slug] || '';
}

function getFlagSrc(marker) {
  const code = getFlagCode(marker);

  if (!code) return '';

  return `https://flagcdn.com/w40/${code}.png`;
}

function markerMatchesSearch(marker, query) {
  const searchableText = [
    marker.nameRu,
    marker.nameEn,
    marker.name,
    marker.slug,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return searchableText.includes(query);
}

function getTourLink(tourId) {
  return `#/tours/${tourId}`;
}

function formatCount(count, type = 'tours') {
  const value = Number(count) || 0;
  const lastDigit = value % 10;
  const lastTwoDigits = value % 100;
  const forms = type === 'hotels'
    ? ['отель', 'отеля', 'отелей']
    : ['тур', 'тура', 'туров'];

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return `${value} ${forms[2]}`;
  if (lastDigit === 1) return `${value} ${forms[0]}`;
  if (lastDigit >= 2 && lastDigit <= 4) return `${value} ${forms[1]}`;

  return `${value} ${forms[2]}`;
}

function Earth({ radius, theme }) {
  const textures = useTexture(
    theme === 'light'
      ? { map: earthDay, bumpMap: earthBump }
      : { map: earthNight }
  );

  return (
    <mesh>
      <sphereGeometry args={[radius, 64, 64]} />
      <meshStandardMaterial
        map={textures.map}
        bumpMap={theme === 'light' ? textures.bumpMap : null}
        bumpScale={theme === 'light' ? 0.25 : 0}
        roughness={0.9}
        metalness={0}
      />
    </mesh>
  );
}

const CountryMarker = memo(function CountryMarker({
  marker,
  radius,
  language,
  isActive,
  onClick,
  onHover,
  onHoverEnd,
}) {
  const { camera } = useThree();
  const [visible, setVisible] = useState(true);
  const visibleRef = useRef(true);

  const position = useMemo(() => {
    return latLngToCartesian(marker.lat, marker.lng, radius + 0.08);
  }, [marker.lat, marker.lng, radius]);

  useFrame(() => {
    const markerDirection = new THREE.Vector3(...position).normalize();
    const cameraDirection = camera.position.clone().normalize();

    const nextVisible = markerDirection.dot(cameraDirection) > 0.05;

    if (nextVisible !== visibleRef.current) {
      visibleRef.current = nextVisible;
      setVisible(nextVisible);
    }
  });

  if (!visible) return null;

  const markerName = getMarkerName(marker, language);
  const popularityLevel = getPopularityLevel(marker);
  const borderColor = marker.popularityColor || getPopularityColor(popularityLevel);
  const flagSrc = getFlagSrc(marker);

  return (
    <group position={position}>
      <Html center zIndexRange={[20, 0]}>
        <div
          className={`marker-pill ${isActive ? 'marker-pill--active' : ''}`}
          style={{ borderColor }}
          onMouseEnter={(event) => {
            event.stopPropagation();
            onHover(marker);
          }}
          onMouseLeave={(event) => {
            event.stopPropagation();
            onHoverEnd(marker);
          }}
          onClick={(event) => {
            event.stopPropagation();
            onClick?.(marker);
          }}
        >
          <div className="marker-flag-wrapper">
            {flagSrc ? (
              <img
                src={flagSrc}
                alt={markerName}
                className="marker-flag"
              />
            ) : (
              <span
                style={{
                  width: 10,
                  height: 10,
                  display: 'block',
                  borderRadius: '50%',
                  background: borderColor,
                }}
              />
            )}
          </div>

          <div className="marker-info">
            <span className="marker-country">{markerName}</span>
            <span className="marker-tours">
              {marker.toursCount} {language === 'en' ? 'tours' : 'туров'}
            </span>
          </div>
        </div>
      </Html>
    </group>
  );
});

function GlobeScene({
  markers,
  selectedMarkerId,
  hoveredMarkerId,
  theme,
  language,
  onMarkerSelect,
  onMarkerHover,
  onMarkerHoverEnd,
  onSearchInterrupt,
}) {
  const controlsRef = useRef(null);
  const flyRef = useRef(null);
  const introProgressRef = useRef(0);
  const introDoneRef = useRef(false);

  const { camera } = useThree();
  const light = LIGHTS[theme];

  useEffect(() => {
    controlsRef.current?.target.set(0, 0, 0);
    controlsRef.current?.update();
  }, []);

  useEffect(() => {
    if (!selectedMarkerId) return;

    const marker = markers.find((item) => item.id === selectedMarkerId);
    if (!marker) return;

    const position = latLngToCartesian(marker.lat, marker.lng, GLOBE_RADIUS);
    const direction = new THREE.Vector3(...position).normalize();

    flyRef.current = {
      progress: 0,
      start: camera.position.clone(),
      end: direction.multiplyScalar(GLOBE_RADIUS + 3.2),
    };

    introDoneRef.current = true;
  }, [selectedMarkerId, markers, camera]);

  useFrame((_, delta) => {
    if (!introDoneRef.current && !flyRef.current) {
      introProgressRef.current = Math.min(introProgressRef.current + delta * 0.6, 1);

      const t = introProgressRef.current;
      camera.position.set(0, 0, CAMERA_START_Z + (CAMERA_END_Z - CAMERA_START_Z) * t);

      controlsRef.current?.update();

      if (t >= 1) {
        introDoneRef.current = true;
      }

      return;
    }

    if (!flyRef.current) return;

    flyRef.current.progress = Math.min(flyRef.current.progress + delta * 0.85, 1);

    const t = flyRef.current.progress;
    const smoothT = t * t * (3 - 2 * t);

    camera.position.copy(flyRef.current.start.clone().lerp(flyRef.current.end, smoothT));

    controlsRef.current?.target.set(0, 0, 0);
    controlsRef.current?.update();

    if (t >= 1) {
      flyRef.current = null;
    }
  });

  return (
    <>
      <ambientLight
        intensity={light.ambient.intensity}
        color={light.ambient.color}
      />

      <directionalLight
        position={[5, 5, 5]}
        intensity={light.directional.intensity}
        color={light.directional.color}
      />

      <Stars
        radius={100}
        depth={50}
        count={5000}
        factor={3}
        saturation={0}
        fade
      />

      <Earth radius={GLOBE_RADIUS} theme={theme} />

      {markers.map((marker) => (
        <CountryMarker
          key={marker.id}
          marker={marker}
          radius={GLOBE_RADIUS}
          language={language}
          isActive={hoveredMarkerId === marker.id}
          onClick={onMarkerSelect}
          onHover={onMarkerHover}
          onHoverEnd={onMarkerHoverEnd}
        />
      ))}

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableZoom
        enableRotate
        minDistance={7}
        maxDistance={15}
        rotateSpeed={0.6}
        zoomSpeed={0.7}
        onStart={() => {
          flyRef.current = null;
          introDoneRef.current = true;

          controlsRef.current?.target.set(0, 0, 0);
          controlsRef.current?.update();

          onSearchInterrupt();
        }}
      />
    </>
  );
}

function ThemeToggle({ theme, onToggle }) {
  return (
    <div className="globe-theme-toggle">
      <img
        src={theme === 'dark' ? SunIcon : MoonIcon}
        alt="theme toggle"
        onClick={onToggle}
        className="theme-toggle-icon"
      />
    </div>
  );
}

function SearchPanel({
  value,
  language,
  suggestions,
  onChange,
  onClear,
  onSearch,
  onSuggestionClick,
}) {
  return (
    <div className="globe-search">
      <div className="globe-search-input-wrapper">
        <input
          className="globe-search-input"
          type="text"
          placeholder={language === 'en' ? 'Search country...' : 'Поиск страны...'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') onSearch();
          }}
        />

        {value ? (
          <img
            src={closeIcon}
            alt="clear"
            className="globe-search-icon globe-search-icon--clear"
            onClick={onClear}
          />
        ) : (
          <img
            src={searchIcon}
            alt="search"
            className="globe-search-icon"
          />
        )}

        {suggestions.length > 0 && (
          <ul className="globe-search-suggestions">
            {suggestions.map((marker) => {
              const markerName = getMarkerName(marker, language);
              const flagSrc = getFlagSrc(marker);

              return (
                <li
                  key={marker.id}
                  className="globe-search-suggestion"
                  onMouseDown={() => onSuggestionClick(marker)}
                >
                  {flagSrc && (
                    <img
                      src={flagSrc}
                      alt={markerName}
                      className="globe-search-suggestion-flag"
                    />
                  )}

                  <span className="globe-search-suggestion-name">
                    {markerName}

                    {language !== 'en' &&
                      marker.nameEn &&
                      marker.nameRu &&
                      marker.nameEn !== marker.nameRu && (
                        <span className="globe-search-suggestion-name-en">
                          {' '}
                          ({marker.nameEn})
                        </span>
                      )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <button
        className="globe-search-btn"
        type="button"
        onClick={onSearch}
      >
        {language === 'en' ? 'Search' : 'Найти'}
      </button>
    </div>
  );
}

function PopularityLegend({ language }) {
  const labels = {
    ru: {
      low: 'Низкая популярность',
      medium: 'Средняя популярность',
      high: 'Высокая популярность',
    },
    en: {
      low: 'Low popularity',
      medium: 'Medium popularity',
      high: 'High popularity',
    },
  };

  const text = language === 'en' ? labels.en : labels.ru;

  return (
    <div className="globe-legend">
      <div className="globe-legend-item">
        <span className="globe-legend-dot globe-legend-dot--low" />
        <span>{text.low}</span>
      </div>

      <div className="globe-legend-item">
        <span className="globe-legend-dot globe-legend-dot--medium" />
        <span>{text.medium}</span>
      </div>

      <div className="globe-legend-item">
        <span className="globe-legend-dot globe-legend-dot--high" />
        <span>{text.high}</span>
      </div>
    </div>
  );
}

function GlobeTourCard({ item }) {
  return (
    <a className="globe-catalog-card" href={getTourLink(item.id)}>
      <div className="globe-catalog-card__image-wrap">
        {item.image ? (
          <img src={item.image} alt={item.title} className="globe-catalog-card__image" />
        ) : (
          <div className="globe-catalog-card__image-placeholder">ORION</div>
        )}
      </div>

      <div className="globe-catalog-card__content">
        <div className="globe-catalog-card__meta">
          <span>{item.location_name || item.direction_name || 'Направление'}</span>
          {item.hotel_rating ? <span>{Number(item.hotel_rating).toFixed(1)} ★</span> : null}
        </div>
        <h3>{item.title}</h3>
        <p>{item.description || 'Описание тура пока не добавлено'}</p>
        <div className="globe-catalog-card__footer">
          <strong>{item.price_formatted}</strong>
          <span>{item.nights_label}</span>
        </div>
      </div>
    </a>
  );
}

function GlobeCatalogPanel({
  selectedDirection,
  language,
  type,
  onTypeChange,
  items,
  total,
  hasMore,
  loading,
  appending,
  error,
  onLoadMore,
}) {
  const title = selectedDirection
    ? getMarkerName(selectedDirection, language)
    : (language === 'en' ? 'Catalog' : 'Каталог');
  const totalLabel = formatCount(total || items.length, type);
  const counterLabel = total > items.length && items.length > 0
    ? `${items.length} из ${totalLabel}`
    : totalLabel;

  return (
    <aside className="globe-catalog-panel">
      <div className="globe-catalog-panel__head">
        <div>
          <span className="globe-catalog-panel__eyebrow">
            {language === 'en' ? 'Tours and hotels' : 'Туры и отели'}
          </span>
          <h2>{title}</h2>
        </div>

        <span className="globe-catalog-panel__counter">
          {loading && items.length === 0 ? '...' : counterLabel}
        </span>
      </div>

      <div className="globe-catalog-tabs">
        <button
          type="button"
          className={type === 'tours' ? 'active' : ''}
          onClick={() => onTypeChange('tours')}
        >
          {language === 'en' ? 'Tours' : 'Туры'}
        </button>
        <button
          type="button"
          className={type === 'hotels' ? 'active' : ''}
          onClick={() => onTypeChange('hotels')}
        >
          {language === 'en' ? 'Hotels' : 'Отели'}
        </button>
      </div>

      {!selectedDirection ? (
        <div className="globe-catalog-message">
          {language === 'en'
            ? 'Select a country marker on the globe.'
            : 'Выберите страну на глобусе, чтобы увидеть каталог.'}
        </div>
      ) : null}

      {error ? <div className="globe-catalog-message globe-catalog-message--error">{error}</div> : null}

      {selectedDirection && !loading && !error && items.length === 0 ? (
        <div className="globe-catalog-message">
          {language === 'en'
            ? 'Tour data has not been added yet.'
            : 'Данные о турах пока не добавили'}
        </div>
      ) : null}

      <div className="globe-catalog-list" aria-busy={loading || appending}>
        {items.map((item) => <GlobeTourCard key={item.id} item={item} />)}
      </div>

      {hasMore ? (
        <button
          type="button"
          className="globe-catalog-more"
          onClick={onLoadMore}
          disabled={loading || appending}
        >
          {appending
            ? (language === 'en' ? 'Loading...' : 'Загрузка...')
            : (language === 'en' ? 'Show more' : 'Показать ещё')}
        </button>
      ) : null}
    </aside>
  );
}

function Globe({ onCountrySelect, language = 'ru' }) {
  const [markers, setMarkers] = useState([]);
  const [theme, setTheme] = useState('dark');
  const [searchValue, setSearchValue] = useState('');
  const [selectedMarkerId, setSelectedMarkerId] = useState(null);
  const [hoveredMarkerId, setHoveredMarkerId] = useState(null);
  const [selectedDirection, setSelectedDirection] = useState(null);
  const [catalogType, setCatalogType] = useState('tours');
  const [catalogItems, setCatalogItems] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogAppending, setCatalogAppending] = useState(false);
  const [catalogError, setCatalogError] = useState('');
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogTotal, setCatalogTotal] = useState(0);
  const [catalogHasMore, setCatalogHasMore] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadMarkers() {
      try {
        const response = await fetch(`${API_URL}/directions`);

        if (!response.ok) {
          throw new Error(`Directions API error: ${response.status}`);
        }

        const data = await response.json();
        const normalizedMarkers = data
          .map(normalizeDirection)
          .filter(Boolean);

        if (isMounted) {
          setMarkers(normalizedMarkers);
        }
      } catch (error) {
        console.error('Ошибка при загрузке маркеров глобуса:', error);
      }
    }

    loadMarkers();

    return () => {
      isMounted = false;
    };
  }, []);

  const loadCatalogForMarker = useCallback(async (
    marker,
    type = catalogType,
    page = 1,
    append = false,
  ) => {
    if (!marker?.id) return;

    const params = new URLSearchParams({
      type,
      direction_id: String(marker.id),
      page: String(page),
      limit: String(GLOBE_CATALOG_PAGE_SIZE),
    });

    if (append) {
      setCatalogAppending(true);
    } else {
      setCatalogLoading(true);
    }

    setCatalogError('');

    try {
      const response = await fetch(`${API_URL}/catalog?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Catalog API error: ${response.status}`);
      }

      const data = await response.json();
      const nextItems = Array.isArray(data.items) ? data.items : [];

      setCatalogItems((currentItems) => (
        append ? [...currentItems, ...nextItems] : nextItems
      ));
      setCatalogPage(Number(data.page) || page);
      setCatalogTotal(Number(data.total) || nextItems.length);
      setCatalogHasMore(Boolean(data.has_more));
    } catch (error) {
      console.error('Ошибка при загрузке каталога направления:', error);

      if (!append) {
        setCatalogItems([]);
        setCatalogTotal(0);
        setCatalogHasMore(false);
      }

      setCatalogError(language === 'en'
        ? 'Could not load catalog.'
        : 'Не удалось загрузить каталог.');
    } finally {
      setCatalogLoading(false);
      setCatalogAppending(false);
    }
  }, [catalogType, language]);

  const selectMarker = useCallback((marker) => {
    setSelectedMarkerId(marker.id);
    setHoveredMarkerId(null);
    setSelectedDirection(marker);
    loadCatalogForMarker(marker, catalogType, 1, false);
    onCountrySelect?.(marker);
  }, [catalogType, loadCatalogForMarker, onCountrySelect]);

  const suggestions = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    if (!query) return [];

    return markers
      .filter((marker) => markerMatchesSearch(marker, query))
      .slice(0, 7);
  }, [markers, searchValue]);

  const handleSearch = useCallback(() => {
    const query = searchValue.trim().toLowerCase();

    if (!query) return;

    const foundMarker =
      suggestions[0] ||
      markers.find((marker) => markerMatchesSearch(marker, query));

    if (!foundMarker) return;

    selectMarker(foundMarker);
  }, [markers, searchValue, selectMarker, suggestions]);

  const handleClearSearch = useCallback(() => {
    setSearchValue('');
    setSelectedMarkerId(null);
    setHoveredMarkerId(null);
    setSelectedDirection(null);
    setCatalogItems([]);
    setCatalogError('');
    setCatalogPage(1);
    setCatalogTotal(0);
    setCatalogHasMore(false);
  }, []);

  const handleSuggestionClick = useCallback((marker) => {
    setSearchValue(getMarkerName(marker, language));
    selectMarker(marker);
  }, [language, selectMarker]);

  const handleMarkerSelect = useCallback((marker) => {
    selectMarker(marker);
  }, [selectMarker]);

  const handleMarkerHover = useCallback((marker) => {
    setHoveredMarkerId(marker.id);
  }, []);

  const handleMarkerHoverEnd = useCallback((marker) => {
    setHoveredMarkerId((currentId) => (
      currentId === marker.id ? null : currentId
    ));
  }, []);

  const handleCatalogTypeChange = useCallback((nextType) => {
    setCatalogType(nextType);

    if (selectedDirection) {
      loadCatalogForMarker(selectedDirection, nextType, 1, false);
    }
  }, [loadCatalogForMarker, selectedDirection]);

  const handleCatalogLoadMore = useCallback(() => {
    if (!selectedDirection) return;

    loadCatalogForMarker(
      selectedDirection,
      catalogType,
      catalogPage + 1,
      true,
    );
  }, [catalogPage, catalogType, loadCatalogForMarker, selectedDirection]);

  return (
    <div className={`globe-wrapper ${theme}`}>
      <ThemeToggle
        theme={theme}
        onToggle={() => {
          setTheme((currentTheme) => (
            currentTheme === 'dark' ? 'light' : 'dark'
          ));
        }}
      />

      <SearchPanel
        value={searchValue}
        language={language}
        suggestions={suggestions}
        onChange={setSearchValue}
        onClear={handleClearSearch}
        onSearch={handleSearch}
        onSuggestionClick={handleSuggestionClick}
      />

      <GlobeCatalogPanel
        selectedDirection={selectedDirection}
        language={language}
        type={catalogType}
        onTypeChange={handleCatalogTypeChange}
        items={catalogItems}
        total={catalogTotal}
        hasMore={catalogHasMore}
        loading={catalogLoading}
        appending={catalogAppending}
        error={catalogError}
        onLoadMore={handleCatalogLoadMore}
      />

      <PopularityLegend language={language} />

      <Canvas
        camera={{ position: [0, 0, CAMERA_START_Z], fov: 45 }}
        className="globe-canvas"
      >
        <GlobeScene
          markers={markers}
          selectedMarkerId={selectedMarkerId}
          hoveredMarkerId={hoveredMarkerId}
          theme={theme}
          language={language}
          onMarkerSelect={handleMarkerSelect}
          onMarkerHover={handleMarkerHover}
          onMarkerHoverEnd={handleMarkerHoverEnd}
          onSearchInterrupt={() => setSelectedMarkerId(null)}
        />
      </Canvas>
    </div>
  );
}

export default Globe;
