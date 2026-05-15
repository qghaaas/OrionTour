SET search_path TO oriontour;

-- Таблица направлений
CREATE TABLE directions (
    id BIGSERIAL PRIMARY KEY,
    name_ru TEXT,
    name_en TEXT,
    name TEXT,
    country_slug VARCHAR(100) UNIQUE NOT NULL,
    globe_lat NUMERIC(9,6),  
    globe_lng NUMERIC(9,6),
    flag_url TEXT,
    is_popular BOOLEAN DEFAULT FALSE,
    popularity_score INTEGER DEFAULT 0,
    is_domestic BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    location_name VARCHAR(255),
    hotel_lat NUMERIC(9,6),
    hotel_lng NUMERIC(9,6)
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
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    main_image_url TEXT,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE blog_post_sections (
    id BIGSERIAL PRIMARY KEY,
    blog_post_id BIGINT NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    subtext TEXT,
    sort_order INTEGER DEFAULT 0
);

-- Таблица изображений статьи
CREATE TABLE blog_post_images (
    id BIGSERIAL PRIMARY KEY,
    sort_order INTEGER DEFAULT 0,
    blog_post_id BIGINT NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    section_id BIGINT REFERENCES blog_post_sections(id) ON DELETE CASCADE
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

--БД globus
INSERT INTO directions (name_ru, name_en, country_slug, globe_lat, globe_lng, flag_url, is_popular, popularity_score)
VALUES
    ('Россия', 'Russia', 'ru', 61.52401, 105.318756, 'flags/ru.png', TRUE, 100),
    ('Франция', 'France', 'fr', 46.227638, 2.213749, 'flags/fr.png', TRUE, 90),
    ('Германия', 'Germany', 'de', 51.165691, 10.451526, 'flags/de.png', FALSE, 70)
ON CONFLICT (country_slug) DO UPDATE
SET
    name_ru = EXCLUDED.name_ru,
    name_en = EXCLUDED.name_en,
    globe_lat = EXCLUDED.globe_lat,
    globe_lng = EXCLUDED.globe_lng,
    flag_url = EXCLUDED.flag_url,
    is_popular = EXCLUDED.is_popular,
    popularity_score = EXCLUDED.popularity_score;

-- Категории внутреннего туризма
INSERT INTO domestic_categories (title, image_url, slug, sort_order, is_active)
VALUES
    ('Туры в Калининград', '/uploads/domtour/frontdom.png', 'kaliningrad-tours-1', 1, TRUE),
    ('Туры в Калининград', '/uploads/domtour/frontdom2.png', 'kaliningrad-tours-2', 2, TRUE),
    ('Экскурсии по Светлогорску, Зеленоградску, Пионерску', '/uploads/domtour/frontdom3.png', 'svetlogorsk-zelenogradsk-pionersk', 3, TRUE),
    ('Индивидуальные экскурсии', '/uploads/domtour/frontdom4.png', 'individual-excursions', 4, TRUE);

-- =========================
-- ПОПУЛЯРНЫЕ ТУРЫ ДЛЯ ГЛАВНОГО СВАЙПЕРА
-- Только эти 3 тура имеют is_popular = TRUE
-- =========================

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
    tour_type,
    hotel_lat,
    hotel_lng
)
VALUES
(
    (SELECT id FROM directions WHERE country_slug = 'egypt' LIMIT 1),
    'Fort Arabesque The Villas',
    'Виллы у бассейна в Макади Бей: приватная терраса, спокойная территория и формат отдыха для тех, кто хочет больше тишины, сервиса и личного пространства.',
    'Fort Arabesque The Villas — камерная вилловая зона курорта Fort Arabesque в Макади Бей, созданная для спокойного пляжного отдыха с повышенным уровнем приватности.

Гостей ждут виллы с одной или двумя спальнями, просторная гостиная зона, современная ванная комната, частная терраса и прямой доступ к бассейну. Формат подходит для пар, семей и гостей, которые хотят отдыхать не в стандартном гостиничном корпусе, а в более уединённой атмосфере.

Курорт расположен у Красного моря, рядом с пляжем Макади Бей. В концепции отеля сочетаются пляжный отдых, зелёная территория, бассейны, рестораны, спокойный ритм и удобный доступ к инфраструктуре Хургады.',
    105900.00,
    9,
    4.0,
    FALSE,
    TRUE,
    TRUE,
    'Макади Бей, Хургада',
    'hotel',
    26.991200,
    33.899800
),
(
    (SELECT id FROM directions WHERE country_slug = 'maldives' LIMIT 1),
    'Hard Rock Hotel Maldives',
    'Пляжные и водные виллы на Мальдивах, яркая музыкальная атмосфера Hard Rock, рестораны, бассейны и отдых на острове в Южном Мале Атолле.',
    'Hard Rock Hotel Maldives — современный пятизвёздочный курорт в Южном Мале Атолле с фирменной атмосферой бренда Hard Rock.

Отель подойдёт тем, кто хочет совместить классический мальдивский отдых с более живым и современным форматом: виллы у пляжа и над водой, бассейны, рестораны, бары, музыкальная концепция, spa-зоны и доступ к инфраструктуре CROSSROADS Maldives.

Это вариант для романтической поездки, семейного отдыха, медового месяца или премиального тура на Мальдивы без ощущения полной изоляции.',
    477900.00,
    9,
    5.0,
    FALSE,
    TRUE,
    TRUE,
    'Мальдивы, Южный Мале Атолл',
    'hotel',
    4.123751,
    73.472686
),
(
    (SELECT id FROM directions WHERE country_slug = 'egypt' LIMIT 1),
    'Pickalbatros Luxury Suites',
    'Пятизвёздочный курорт в Шарм-эль-Шейхе с просторной территорией, бассейнами, ресторанами, зонами отдыха и атмосферой премиального пляжного отпуска.',
    'Pickalbatros Luxury Suites — пятизвёздочный курорт в Шарм-эль-Шейхе для комфортного отдыха у Красного моря.

Отель сочетает просторную территорию, бассейны, рестораны, бары, зоны отдыха и сервис, ориентированный на гостей, которые хотят более спокойный и премиальный формат отдыха в Египте.

Курорт подойдёт для семейного отпуска, романтической поездки и продолжительного отдыха. Локация удобна для тех, кто хочет совместить пляжный отдых, инфраструктуру отеля и доступ к популярным зонам Шарм-эль-Шейха.',
    110200.00,
    14,
    5.0,
    FALSE,
    TRUE,
    TRUE,
    'Шарм-эль-Шейх',
    'hotel',
    27.942643,
    34.361339
);

-- =========================
-- ИЗОБРАЖЕНИЯ ПОПУЛЯРНЫХ ОТЕЛЕЙ
-- =========================

INSERT INTO tour_images (tour_id, image_url, is_main)
VALUES
(
    (SELECT id FROM tours WHERE title = 'Fort Arabesque The Villas' AND tour_type = 'hotel' LIMIT 1),
    '/uploads/hotels/fort-arabesque-the-villas/main.png',
    TRUE
),
(
    (SELECT id FROM tours WHERE title = 'Fort Arabesque The Villas' AND tour_type = 'hotel' LIMIT 1),
    '/uploads/hotels/fort-arabesque-the-villas/1.png',
    FALSE
),
(
    (SELECT id FROM tours WHERE title = 'Fort Arabesque The Villas' AND tour_type = 'hotel' LIMIT 1),
    '/uploads/hotels/fort-arabesque-the-villas/2.png',
    FALSE
),
(
    (SELECT id FROM tours WHERE title = 'Fort Arabesque The Villas' AND tour_type = 'hotel' LIMIT 1),
    '/uploads/hotels/fort-arabesque-the-villas/3.png',
    FALSE
),
(
    (SELECT id FROM tours WHERE title = 'Fort Arabesque The Villas' AND tour_type = 'hotel' LIMIT 1),
    '/uploads/hotels/fort-arabesque-the-villas/4.png',
    FALSE
),
(
    (SELECT id FROM tours WHERE title = 'Fort Arabesque The Villas' AND tour_type = 'hotel' LIMIT 1),
    '/uploads/hotels/fort-arabesque-the-villas/5.png',
    FALSE
),
(
    (SELECT id FROM tours WHERE title = 'Fort Arabesque The Villas' AND tour_type = 'hotel' LIMIT 1),
    '/uploads/hotels/fort-arabesque-the-villas/6.png',
    FALSE
),
(
    (SELECT id FROM tours WHERE title = 'Fort Arabesque The Villas' AND tour_type = 'hotel' LIMIT 1),
    '/uploads/hotels/fort-arabesque-the-villas/7.png',
    FALSE
),
(
    (SELECT id FROM tours WHERE title = 'Fort Arabesque The Villas' AND tour_type = 'hotel' LIMIT 1),
    '/uploads/hotels/fort-arabesque-the-villas/8.png',
    FALSE
),
(
    (SELECT id FROM tours WHERE title = 'Fort Arabesque The Villas' AND tour_type = 'hotel' LIMIT 1),
    '/uploads/hotels/fort-arabesque-the-villas/9.png',
    FALSE
),
(
    (SELECT id FROM tours WHERE title = 'Fort Arabesque The Villas' AND tour_type = 'hotel' LIMIT 1),
    '/uploads/hotels/fort-arabesque-the-villas/10.png',
    FALSE
),
(
    (SELECT id FROM tours WHERE title = 'Fort Arabesque The Villas' AND tour_type = 'hotel' LIMIT 1),
    '/uploads/hotels/fort-arabesque-the-villas/11.png',
    FALSE
),
(
    (SELECT id FROM tours WHERE title = 'Fort Arabesque The Villas' AND tour_type = 'hotel' LIMIT 1),
    '/uploads/hotels/fort-arabesque-the-villas/12.png',
    FALSE
),
(
    (SELECT id FROM tours WHERE title = 'Fort Arabesque The Villas' AND tour_type = 'hotel' LIMIT 1),
    '/uploads/hotels/fort-arabesque-the-villas/13.png',
    FALSE
),
(
    (SELECT id FROM tours WHERE title = 'Fort Arabesque The Villas' AND tour_type = 'hotel' LIMIT 1),
    '/uploads/hotels/fort-arabesque-the-villas/14.png',
    FALSE
);

INSERT INTO tour_images (tour_id, image_url, is_main)
VALUES
(
    (SELECT id FROM tours WHERE title = 'Hard Rock Hotel Maldives' AND tour_type = 'hotel' LIMIT 1),
    '/uploads/hotels/hard-rock-hotel-maldives/main.png',
    TRUE
),
(
    (SELECT id FROM tours WHERE title = 'Hard Rock Hotel Maldives' AND tour_type = 'hotel' LIMIT 1),
    '/uploads/hotels/hard-rock-hotel-maldives/1.png',
    FALSE
),
(
    (SELECT id FROM tours WHERE title = 'Hard Rock Hotel Maldives' AND tour_type = 'hotel' LIMIT 1),
    '/uploads/hotels/hard-rock-hotel-maldives/2.png',
    FALSE
),
(
    (SELECT id FROM tours WHERE title = 'Hard Rock Hotel Maldives' AND tour_type = 'hotel' LIMIT 1),
    '/uploads/hotels/hard-rock-hotel-maldives/3.png',
    FALSE
),
(
    (SELECT id FROM tours WHERE title = 'Hard Rock Hotel Maldives' AND tour_type = 'hotel' LIMIT 1),
    '/uploads/hotels/hard-rock-hotel-maldives/4.png',
    FALSE
),
(
    (SELECT id FROM tours WHERE title = 'Hard Rock Hotel Maldives' AND tour_type = 'hotel' LIMIT 1),
    '/uploads/hotels/hard-rock-hotel-maldives/5.png',
    FALSE
),
(
    (SELECT id FROM tours WHERE title = 'Hard Rock Hotel Maldives' AND tour_type = 'hotel' LIMIT 1),
    '/uploads/hotels/hard-rock-hotel-maldives/6.png',
    FALSE
),
(
    (SELECT id FROM tours WHERE title = 'Hard Rock Hotel Maldives' AND tour_type = 'hotel' LIMIT 1),
    '/uploads/hotels/hard-rock-hotel-maldives/7.png',
    FALSE
),
(
    (SELECT id FROM tours WHERE title = 'Hard Rock Hotel Maldives' AND tour_type = 'hotel' LIMIT 1),
    '/uploads/hotels/hard-rock-hotel-maldives/8.png',
    FALSE
),
(
    (SELECT id FROM tours WHERE title = 'Hard Rock Hotel Maldives' AND tour_type = 'hotel' LIMIT 1),
    '/uploads/hotels/hard-rock-hotel-maldives/9.png',
    FALSE
);

INSERT INTO tour_images (tour_id, image_url, is_main)
VALUES
(
    (SELECT id FROM tours WHERE title = 'Pickalbatros Luxury Suites' AND tour_type = 'hotel' LIMIT 1),
    '/uploads/hotels/pickalbatros-luxury-suites/main.png',
    TRUE
),
(
    (SELECT id FROM tours WHERE title = 'Pickalbatros Luxury Suites' AND tour_type = 'hotel' LIMIT 1),
    '/uploads/hotels/pickalbatros-luxury-suites/1.png',
    FALSE
),
(
    (SELECT id FROM tours WHERE title = 'Pickalbatros Luxury Suites' AND tour_type = 'hotel' LIMIT 1),
    '/uploads/hotels/pickalbatros-luxury-suites/2.png',
    FALSE
),
(
    (SELECT id FROM tours WHERE title = 'Pickalbatros Luxury Suites' AND tour_type = 'hotel' LIMIT 1),
    '/uploads/hotels/pickalbatros-luxury-suites/3.png',
    FALSE
),
(
    (SELECT id FROM tours WHERE title = 'Pickalbatros Luxury Suites' AND tour_type = 'hotel' LIMIT 1),
    '/uploads/hotels/pickalbatros-luxury-suites/4.png',
    FALSE
),
(
    (SELECT id FROM tours WHERE title = 'Pickalbatros Luxury Suites' AND tour_type = 'hotel' LIMIT 1),
    '/uploads/hotels/pickalbatros-luxury-suites/5.png',
    FALSE
),
(
    (SELECT id FROM tours WHERE title = 'Pickalbatros Luxury Suites' AND tour_type = 'hotel' LIMIT 1),
    '/uploads/hotels/pickalbatros-luxury-suites/6.png',
    FALSE
),
(
    (SELECT id FROM tours WHERE title = 'Pickalbatros Luxury Suites' AND tour_type = 'hotel' LIMIT 1),
    '/uploads/hotels/pickalbatros-luxury-suites/7.png',
    FALSE
),
(
    (SELECT id FROM tours WHERE title = 'Pickalbatros Luxury Suites' AND tour_type = 'hotel' LIMIT 1),
    '/uploads/hotels/pickalbatros-luxury-suites/8.png',
    FALSE
),
(
    (SELECT id FROM tours WHERE title = 'Pickalbatros Luxury Suites' AND tour_type = 'hotel' LIMIT 1),
    '/uploads/hotels/pickalbatros-luxury-suites/9.png',
    FALSE
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
    location_name,
    hotel_lat,
    hotel_lng
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
    FALSE,
    (SELECT id FROM domestic_categories WHERE slug = 'kaliningrad-tours-1'),
    'Экскурсионный',
    'Калининград',
    54.706489,
    20.511389
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
    FALSE,
    (SELECT id FROM domestic_categories WHERE slug = 'kaliningrad-tours-1'),
    'Природный',
    'Куршская коса',
    55.112322,
    20.757230
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
    (SELECT id FROM domestic_categories WHERE slug = 'kaliningrad-tours-1'),
    'Семейный',
    'Калининградская область',
    54.724052,
    20.524689
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
    FALSE,
    (SELECT id FROM domestic_categories WHERE slug = 'kaliningrad-tours-1'),
    'Активный',
    'Калининград и побережье',
    54.752083,
    20.423056
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


-- =========================
-- ОТЗЫВЫ
-- =========================

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





-- =========================
-- БЛОГ
-- =========================

-- 1. 5 самых безопасных стран мира
INSERT INTO blog_posts (
    title,
    short_description,
    content,
    views,
    published_at,
    main_image_url,
    is_active,
    sort_order
)
VALUES (
    '5 самых безопасных стран мира',
    'Подборка стран с высоким уровнем безопасности для путешествий',
    'Статья о самых безопасных странах мира',
    0,
    '2026-04-11',
    '/uploads/blog/blog-main-imgs/blog-main-safe.png',
    TRUE,
    1
);

INSERT INTO blog_post_sections (
    blog_post_id,
    title,
    text,
    subtext,
    sort_order
)
VALUES
(
    (SELECT id FROM blog_posts WHERE sort_order = 1 ORDER BY id DESC LIMIT 1),
    'Исландия',
    'На протяжении многих лет мировым лидером в этом вопросе остается Исландия, где практически отсутствует тяжкая преступность, а полиция традиционно не носит огнестрельное оружие, что создает атмосферу абсолютного спокойствия.',
    NULL,
    1
),
(
    (SELECT id FROM blog_posts WHERE sort_order = 1 ORDER BY id DESC LIMIT 1),
    'Ирландия',
    'Ирландия также занимает лидирующие позиции благодаря своему историческому нейтралитету и стабильной внутренней политике, обеспечивающей гражданам защиту от внешних и внутренних угроз.',
    'Страна славится не только красивыми пейзажами, рыжеволосыми жителями, пабами, народными танцами и легендами о лепреконах.

За последнее десятилетие качество жизни ирландцев непрерывно росло, достигнув 2-го места в мировом рейтинге.',
    2
),
(
    (SELECT id FROM blog_posts WHERE sort_order = 1 ORDER BY id DESC LIMIT 1),
    'Дания',
    'Эту эстафету безопасности в Европе подхватывает Дания, которая считается одной из самых стабильных стран мира благодаря развитой системе социального обеспечения и минимальному уровню коррупции, что формирует у граждан высокое чувство ответственности и сопричастности к жизни общества. ',
    'Не менее важную роль в обеспечении глобального мира играет Ирландия, чей статус нейтралитета и успешные экономические реформы позволили создать общество с минимальным уровнем насильственных преступлений и высокой степенью внутренней гармонии.',
    3
),
(
    (SELECT id FROM blog_posts WHERE sort_order = 1 ORDER BY id DESC LIMIT 1),
    'Новая Зеландия',
    'В Южном полушарии эталоном мирного существования выступает Новая Зеландия, которая благодаря своей географической удаленности от мировых очагов напряженности и прогрессивной социальной политике обеспечивает своим жителям исключительный уровень личной безопасности и правопорядка. ',
    'Говоря о Новой Зеландии, многие вспомнят безмятежные зелёные долины из знаменитой экранизации «Властелина колец». Жизнь в этой стране так же стабильна и безопасна, как 
в уютном Хоббитоне.
 
Удалённая от конфликтов внешнего мира Новая Зеландия обеспечивает своим гражданам комфорт, бесплатное медицинское обслуживание, образование и безупречную экологическую обстановку.
',
    4
),
(
    (SELECT id FROM blog_posts WHERE sort_order = 1 ORDER BY id DESC LIMIT 1),
    'Сингапур',
    'Сингапур считается одной из самых безопасных стран мира благодаря сочетанию строгих законов и их последовательного применения, эффективной и хорошо финансируемой полиции, низкого уровня коррупции и высокого стандарта жизни, что вместе снижает мотивацию к преступности и повышает доверие к институтам. ',
    'Сингапур также известен своим высоким уровнем образования и социальной стабильности. Граждане страны, как правило, имеют доступ к качественному образованию, что способствует формированию ответственного отношения к обществу и окружающим. Местные жители проявляют высокий уровень уважения к другим, что создает дружественную атмосферу.',
    5
);

INSERT INTO blog_post_images (blog_post_id, section_id, image_url, sort_order)
VALUES
(
    (SELECT id FROM blog_posts WHERE sort_order = 1 ORDER BY id DESC LIMIT 1),
    (
        SELECT id FROM blog_post_sections
        WHERE blog_post_id = (SELECT id FROM blog_posts WHERE sort_order = 1 ORDER BY id DESC LIMIT 1)
          AND sort_order = 1
        LIMIT 1
    ),
    '/uploads/blog/blog-inner-imgs/blog-inner-safe1.png',
    1
),
(
    (SELECT id FROM blog_posts WHERE sort_order = 1 ORDER BY id DESC LIMIT 1),
    (
        SELECT id FROM blog_post_sections
        WHERE blog_post_id = (SELECT id FROM blog_posts WHERE sort_order = 1 ORDER BY id DESC LIMIT 1)
          AND sort_order = 2
        LIMIT 1
    ),
    '/uploads/blog/blog-inner-imgs/blog-inner-safe2.png',
    1
),
(
    (SELECT id FROM blog_posts WHERE sort_order = 1 ORDER BY id DESC LIMIT 1),
    (
        SELECT id FROM blog_post_sections
        WHERE blog_post_id = (SELECT id FROM blog_posts WHERE sort_order = 1 ORDER BY id DESC LIMIT 1)
          AND sort_order = 2
        LIMIT 1
    ),
    '/uploads/blog/blog-inner-imgs/blog-inner-safe3.png',
    2
),
(
    (SELECT id FROM blog_posts WHERE sort_order = 1 ORDER BY id DESC LIMIT 1),
    (
        SELECT id FROM blog_post_sections
        WHERE blog_post_id = (SELECT id FROM blog_posts WHERE sort_order = 1 ORDER BY id DESC LIMIT 1)
          AND sort_order = 3
        LIMIT 1
    ),
    '/uploads/blog/blog-inner-imgs/blog-inner-safe4.png',
    1
),
(
    (SELECT id FROM blog_posts WHERE sort_order = 1 ORDER BY id DESC LIMIT 1),
    (
        SELECT id FROM blog_post_sections
        WHERE blog_post_id = (SELECT id FROM blog_posts WHERE sort_order = 1 ORDER BY id DESC LIMIT 1)
          AND sort_order = 4
        LIMIT 1
    ),
    '/uploads/blog/blog-inner-imgs/blog-inner-safe5.png',
    1
),
(
    (SELECT id FROM blog_posts WHERE sort_order = 1 ORDER BY id DESC LIMIT 1),
    (
        SELECT id FROM blog_post_sections
        WHERE blog_post_id = (SELECT id FROM blog_posts WHERE sort_order = 1 ORDER BY id DESC LIMIT 1)
          AND sort_order = 4
        LIMIT 1
    ),
    '/uploads/blog/blog-inner-imgs/blog-inner-safe6.png',
    2
),
(
    (SELECT id FROM blog_posts WHERE sort_order = 1 ORDER BY id DESC LIMIT 1),
    (
        SELECT id FROM blog_post_sections
        WHERE blog_post_id = (SELECT id FROM blog_posts WHERE sort_order = 1 ORDER BY id DESC LIMIT 1)
          AND sort_order = 5
        LIMIT 1
    ),
    '/uploads/blog/blog-inner-imgs/blog-inner-safe7.png',
    1
);

-- 2. Как путешествовать по Европе в 2026 году
INSERT INTO blog_posts (
    title,
    short_description,
    content,
    views,
    published_at,
    main_image_url,
    is_active,
    sort_order
)
VALUES (
    'Как путешествовать по Европе в 2026 году',
    'Гид по путешествиям по Европе в 2026 году',
    'Планируя путешествие по Европе в 2026 году, стоит обратить внимание на улучшение инфраструктуры и развитие транспорта. Современные поезда, экологически чистые автобусы и новые авиаперевозчики дают массу возможностей для комфортного перемещения.

Кроме того, стоит ожидать значительных улучшений в системе виз, которая упростит процесс для многих стран. Повышение безопасности на границах, новые технологии для облегчения прохождения пограничного контроля, а также развитие культурного туризма окажут влияние на скорость и доступность путешествий по континенту.',
    0,
    '2026-05-04',
    '/uploads/blog/blog-main-imgs/blog-main-europe-travel.png',
    TRUE,
    2
);

INSERT INTO blog_post_sections (
    blog_post_id,
    title,
    text,
    subtext,
    sort_order
)
VALUES
(
    (SELECT id FROM blog_posts WHERE sort_order = 2 ORDER BY id DESC LIMIT 1),
    'Транспорт и новые возможности',
    'Современные поезда, экологически чистые автобусы и новые авиаперевозчики открывают новые горизонты для путешественников, желающих исследовать Европу в 2026 году.',
    NULL,
    1
),
(
    (SELECT id FROM blog_posts WHERE sort_order = 2 ORDER BY id DESC LIMIT 1),
    'Визовые улучшения',
    'Страны Европы обещают значительные улучшения в визовой системе, что значительно упростит процесс для путешественников и ускорит поездки.',
    NULL,
    2
);

INSERT INTO blog_post_images (blog_post_id, section_id, image_url, sort_order)
VALUES
(
    (SELECT id FROM blog_posts WHERE sort_order = 2 ORDER BY id DESC LIMIT 1),
    (
        SELECT id FROM blog_post_sections
        WHERE blog_post_id = (SELECT id FROM blog_posts WHERE sort_order = 2 ORDER BY id DESC LIMIT 1)
          AND sort_order = 1
        LIMIT 1
    ),
    '/uploads/blog/blog-inner-imgs/blog-inner-europe-transport1.png',
    1
),
(
    (SELECT id FROM blog_posts WHERE sort_order = 2 ORDER BY id DESC LIMIT 1),
    (
        SELECT id FROM blog_post_sections
        WHERE blog_post_id = (SELECT id FROM blog_posts WHERE sort_order = 2 ORDER BY id DESC LIMIT 1)
          AND sort_order = 2
        LIMIT 1
    ),
    '/uploads/blog/blog-inner-imgs/blog-inner-europe-visa1.png',
    1
);

-- 3. Как купить дешёвые билеты на самолёт
INSERT INTO blog_posts (
    title,
    short_description,
    content,
    views,
    published_at,
    main_image_url,
    is_active,
    sort_order
)
VALUES (
    'Как купить дешёвые билеты на самолёт',
    'Рекомендации по поиску дешёвых авиабилетов',
    'Чтобы сэкономить на авиабилетах, прежде всего важно заранее планировать поездки. Билеты на самолёт обычно дешевле, если они приобретаются за несколько месяцев до даты вылета. Использование специализированных сайтов и приложений для поиска дешёвых предложений также значительно сокращает расходы.

Стоит также обратить внимание на выбор рейсов с пересадками и не самых популярных дней недели для вылета. Многие авиакомпании предлагают скидки на рейсы, которые не пользуются высоким спросом, а по срокам они вполне могут быть подходящими.',
    0,
    '2026-05-04',
    '/uploads/blog/blog-main-imgs/blog-main-cheap-flights.png',
    TRUE,
    3
);

INSERT INTO blog_post_sections (
    blog_post_id,
    title,
    text,
    subtext,
    sort_order
)
VALUES
(
    (SELECT id FROM blog_posts WHERE sort_order = 3 ORDER BY id DESC LIMIT 1),
    'Как заранее планировать поездки',
    'Заранее приобретённые билеты на самолёт обойдутся значительно дешевле, чем те, которые покупаются в последний момент.',
    NULL,
    1
),
(
    (SELECT id FROM blog_posts WHERE sort_order = 3 ORDER BY id DESC LIMIT 1),
    'Использование специализированных сайтов',
    'Использование специальных агрегаторов для поиска дешёвых билетов может существенно снизить расходы.',
    NULL,
    2
);

INSERT INTO blog_post_images (blog_post_id, section_id, image_url, sort_order)
VALUES
(
    (SELECT id FROM blog_posts WHERE sort_order = 3 ORDER BY id DESC LIMIT 1),
    (
        SELECT id FROM blog_post_sections
        WHERE blog_post_id = (SELECT id FROM blog_posts WHERE sort_order = 3 ORDER BY id DESC LIMIT 1)
          AND sort_order = 1
        LIMIT 1
    ),
    '/uploads/blog/blog-inner-imgs/blog-inner-cheap-flights1.png',
    1
),
(
    (SELECT id FROM blog_posts WHERE sort_order = 3 ORDER BY id DESC LIMIT 1),
    (
        SELECT id FROM blog_post_sections
        WHERE blog_post_id = (SELECT id FROM blog_posts WHERE sort_order = 3 ORDER BY id DESC LIMIT 1)
          AND sort_order = 2
        LIMIT 1
    ),
    '/uploads/blog/blog-inner-imgs/blog-inner-cheap-flights2.png',
    1
);

-- 4. Достопримечательности Калининграда
INSERT INTO blog_posts (
    title,
    short_description,
    content,
    views,
    published_at,
    main_image_url,
    is_active,
    sort_order
)
VALUES (
    'Достопримечательности Калининграда',
    'Обзор достопримечательностей Калининграда',
    'Калининград — это не только центр старинной истории, но и место для современных туристов, которые любят сочетать экскурсии по уникальным памятникам с отдыхом на природе. Город привлекает туристов благодаря своему уникальному расположению и яркой исторической атмосфере.

Одной из главных достопримечательностей является Кёнигсбергский кафедральный собор, который стоит на острове Канта и олицетворяет собой богатое историческое наследие. Также стоит посетить Музей янтаря, где можно узнать об уникальных свойствах этого камня, который добывается только в этом регионе.',
    0,
    '2026-03-03',
    '/uploads/blog/blog-main-imgs/blog-main-kaliningrad-sights.png',
    TRUE,
    4
);

INSERT INTO blog_post_sections (
    blog_post_id,
    title,
    text,
    subtext,
    sort_order
)
VALUES
(
    (SELECT id FROM blog_posts WHERE sort_order = 4 ORDER BY id DESC LIMIT 1),
    'Кёнигсбергский кафедральный собор',
    'Одной из главных достопримечательностей Калининграда является Кёнигсбергский кафедральный собор, символ города и культурное наследие региона.',
    NULL,
    1
),
(
    (SELECT id FROM blog_posts WHERE sort_order = 4 ORDER BY id DESC LIMIT 1),
    'Музей янтаря',
    'Музей янтаря в Калининграде – это уникальное место, где можно узнать обо всех аспектах использования янтаря, добываемого только в этом регионе.',
    NULL,
    2
);

INSERT INTO blog_post_images (blog_post_id, section_id, image_url, sort_order)
VALUES
(
    (SELECT id FROM blog_posts WHERE sort_order = 4 ORDER BY id DESC LIMIT 1),
    (
        SELECT id FROM blog_post_sections
        WHERE blog_post_id = (SELECT id FROM blog_posts WHERE sort_order = 4 ORDER BY id DESC LIMIT 1)
          AND sort_order = 1
        LIMIT 1
    ),
    '/uploads/blog/blog-inner-imgs/blog-inner-kaliningrad1.png',
    1
),
(
    (SELECT id FROM blog_posts WHERE sort_order = 4 ORDER BY id DESC LIMIT 1),
    (
        SELECT id FROM blog_post_sections
        WHERE blog_post_id = (SELECT id FROM blog_posts WHERE sort_order = 4 ORDER BY id DESC LIMIT 1)
          AND sort_order = 2
        LIMIT 1
    ),
    '/uploads/blog/blog-inner-imgs/blog-inner-kaliningrad2.png',
    1
);

-- 5. Куда поехать в марте 2026 года
INSERT INTO blog_posts (
    title,
    short_description,
    content,
    views,
    published_at,
    main_image_url,
    is_active,
    sort_order
)
VALUES (
    'Куда поехать в марте 2026 года',
    'Лучшие направления для путешествий в марте',
    'Март — это идеальное время для путешествий, когда зимний сезон ещё не закончился, а весна уже начинает ощущаться. Для любителей горных лыж март — это последний месяц для катания в Альпах и других горных регионах Европы. Также в марте начинают открываться пляжные курорты в южных странах.

Любители культуры и искусства могут отправиться в столицу Франции, Париж, где в это время проходят театральные фестивали и выставки.',
    0,
    '2026-02-15',
    '/uploads/blog/blog-main-imgs/blog-main-march-travel.png',
    TRUE,
    5
);

INSERT INTO blog_post_sections (
    blog_post_id,
    title,
    text,
    subtext,
    sort_order
)
VALUES
(
    (SELECT id FROM blog_posts WHERE sort_order = 5 ORDER BY id DESC LIMIT 1),
    'Горнолыжные курорты в марте',
    'Март — последний месяц сезона для катания на горных лыжах, и лучшие горнолыжные курорты Европы начинают принимать туристов.',
    NULL,
    1
),
(
    (SELECT id FROM blog_posts WHERE sort_order = 5 ORDER BY id DESC LIMIT 1),
    'Пляжные курорты в марте',
    'Март — это отличное время для того, чтобы насладиться пляжным отдыхом в южных странах, таких как Турция и Египет.',
    NULL,
    2
);

INSERT INTO blog_post_images (blog_post_id, section_id, image_url, sort_order)
VALUES
(
    (SELECT id FROM blog_posts WHERE sort_order = 5 ORDER BY id DESC LIMIT 1),
    (
        SELECT id FROM blog_post_sections
        WHERE blog_post_id = (SELECT id FROM blog_posts WHERE sort_order = 5 ORDER BY id DESC LIMIT 1)
          AND sort_order = 1
        LIMIT 1
    ),
    '/uploads/blog/blog-inner-imgs/blog-inner-march-ski.png',
    1
),
(
    (SELECT id FROM blog_posts WHERE sort_order = 5 ORDER BY id DESC LIMIT 1),
    (
        SELECT id FROM blog_post_sections
        WHERE blog_post_id = (SELECT id FROM blog_posts WHERE sort_order = 5 ORDER BY id DESC LIMIT 1)
          AND sort_order = 2
        LIMIT 1
    ),
    '/uploads/blog/blog-inner-imgs/blog-inner-march-beach.png',
    1
);

-- 6. Лучшие отели Маккади Бей
INSERT INTO blog_posts (
    title,
    short_description,
    content,
    views,
    published_at,
    main_image_url,
    is_active,
    sort_order
)
VALUES (
    'Лучшие отели Маккади Бей',
    'Обзор лучших отелей в Маккади Бей',
    'Маккади Бей — это роскошный курорт в Египте, который привлекает туристов своим качественным обслуживанием и высококлассными отелями. В этой статье мы рассмотрим лучшие отели Маккади Бей, которые предлагают высокий уровень комфорта и сервиса.

Отель Fort Arabesque The Villas является одним из самых популярных на курорте. Виллы с частными бассейнами и шикарным видом на Красное море привлекают туристов со всего мира. Кроме того, отель предлагает разнообразные спа-процедуры и кухни разных стран.',
    0,
    '2026-02-05',
    '/uploads/blog/blog-main-imgs/blog-main-makadi-bay-hotels.png',
    TRUE,
    6
);

INSERT INTO blog_post_sections (
    blog_post_id,
    title,
    text,
    subtext,
    sort_order
)
VALUES
(
    (SELECT id FROM blog_posts WHERE sort_order = 6 ORDER BY id DESC LIMIT 1),
    'Fort Arabesque The Villas',
    'Виллы с частными бассейнами и шикарным видом на Красное море — популярный выбор для туристов, желающих насладиться комфортом и роскошью.',
    NULL,
    1
);

INSERT INTO blog_post_images (blog_post_id, section_id, image_url, sort_order)
VALUES
(
    (SELECT id FROM blog_posts WHERE sort_order = 6 ORDER BY id DESC LIMIT 1),
    (
        SELECT id FROM blog_post_sections
        WHERE blog_post_id = (SELECT id FROM blog_posts WHERE sort_order = 6 ORDER BY id DESC LIMIT 1)
          AND sort_order = 1
        LIMIT 1
    ),
    '/uploads/blog/blog-inner-imgs/blog-inner-makadi-bay1.png',
    1
);

-- 7. Где отдохнуть с детьми летом за границей
INSERT INTO blog_posts (
    title,
    short_description,
    content,
    views,
    published_at,
    main_image_url,
    is_active,
    sort_order
)
VALUES (
    'Где отдохнуть с детьми летом за границей',
    'Лучшие места для отдыха с детьми летом',
    'Если вы планируете летний отдых с детьми, стоит обратить внимание на страны с развитой инфраструктурой для семейного отдыха. Например, в Испании и Италии можно найти множество курортов с детскими клубами, бассейнами и программами для детей всех возрастов.

Для тех, кто любит активный отдых, можно поехать в горы, где дети смогут заниматься альпинизмом, катанием на велосипедах и других активных занятиях. Летний отдых на пляже также является отличным вариантом, особенно в Турции и Греции, где огромное количество семейных отелей.',
    0,
    '2026-01-24',
    '/uploads/blog/blog-main-imgs/blog-main-family-vacation.png',
    TRUE,
    7
);

INSERT INTO blog_post_sections (
    blog_post_id,
    title,
    text,
    subtext,
    sort_order
)
VALUES
(
    (SELECT id FROM blog_posts WHERE sort_order = 7 ORDER BY id DESC LIMIT 1),
    'Семейные курорты Европы',
    'Испания и Италия предлагают отличные курорты для семейного отдыха с детьми, включая детские клубы и бассейны.',
    NULL,
    1
),
(
    (SELECT id FROM blog_posts WHERE sort_order = 7 ORDER BY id DESC LIMIT 1),
    'Активный отдых с детьми',
    'Если ваши дети любят активный отдых, горы и приключенческие туры могут быть отличным выбором.',
    NULL,
    2
);

INSERT INTO blog_post_images (blog_post_id, section_id, image_url, sort_order)
VALUES
(
    (SELECT id FROM blog_posts WHERE sort_order = 7 ORDER BY id DESC LIMIT 1),
    (
        SELECT id FROM blog_post_sections
        WHERE blog_post_id = (SELECT id FROM blog_posts WHERE sort_order = 7 ORDER BY id DESC LIMIT 1)
          AND sort_order = 1
        LIMIT 1
    ),
    '/uploads/blog/blog-inner-imgs/blog-inner-family-vacation1.png',
    1
),
(
    (SELECT id FROM blog_posts WHERE sort_order = 7 ORDER BY id DESC LIMIT 1),
    (
        SELECT id FROM blog_post_sections
        WHERE blog_post_id = (SELECT id FROM blog_posts WHERE sort_order = 7 ORDER BY id DESC LIMIT 1)
          AND sort_order = 2
        LIMIT 1
    ),
    '/uploads/blog/blog-inner-imgs/blog-inner-family-vacation2.png',
    1
);

-- 8. Что посмотреть в Турции
INSERT INTO blog_posts (
    title,
    short_description,
    content,
    views,
    published_at,
    main_image_url,
    is_active,
    sort_order
)
VALUES (
    'Что посмотреть в Турции',
    'Обзор туристических достопримечательностей Турции',
    'Турция — это не только пляжи и курорты, но и богатая культура и история. Стамбул — это город, где встречаются Восток и Запад, и который представляет собой смесь древней истории с современным стилем жизни. В нем стоит посетить знаменитую Собор Святой Софии, Голубую мечеть и дворец Топкапы.

Кроме того, для любителей природы стоит отправиться в Каппадокию, где вас ждут фантастические пейзажи и поездки на воздушных шарах. Также Турция известна своими античными памятниками и древними городами, такими как Эфес.',
    0,
    '2026-01-12',
    '/uploads/blog/blog-main-imgs/blog-main-turkey-sights.png',
    TRUE,
    8
);

INSERT INTO blog_post_sections (
    blog_post_id,
    title,
    text,
    subtext,
    sort_order
)
VALUES
(
    (SELECT id FROM blog_posts WHERE sort_order = 8 ORDER BY id DESC LIMIT 1),
    'Стамбул',
    'Город, который объединяет Восток и Запад. Стамбул — это культурное сердце Турции, с множеством исторических достопримечательностей.',
    NULL,
    1
),
(
    (SELECT id FROM blog_posts WHERE sort_order = 8 ORDER BY id DESC LIMIT 1),
    'Каппадокия и природные чудеса',
    'Необычные пейзажи Каппадокии и поездки на воздушных шарах — это обязательные моменты для тех, кто ищет необычные приключения.',
    NULL,
    2
);

INSERT INTO blog_post_images (blog_post_id, section_id, image_url, sort_order)
VALUES
(
    (SELECT id FROM blog_posts WHERE sort_order = 8 ORDER BY id DESC LIMIT 1),
    (
        SELECT id FROM blog_post_sections
        WHERE blog_post_id = (SELECT id FROM blog_posts WHERE sort_order = 8 ORDER BY id DESC LIMIT 1)
          AND sort_order = 1
        LIMIT 1
    ),
    '/uploads/blog/blog-inner-imgs/blog-inner-turkey1.png',
    1
),
(
    (SELECT id FROM blog_posts WHERE sort_order = 8 ORDER BY id DESC LIMIT 1),
    (
        SELECT id FROM blog_post_sections
        WHERE blog_post_id = (SELECT id FROM blog_posts WHERE sort_order = 8 ORDER BY id DESC LIMIT 1)
          AND sort_order = 2
        LIMIT 1
    ),
    '/uploads/blog/blog-inner-imgs/blog-inner-turkey2.png',
    1
);

-- 9. Страны, куда не нужна виза
INSERT INTO blog_posts (
    title,
    short_description,
    content,
    views,
    published_at,
    main_image_url,
    is_active,
    sort_order
)
VALUES (
    'Страны, куда не нужна виза',
    'Обзор стран, в которые не нужна виза для граждан России',
    'Для путешественников, которым не нравится тратить время на получение виз, существует множество стран, куда можно поехать без лишних формальностей. В этом списке есть как экзотические места, так и достаточно популярные направления для отдыха.

Например, туристы из России могут свободно путешествовать в такие страны, как Турция, Израиль, Армения и Сербия, не оформляя визу. Эти страны предлагают массу достопримечательностей, комфортные курорты и удобное географическое расположение для краткосрочных поездок.',
    0,
    '2026-01-10',
    '/uploads/blog/blog-main-imgs/blog-main-no-visa-countries.png',
    TRUE,
    9
);

INSERT INTO blog_post_sections (
    blog_post_id,
    title,
    text,
    subtext,
    sort_order
)
VALUES
(
    (SELECT id FROM blog_posts WHERE sort_order = 9 ORDER BY id DESC LIMIT 1),
    'Безвизовые страны для россиян',
    'Россияне могут путешествовать без визы в несколько стран Европы и Азии, что делает путешествия ещё удобнее.',
    NULL,
    1
);

INSERT INTO blog_post_images (blog_post_id, section_id, image_url, sort_order)
VALUES
(
    (SELECT id FROM blog_posts WHERE sort_order = 9 ORDER BY id DESC LIMIT 1),
    (
        SELECT id FROM blog_post_sections
        WHERE blog_post_id = (SELECT id FROM blog_posts WHERE sort_order = 9 ORDER BY id DESC LIMIT 1)
          AND sort_order = 1
        LIMIT 1
    ),
    '/uploads/blog/blog-inner-imgs/blog-inner-no-visa1.png',
    1
);
