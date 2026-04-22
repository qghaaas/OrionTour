SET search_path TO oriontour;

-- =========================
-- ОСНОВНЫЕ ТАБЛИЦЫ
-- =========================

-- Таблица направлений
CREATE TABLE directions (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    country_slug VARCHAR(100) UNIQUE NOT NULL,
    globe_lat NUMERIC(9,6),
    globe_lng NUMERIC(9,6),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_domestic BOOLEAN DEFAULT FALSE
);

-- Таблица категорий внутреннего туризма
CREATE TABLE domestic_categories (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    image_url TEXT,
    slug VARCHAR(255) UNIQUE NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица туров
CREATE TABLE tours (
    id BIGSERIAL PRIMARY KEY,
    direction_id BIGINT NOT NULL REFERENCES directions(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    short_description TEXT,
    full_description TEXT,
    price NUMERIC(12,2) NOT NULL,
    nights INTEGER NOT NULL CHECK (nights > 0),
    hotel_rating NUMERIC(2,1),
    is_hot BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_popular BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    domestic_category_id BIGINT REFERENCES domestic_categories(id),
    tour_type VARCHAR(100),
    location_name VARCHAR(255)
);

-- Таблица изображений тура
CREATE TABLE tour_images (
    id BIGSERIAL PRIMARY KEY,
    tour_id BIGINT NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_main BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица пользователей
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица отзывов
CREATE TABLE reviews (
    id BIGSERIAL PRIMARY KEY,
    author_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE
);

-- Таблица заявок с формы обратной связи
CREATE TABLE contact_requests (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(255),
    question TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица заявок из конструктора путешествий
CREATE TABLE travel_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    request_text TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица статей блога
CREATE TABLE blog_posts (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    short_description TEXT,
    content TEXT NOT NULL,
    views INTEGER DEFAULT 0,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица изображений статьи
CREATE TABLE blog_post_images (
    id BIGSERIAL PRIMARY KEY,
    blog_post_id BIGINT NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL
);

-- Таблица избранных туров пользователя
CREATE TABLE favorite_tours (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tour_id BIGINT NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, tour_id)
);

-- Таблица заказов пользователя
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tour_id BIGINT NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    people_count INTEGER NOT NULL,
    room_type VARCHAR(255),
    total_price NUMERIC(12,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица временных кодов регистрации
CREATE TABLE registration_codes (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    code_hash TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    resend_available_at TIMESTAMP NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE INDEX idx_registration_codes_email ON registration_codes(email);
CREATE INDEX idx_registration_codes_expires_at ON registration_codes(expires_at);

-- =========================
-- НАЧАЛЬНЫЕ ДАННЫЕ
-- =========================

-- Направления
INSERT INTO directions (name, country_slug, globe_lat, globe_lng, is_domestic)
VALUES
    ('Калининградская область', 'kaliningrad', 54.710426, 20.452214, TRUE),
    ('Египет', 'egypt', 26.820553, 30.802498, FALSE),
    ('Мальдивы', 'maldives', 3.202778, 73.220680, FALSE)
ON CONFLICT (country_slug) DO NOTHING;

-- Категории внутреннего туризма из DomTour.jsx
INSERT INTO domestic_categories (title, image_url, slug, sort_order, is_active)
VALUES
    ('Туры в Калининград', '/uploads/domtour/frontdom.png', 'kaliningrad-tours-1', 1, TRUE),
    ('Туры в Калининград', '/uploads/domtour/frontdom2.png', 'kaliningrad-tours-2', 2, TRUE),
    ('Экскурсии по Светлогорску, Зеленоградску, Пионерску', '/uploads/domtour/frontdom3.png', 'svetlogorsk-zelenogradsk-pionersk', 3, TRUE),
    ('Индивидуальные экскурсии', '/uploads/domtour/frontdom4.png', 'individual-excursions', 4, TRUE);

-- Популярные туры
INSERT INTO tours (
    direction_id,
    title,
    short_description,
    full_description,
    price,
    nights,
    hotel_rating,
    is_hot,
    is_active,
    is_popular,
    location_name,
    tour_type
)
VALUES
(
    (SELECT id FROM directions WHERE country_slug = 'egypt'),
    'Fort Arabesque The Villas',
    'Простая элегантность для тех, кто ищет эксклюзивный, роскошный отдых
Виллы с одной или двумя спальнями',
    'Простая элегантность для тех, кто ищет эксклюзивный, роскошный отдых
Виллы с одной или двумя спальнями',
    105900.00,
    9,
    5.0,
    FALSE,
    TRUE,
    TRUE,
    'Макади Бей, Хургада',
    'hotel'
),
(
    (SELECT id FROM directions WHERE country_slug = 'maldives'),
    'Hard Rock Hotel Maldives',
    'Виллы над водой и на пляже с частными бассейнами, рестораны с мировой кухней, уникальная музыкальная атмосфера Hard Rock',
    'Виллы над водой и на пляже с частными бассейнами, рестораны с мировой кухней, уникальная музыкальная атмосфера Hard Rock',
    477900.00,
    9,
    5.0,
    FALSE,
    TRUE,
    TRUE,
    'Мальдивы, Южный Мале Атолл',
    'hotel'
),
(
    (SELECT id FROM directions WHERE country_slug = 'egypt'),
    'Pickalbatros Luxury Suites',
    'Отель расположен среди красивых пейзажей, создавая место, полное природной красоты полуострова Южный Синай, окруженный потрясающими садами и полем для гольфа',
    'Отель расположен среди красивых пейзажей, создавая место, полное природной красоты полуострова Южный Синай, окруженный потрясающими садами и полем для гольфа',
    110200.00,
    14,
    5.0,
    FALSE,
    TRUE,
    TRUE,
    'Шаркс Бей',
    'hotel'
),
(
    (SELECT id FROM directions WHERE country_slug = 'egypt'),
    'Fort Arabesque Luxury Villas',
    'Простая элегантность для тех, кто ищет эксклюзивный, роскошный отдых
Виллы с одной или двумя спальнями',
    'Простая элегантность для тех, кто ищет эксклюзивный, роскошный отдых
Виллы с одной или двумя спальнями',
    105900.00,
    9,
    5.0,
    FALSE,
    TRUE,
    TRUE,
    'Макади Бей, Хургада',
    'hotel'
);

-- Изображения популярных туров: каждому туру своё изображение
INSERT INTO tour_images (tour_id, image_url, is_main)
VALUES
(
    (SELECT id FROM tours WHERE title = 'Fort Arabesque The Villas'),
    '/uploads/popular/fort-arabesque-the-villas.png',
    TRUE
),
(
    (SELECT id FROM tours WHERE title = 'Hard Rock Hotel Maldives'),
    '/uploads/popular/hard-rock-hotel-maldives.png',
    TRUE
),
(
    (SELECT id FROM tours WHERE title = 'Pickalbatros Luxury Suites'),
    '/uploads/popular/pickalbatros-luxury-suites.png',
    TRUE
),
(
    (SELECT id FROM tours WHERE title = 'Fort Arabesque Luxury Villas'),
    '/uploads/popular/fort-arabesque-the-villas.png',
    TRUE
);

-- Отзывы из Reviews.jsx
INSERT INTO reviews (author_name, rating, review_text, sort_order, is_active)
VALUES
(
    'Алина Михалкова',
    5,
    'Все было организовано на высшем уровне: от подбора тура до трансфера. Менеджеры были внимательны и отзывчивы, всегда готовы помочь с любыми вопросами. Особенно понравился индивидуальный подход и профессионализм команды. Рекомендую всем, кто ищет надежного туроператора!',
    1,
    TRUE
),
(
    'Ренат Ефимов',
    5,
    'Все было организовано на высшем уровне: от подбора тура до трансфера. Менеджеры были внимательны и отзывчивы, всегда готовы помочь с любыми вопросами. Особенно понравился индивидуальный подход и профессионализм команды. Рекомендую всем, кто ищет надежного туроператора!',
    2,
    TRUE
),
(
    'Анна Морозова',
    5,
    'Все было организовано на высшем уровне: от подбора тура до трансфера. Менеджеры были внимательны и отзывчивы, всегда готовы помочь с любыми вопросами. Особенно понравился индивидуальный подход и профессионализм команды. Рекомендую всем, кто ищет надежного туроператора!',
    3,
    TRUE
),
(
    'Игорь Павлов',
    5,
    'Все было организовано на высшем уровне: от подбора тура до трансфера. Менеджеры были внимательны и отзывчивы, всегда готовы помочь с любыми вопросами. Особенно понравился индивидуальный подход и профессионализм команды. Рекомендую всем, кто ищет надежного туроператора!',
    4,
    TRUE
);


INSERT INTO tours (
    direction_id,
    title,
    short_description,
    full_description,
    price,
    nights,
    hotel_rating,
    is_hot,
    is_active,
    is_popular,
    domestic_category_id,
    tour_type,
    location_name
)
VALUES
(
    (SELECT id FROM directions WHERE country_slug = 'kaliningrad'),
    'Комбинированный экскурсионный тур по историческим памятникам',
    'Экскурсионный тур по Кёнигсбергскому кафедральному собору, музеям и старинным крепостным стенам, вечерняя прогулка по набережной и дегустация местной кухни.',
    'Подробная программа включает посещение исторического центра Калининграда, обзорную экскурсию по главным достопримечательностям, прогулку по острову Канта и знакомство с культурным наследием региона.',
    999.00,
    2,
    4.0,
    FALSE,
    TRUE,
    TRUE,
    (SELECT id FROM domestic_categories WHERE slug = 'kaliningrad-tours'),
    'Экскурсионный',
    'Калининград'
),
(
    (SELECT id FROM directions WHERE country_slug = 'kaliningrad'),
    'Природно-познавательный выезд на Куршскую косу',
    'Прогулка по дюнам, визит в музей природы и наблюдение за птицами, отдых у моря и пляжные остановки.',
    'Маршрут сочетает природные ландшафты, экологические тропы и обзорные площадки Куршской косы. Подходит для семей, компаний друзей и туристов, любящих спокойный отдых.',
    1300.00,
    1,
    4.0,
    FALSE,
    TRUE,
    TRUE,
    (SELECT id FROM domestic_categories WHERE slug = 'kaliningrad-tours'),
    'Природный',
    'Куршская коса'
),
(
    (SELECT id FROM directions WHERE country_slug = 'kaliningrad'),
    'Семейный формат с программой для детей',
    'Интерактивный музей, поездка в янтарную мастерскую, прогулки по паркам и безопасные пляжные активности для младшего и подросткового возраста.',
    'Тур рассчитан на семьи с детьми: насыщенная, но комфортная программа, адаптированная под семейный ритм и интересы разных возрастов.',
    700.00,
    1,
    3.0,
    FALSE,
    TRUE,
    FALSE,
    (SELECT id FROM domestic_categories WHERE slug = 'kaliningrad-tours'),
    'Семейный',
    'Калининградская область'
),
(
    (SELECT id FROM directions WHERE country_slug = 'kaliningrad'),
    'Активный маршрут для любителей приключений',
    'Велопрогулки по окрестностям, каякинг у побережья, посещение фортификаций и вечерние посиделки у уютных кафе с местными деликатесами.',
    'Тур подойдет тем, кто любит насыщенные поездки, активный отдых и необычные впечатления. Возможны пешие маршруты и расширенные выездные экскурсии.',
    1000.00,
    2,
    4.0,
    TRUE,
    TRUE,
    TRUE,
    (SELECT id FROM domestic_categories WHERE slug = 'kaliningrad-tours'),
    'Активный',
    'Калининград и побережье'
);


INSERT INTO tour_images (tour_id, image_url, is_main)
VALUES
(
    (SELECT id FROM tours WHERE title = 'Комбинированный экскурсионный тур по историческим памятникам' LIMIT 1),
    '/uploads/kldtours/comb-tour.png',
    TRUE
),
(
    (SELECT id FROM tours WHERE title = 'Природно-познавательный выезд на Куршскую косу' LIMIT 1),
    '/uploads/kldtours/nature-tour.png',
    TRUE
),
(
    (SELECT id FROM tours WHERE title = 'Семейный формат с программой для детей' LIMIT 1),
    '/uploads/kldtours/family-tour.png',
    TRUE
),
(
    (SELECT id FROM tours WHERE title = 'Активный маршрут для любителей приключений' LIMIT 1),
    '/uploads/kldtours/active-tour.png',
    TRUE
);