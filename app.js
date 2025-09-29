const feedGrid = document.getElementById("feedGrid");
const rssUrlInput = document.getElementById("rssUrl");
const categorySelect = document.getElementById("categorySelect");
const tabs = document.getElementById("tabs");
const bottomNav = document.getElementById("bottomNav");
const themeIcon = document.getElementById("themeIcon");
const modal = document.getElementById("modal");
const modalContent = document.getElementById("modalContent");
const shareModal = document.getElementById("shareModal");
const shareOptions = document.getElementById("shareOptions");
const linkPreview = document.getElementById("linkPreview");
const feedManageModal = document.getElementById("feedManageModal");
const feedManageOptions = document.getElementById("feedManageOptions");
let feeds = JSON.parse(localStorage.getItem("rssFeeds")) || [];
let feedNames = JSON.parse(localStorage.getItem("feedNames")) || {};
let feedCategories = JSON.parse(localStorage.getItem("feedCategories")) || {};
let categories = JSON.parse(localStorage.getItem("categories")) || [
    "Без категории",
];
let currentFeedIndex = 0;
let currentItem = null;
let currentMode = "normal";

// Кэш для RSS лент
let feedCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 минут

// Очередь загрузки для оптимизации
let loadQueue = [];
let isLoading = false;

// База рекомендуемых RSS лент по доменам
const RECOMMENDED_FEEDS = {
    "🌍 Мировые новости": [
        // Россия
        {
            name: "Лента.ру",
            url: "https://lenta.ru/rss",
            domain: "lenta.ru",
            description: "Актуальные новости России и мира",
            country: "🇷🇺 Россия",
            language: "ru",
            quality: 9
        },
        {
            name: "РИА Новости",
            url: "https://ria.ru/export/rss2/archive/index.xml",
            domain: "ria.ru",
            description: "Официальные новости от РИА",
            country: "🇷🇺 Россия",
            language: "ru",
            quality: 8
        },
        {
            name: "Коммерсантъ",
            url: "https://www.kommersant.ru/RSS/main.xml",
            domain: "kommersant.ru",
            description: "Деловые новости и аналитика",
            country: "🇷🇺 Россия",
            language: "ru",
            quality: 9
        },
        {
            name: "Медуза",
            url: "https://meduza.io/rss/all",
            domain: "meduza.io",
            description: "Независимые новости и журналистика",
            country: "🇷🇺 Россия",
            language: "ru",
            quality: 9
        },
        // США
        {
            name: "CNN",
            url: "http://rss.cnn.com/rss/edition.rss",
            domain: "cnn.com",
            description: "Мировые новости от CNN",
            country: "🇺🇸 США",
            language: "en",
            quality: 9
        },
        {
            name: "BBC News",
            url: "http://feeds.bbci.co.uk/news/rss.xml",
            domain: "bbc.com",
            description: "Международные новости BBC",
            country: "🇬🇧 Великобритания",
            language: "en",
            quality: 10
        },
        {
            name: "Reuters",
            url: "https://feeds.reuters.com/reuters/topNews",
            domain: "reuters.com",
            description: "Мировые новости от Reuters",
            country: "🇬🇧 Великобритания",
            language: "en",
            quality: 10
        },
        {
            name: "The Guardian",
            url: "https://www.theguardian.com/world/rss",
            domain: "theguardian.com",
            description: "Независимая журналистика",
            country: "🇬🇧 Великобритания",
            language: "en",
            quality: 9
        },
        // Европа
        {
            name: "Deutsche Welle",
            url: "https://rss.dw.com/rdf/rss-en-all",
            domain: "dw.com",
            description: "Немецкие международные новости",
            country: "🇩🇪 Германия",
            language: "en",
            quality: 9
        },
        {
            name: "France 24",
            url: "https://www.france24.com/en/rss",
            domain: "france24.com",
            description: "Французские международные новости",
            country: "🇫🇷 Франция",
            language: "en",
            quality: 8
        },
        {
            name: "Euronews",
            url: "https://feeds.feedburner.com/euronews/en/home",
            domain: "euronews.com",
            description: "Европейские новости",
            country: "🇪🇺 Европа",
            language: "en",
            quality: 8
        },
        // Азия
        {
            name: "NHK World",
            url: "https://www3.nhk.or.jp/rss/news/cat0.xml",
            domain: "nhk.or.jp",
            description: "Японские новости",
            country: "🇯🇵 Япония",
            language: "en",
            quality: 8
        },
        {
            name: "Al Jazeera",
            url: "https://www.aljazeera.com/xml/rss/all.xml",
            domain: "aljazeera.com",
            description: "Ближневосточные новости",
            country: "🇶🇦 Катар",
            language: "en",
            quality: 8
        }
    ],
    "💻 Технологии": [
        // Русскоязычные
        {
            name: "Хабр",
            url: "https://habr.com/ru/rss/hub/programming/",
            domain: "habr.com",
            description: "IT-статьи и новости технологий",
            country: "🇷🇺 Россия",
            language: "ru",
            quality: 9
        },
        {
            name: "CNews",
            url: "https://www.cnews.ru/inc/rss/news.xml",
            domain: "cnews.ru",
            description: "IT-новости и аналитика",
            country: "🇷🇺 Россия",
            language: "ru",
            quality: 8
        },
        // Международные
        {
            name: "TechCrunch",
            url: "https://techcrunch.com/feed/",
            domain: "techcrunch.com",
            description: "Стартапы и технологические новости",
            country: "🇺🇸 США",
            language: "en",
            quality: 10
        },
        {
            name: "Wired",
            url: "https://www.wired.com/feed/rss",
            domain: "wired.com",
            description: "Технологии, наука, культура",
            country: "🇺🇸 США",
            language: "en",
            quality: 9
        },
        {
            name: "Ars Technica",
            url: "https://feeds.arstechnica.com/arstechnica/index",
            domain: "arstechnica.com",
            description: "Глубокая техническая аналитика",
            country: "🇺🇸 США",
            language: "en",
            quality: 9
        },
        {
            name: "The Verge",
            url: "https://www.theverge.com/rss/index.xml",
            domain: "theverge.com",
            description: "Технологии и цифровая культура",
            country: "🇺🇸 США",
            language: "en",
            quality: 9
        },
        {
            name: "Engadget",
            url: "https://www.engadget.com/rss.xml",
            domain: "engadget.com",
            description: "Гаджеты и потребительские технологии",
            country: "🇺🇸 США",
            language: "en",
            quality: 8
        },
        {
            name: "MIT Technology Review",
            url: "https://www.technologyreview.com/feed/",
            domain: "technologyreview.com",
            description: "Передовые технологии от MIT",
            country: "🇺🇸 США",
            language: "en",
            quality: 10
        }
    ],
    "🔬 Наука": [
        // Русскоязычные
        {
            name: "N+1",
            url: "https://nplus1.ru/rss",
            domain: "nplus1.ru",
            description: "Научно-популярные статьи",
            country: "🇷🇺 Россия",
            language: "ru",
            quality: 9
        },
        {
            name: "ПостНаука",
            url: "https://postnauka.ru/rss",
            domain: "postnauka.ru",
            description: "Популярная наука от экспертов",
            country: "🇷🇺 Россия",
            language: "ru",
            quality: 8
        },
        // Международные
        {
            name: "Nature",
            url: "https://www.nature.com/nature.rss",
            domain: "nature.com",
            description: "Ведущий научный журнал",
            country: "🇬🇧 Великобритания",
            language: "en",
            quality: 10
        },
        {
            name: "Science Magazine",
            url: "https://www.science.org/rss/news_current.xml",
            domain: "science.org",
            description: "Научные исследования и открытия",
            country: "🇺🇸 США",
            language: "en",
            quality: 10
        },
        {
            name: "Scientific American",
            url: "https://rss.sciam.com/ScientificAmerican-Global",
            domain: "scientificamerican.com",
            description: "Популярная наука",
            country: "🇺🇸 США",
            language: "en",
            quality: 9
        },
        {
            name: "New Scientist",
            url: "https://www.newscientist.com/feed/home/",
            domain: "newscientist.com",
            description: "Научные новости и открытия",
            country: "🇬🇧 Великобритания",
            language: "en",
            quality: 9
        },
        {
            name: "Phys.org",
            url: "https://phys.org/rss-feed/",
            domain: "phys.org",
            description: "Физика и технологии",
            country: "🇺🇸 США",
            language: "en",
            quality: 8
        }
    ],
    "⚽ Спорт": [
        // Россия
        {
            name: "Спорт-Экспресс",
            url: "https://www.sport-express.ru/services/materials/rss/",
            domain: "sport-express.ru",
            description: "Спортивные новости России",
            country: "🇷🇺 Россия",
            language: "ru",
            quality: 8
        },
        {
            name: "Чемпионат.com",
            url: "https://www.championat.com/rss/news.xml",
            domain: "championat.com",
            description: "Футбол и другие виды спорта",
            country: "🇷🇺 Россия",
            language: "ru",
            quality: 8
        },
        // Международные
        {
            name: "ESPN",
            url: "https://www.espn.com/espn/rss/news",
            domain: "espn.com",
            description: "Американский спорт",
            country: "🇺🇸 США",
            language: "en",
            quality: 9
        },
        {
            name: "BBC Sport",
            url: "http://feeds.bbci.co.uk/sport/rss.xml",
            domain: "bbc.com",
            description: "Мировой спорт от BBC",
            country: "🇬🇧 Великобритания",
            language: "en",
            quality: 9
        },
        {
            name: "Sky Sports",
            url: "https://www.skysports.com/rss/12040",
            domain: "skysports.com",
            description: "Футбол и спорт",
            country: "🇬🇧 Великобритания",
            language: "en",
            quality: 8
        },
        {
            name: "Goal.com",
            url: "https://www.goal.com/feeds/en/news",
            domain: "goal.com",
            description: "Мировой футбол",
            country: "🌍 Международный",
            language: "en",
            quality: 8
        }
    ],
    "🎬 Развлечения": [
        // Русскоязычные
        {
            name: "Кинопоиск",
            url: "https://www.kinopoisk.ru/rss/news.xml",
            domain: "kinopoisk.ru",
            description: "Новости кино и сериалов",
            country: "🇷🇺 Россия",
            language: "ru",
            quality: 8
        },
        {
            name: "Игромания",
            url: "https://www.igromania.ru/rss/",
            domain: "igromania.ru",
            description: "Игровые новости и обзоры",
            country: "🇷🇺 Россия",
            language: "ru",
            quality: 8
        },
        // Международные
        {
            name: "IGN",
            url: "https://feeds.ign.com/ign/games-all",
            domain: "ign.com",
            description: "Игровые новости и обзоры",
            country: "🇺🇸 США",
            language: "en",
            quality: 9
        },
        {
            name: "GameSpot",
            url: "https://www.gamespot.com/feeds/mashup/",
            domain: "gamespot.com",
            description: "Видеоигры и развлечения",
            country: "🇺🇸 США",
            language: "en",
            quality: 8
        },
        {
            name: "Entertainment Weekly",
            url: "https://ew.com/feed/",
            domain: "ew.com",
            description: "Голливуд и поп-культура",
            country: "🇺🇸 США",
            language: "en",
            quality: 8
        },
        {
            name: "Variety",
            url: "https://variety.com/feed/",
            domain: "variety.com",
            description: "Индустрия развлечений",
            country: "🇺🇸 США",
            language: "en",
            quality: 9
        }
    ],
    "💰 Экономика": [
        // Россия
        {
            name: "РБК",
            url: "https://rssexport.rbc.ru/rbcnews/news/20/full.rss",
            domain: "rbc.ru",
            description: "Деловые новости России",
            country: "🇷🇺 Россия",
            language: "ru",
            quality: 9
        },
        {
            name: "Ведомости",
            url: "https://www.vedomosti.ru/rss/news",
            domain: "vedomosti.ru",
            description: "Экономика и бизнес",
            country: "🇷🇺 Россия",
            language: "ru",
            quality: 9
        },
        // Международные
        {
            name: "Financial Times",
            url: "https://www.ft.com/rss/home",
            domain: "ft.com",
            description: "Мировые финансовые новости",
            country: "🇬🇧 Великобритания",
            language: "en",
            quality: 10
        },
        {
            name: "Bloomberg",
            url: "https://feeds.bloomberg.com/markets/news.rss",
            domain: "bloomberg.com",
            description: "Финансовые рынки",
            country: "🇺🇸 США",
            language: "en",
            quality: 10
        },
        {
            name: "Wall Street Journal",
            url: "https://feeds.a.dj.com/rss/RSSWorldNews.xml",
            domain: "wsj.com",
            description: "Деловые новости США",
            country: "🇺🇸 США",
            language: "en",
            quality: 10
        },
        {
            name: "The Economist",
            url: "https://www.economist.com/rss/latest_updates_rss.xml",
            domain: "economist.com",
            description: "Экономическая аналитика",
            country: "🇬🇧 Великобритания",
            language: "en",
            quality: 10
        }
    ],
    "🏥 Здоровье": [
        {
            name: "WebMD",
            url: "https://rssfeeds.webmd.com/rss/rss.aspx?RSSSource=RSS_PUBLIC",
            domain: "webmd.com",
            description: "Медицинские новости и советы",
            country: "🇺🇸 США",
            language: "en",
            quality: 8
        },
        {
            name: "Mayo Clinic",
            url: "https://newsnetwork.mayoclinic.org/feed/",
            domain: "mayoclinic.org",
            description: "Медицинские исследования",
            country: "🇺🇸 США",
            language: "en",
            quality: 9
        },
        {
            name: "Healthline",
            url: "https://www.healthline.com/rss",
            domain: "healthline.com",
            description: "Здоровье и медицина",
            country: "🇺🇸 США",
            language: "en",
            quality: 8
        }
    ],
    "🌱 Экология": [
        {
            name: "National Geographic",
            url: "https://feeds.nationalgeographic.com/ng/News/News_Main",
            domain: "nationalgeographic.com",
            description: "Природа и экология",
            country: "🇺🇸 США",
            language: "en",
            quality: 9
        },
        {
            name: "Environmental News Network",
            url: "https://www.enn.com/rss",
            domain: "enn.com",
            description: "Экологические новости",
            country: "🇺🇸 США",
            language: "en",
            quality: 8
        },
        {
            name: "TreeHugger",
            url: "https://www.treehugger.com/feeds/rss",
            domain: "treehugger.com",
            description: "Устойчивое развитие",
            country: "🇺🇸 США",
            language: "en",
            quality: 8
        }
    ]
};

// Настройки рекомендаций
// Настройки рекомендаций с правильной инициализацией
const defaultRecommendationSettings = {
    enabled: true,
    showOnStartup: true,
    categories: Object.keys(RECOMMENDED_FEEDS),
    maxRecommendations: 8,
    preferredLanguages: ['ru', 'en'],
    preferredCountries: [],
    minQuality: 7,
    showCountryFlags: true,
    groupByCountry: false,
    sortBy: 'quality'
};

let recommendationSettings = {
    ...defaultRecommendationSettings,
    ...JSON.parse(localStorage.getItem("recommendationSettings") || '{}')
};

if (feeds.length === 0) {
    showPlaceholder();
}

// Убираем сдвиг меню при прокрутке - обработчик отключен

const preloader = document.getElementById('preloader');

function togglePreloader(show) {
    preloader.classList.toggle('active', show);
}

function hidePreloader() {
    preloader.classList.remove("active");
}

function updateCategorySelect() {
    categorySelect.innerHTML = `<option value="">${t('all_categories', 'Все категории')}</option>`;
    categories.forEach((category) => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
}

function addCategory() {
    const newCategory = prompt(t('enter_category_name', 'Введите название новой категории:'));
    if (
        newCategory &&
        newCategory.trim() &&
        !categories.includes(newCategory.trim())
    ) {
        categories.push(newCategory.trim());
        localStorage.setItem("categories", JSON.stringify(categories));
        updateCategorySelect();
        showTranslatedNotification('category_added', 'success');
    }
}

// Функции для работы с рекомендациями
function showRecommendations() {
    if (!recommendationSettings.enabled) return;

    const modal = document.getElementById('recommendationsModal');
    if (!modal) {
        createRecommendationsModal();
    }

    updateRecommendationsContent();
    document.getElementById('recommendationsModal').style.display = 'flex';
    setTimeout(() => document.getElementById('recommendationsModal').classList.add('visible'), 10);
}

function createRecommendationsModal() {
    const modal = document.createElement('div');
    modal.id = 'recommendationsModal';
    modal.className = 'share-modal';

    const translation = translations[currentLanguage] || translations['ru'];

    modal.innerHTML = `
        <div class="share-modal-close-overlay">
            <button class="close-btn focus-ring" onclick="closeRecommendationsModal()" aria-label="${translation.close_recommendations || 'Закрыть рекомендации'}">×</button>
        </div>
        <div class="share-modal-content recommendations-content">
            <div class="recommendations-header">
                <h3>🌟 ${translation.recommended_rss_feeds || 'Рекомендуемые RSS ленты'}</h3>
                <p>${translation.recommendations_description || 'Выберите качественные источники новостей по интересующим вас темам'}</p>
            </div>
            <div class="recommendations-filters">
                <button class="filter-btn active" data-category="all">${translation.all_categories || 'Все'}</button>
                ${Object.keys(getLocalizedRecommendedFeeds()).map(cat =>
        `<button class="filter-btn" data-category="${cat}">${cat}</button>`
    ).join('')}
            </div>
            <div id="recommendationsContent" class="recommendations-list"></div>
            <div class="recommendations-footer">
                <button class="settings-btn" onclick="showRecommendationSettings()">⚙️ ${translation.settings || 'Настройки'}</button>
                <button class="stats-btn" onclick="showRecommendationStatsModal()">📊 ${translation.statistics || 'Статистика'}</button>
                <button class="export-btn" onclick="showExportModal()">📤 ${translation.export || 'Экспорт'}</button>
                <button class="close-recommendations-btn" onclick="closeRecommendationsModal()">${translation.close || 'Закрыть'}</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Добавляем обработчики для фильтров
    modal.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            modal.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            updateRecommendationsContent(e.target.dataset.category);
        });
    });

    // Закрытие по клику вне модала
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeRecommendationsModal();
    });
}

function updateRecommendationsContent(filterCategory = 'all') {
    const container = document.getElementById('recommendationsContent');
    if (!container) return;

    const translation = translations[currentLanguage] || translations['ru'];
    const localizedFeeds = getLocalizedRecommendedFeeds();
    let feedsToShow = [];

    if (filterCategory === 'all') {
        // Показываем все локализованные ленты
        Object.values(localizedFeeds).forEach(categoryFeeds => {
            feedsToShow.push(...categoryFeeds);
        });
    } else {
        // Показываем ленты конкретной категории
        feedsToShow = localizedFeeds[filterCategory] || [];
    }

    // Применяем фильтры
    feedsToShow = feedsToShow.filter(feed => {
        // Фильтр по качеству
        if (feed.quality < recommendationSettings.minQuality) return false;

        // Фильтр по языкам
        if (recommendationSettings.preferredLanguages.length > 0 &&
            !recommendationSettings.preferredLanguages.includes(feed.language)) return false;

        // Фильтр по странам
        if (recommendationSettings.preferredCountries.length > 0 &&
            !recommendationSettings.preferredCountries.includes(feed.country)) return false;

        return true;
    });

    // Сортировка
    feedsToShow.sort((a, b) => {
        switch (recommendationSettings.sortBy) {
            case 'quality':
                return b.quality - a.quality;
            case 'name':
                return a.name.localeCompare(b.name);
            case 'country':
                return a.country.localeCompare(b.country);
            default:
                return b.quality - a.quality;
        }
    });

    // Ограничиваем количество рекомендаций
    feedsToShow = feedsToShow.slice(0, recommendationSettings.maxRecommendations * 2);

    // Группировка по странам если включена
    if (recommendationSettings.groupByCountry && filterCategory === 'all') {
        const groupedFeeds = {};
        feedsToShow.forEach(feed => {
            if (!groupedFeeds[feed.country]) {
                groupedFeeds[feed.country] = [];
            }
            groupedFeeds[feed.country].push(feed);
        });

        container.innerHTML = Object.entries(groupedFeeds).map(([country, countryFeeds]) => `
            <div class="country-group">
                <h4 class="country-header">${country}</h4>
                <div class="country-feeds">
                    ${countryFeeds.map(feed => createFeedCard(feed, filterCategory)).join('')}
                </div>
            </div>
        `).join('');
    } else {
        container.innerHTML = feedsToShow.map(feed => createFeedCard(feed, filterCategory)).join('');
    }

    if (feedsToShow.length === 0) {
        container.innerHTML = `<div class="no-recommendations">${t('no_recommendations', 'Нет рекомендаций для выбранных фильтров')}</div>`;
    }
}

function createFeedCard(feed, filterCategory = 'all') {
    const isAdded = feeds.includes(feed.url);
    const qualityStars = '★'.repeat(Math.floor(feed.quality / 2)) + '☆'.repeat(5 - Math.floor(feed.quality / 2));

    // Определяем категорию для добавления
    let categoryToAdd = 'Общее';
    if (filterCategory !== 'all') {
        categoryToAdd = filterCategory;
    } else {
        // Ищем категорию в RECOMMENDED_FEEDS
        Object.entries(RECOMMENDED_FEEDS).forEach(([category, feeds]) => {
            if (feeds.some(f => f.url === feed.url)) {
                categoryToAdd = category;
            }
        });
    }

    return `
        <div class="recommendation-item ${isAdded ? 'added' : ''}" data-quality="${feed.quality}">
            <div class="recommendation-info">
                <div class="recommendation-header">
                    <h4>${feed.name}</h4>
                    <div class="recommendation-badges">
                        ${recommendationSettings.showCountryFlags ? `<span class="country-badge">${feed.country}</span>` : ''}
                        <span class="quality-badge" title="${t('quality', 'Качество')}: ${feed.quality}/10">${qualityStars}</span>
                        <span class="language-badge">${feed.language.toUpperCase()}</span>
                    </div>
                </div>
                <p class="recommendation-description">${feed.description}</p>
                <div class="recommendation-meta">
                    <span class="recommendation-domain">${feed.domain}</span>
                    <span class="recommendation-quality">${t('quality', 'Качество')}: ${feed.quality}/10</span>
                </div>
            </div>
            <div class="recommendation-actions">
                ${isAdded ?
            `<button class="added-btn" disabled>✓ ${t('added', 'Добавлено')}</button>` :
            `<button class="add-recommendation-btn" onclick="addRecommendedFeed('${feed.url}', '${feed.name}', '${categoryToAdd}')">+ ${t('add_feed', 'Добавить')}</button>`
        }
            </div>
        </div>
    `;
}

async function addRecommendedFeed(url, name, category) {
    if (feeds.includes(url)) return;

    try {
        // Добавляем категорию если её нет
        if (!categories.includes(category)) {
            categories.push(category);
            localStorage.setItem("categories", JSON.stringify(categories));
            updateCategorySelect();
        }

        feeds.push(url);
        feedNames[url] = name;
        feedCategories[url] = category;

        localStorage.setItem("rssFeeds", JSON.stringify(feeds));
        localStorage.setItem("feedNames", JSON.stringify(feedNames));
        localStorage.setItem("feedCategories", JSON.stringify(feedCategories));

        updateTabs();
        updateRecommendationsContent(document.querySelector('.filter-btn.active')?.dataset.category);

        // Показываем уведомление
        showNotification(`Лента "${name}" добавлена в категорию "${category}"`);

    } catch (error) {
        console.error('Ошибка добавления рекомендованной ленты:', error);
        showNotification('Ошибка при добавлении ленты', 'error');
    }
}

function showRecommendationSettings() {
    const settingsModal = document.createElement('div');
    settingsModal.className = 'share-modal';
    const translation = translations[currentLanguage] || translations['ru'];

    settingsModal.innerHTML = `
        <div class="share-modal-close-overlay">
            <button class="close-btn focus-ring" onclick="this.parentElement.parentElement.remove()" aria-label="${t('close_settings', 'Закрыть настройки')}">×</button>
        </div>
        <div class="share-modal-content settings-content">
            <h3>⚙️ ${t('recommendation_settings', 'Настройки рекомендаций')}</h3>
            <div class="settings-group">
                <label class="settings-item">
                    <input type="checkbox" id="enableRecommendations" ${recommendationSettings.enabled ? 'checked' : ''}>
                    <span>${t('enable_recommendations', 'Включить рекомендации')}</span>
                </label>
                <label class="settings-item">
                    <input type="checkbox" id="showOnStartup" ${recommendationSettings.showOnStartup ? 'checked' : ''}>
                    <span>${t('show_on_startup', 'Показывать при запуске')}</span>
                </label>
            </div>
            <div class="settings-group">
                <label>${t('max_recommendations', 'Максимум рекомендаций')}:</label>
                <input type="range" id="maxRecommendations" min="3" max="20" value="${recommendationSettings.maxRecommendations}" 
                       oninput="document.getElementById('maxValue').textContent = this.value">
                <span id="maxValue">${recommendationSettings.maxRecommendations}</span>
            </div>
            <div class="settings-group">
                <label>${t('min_quality', 'Минимальное качество')}:</label>
                <input type="range" id="minQuality" min="1" max="10" value="${recommendationSettings.minQuality}" 
                       oninput="document.getElementById('qualityValue').textContent = this.value">
                <span id="qualityValue">${recommendationSettings.minQuality}</span>/10
            </div>
            <div class="settings-group">
                <label>${t('sort_by', 'Сортировка')}:</label>
                <select id="sortBy">
                    <option value="quality" ${recommendationSettings.sortBy === 'quality' ? 'selected' : ''}>${t('sort_by_quality', 'По качеству')}</option>
                    <option value="name" ${recommendationSettings.sortBy === 'name' ? 'selected' : ''}>${t('sort_by_name', 'По названию')}</option>
                    <option value="country" ${recommendationSettings.sortBy === 'country' ? 'selected' : ''}>${t('sort_by_country', 'По стране')}</option>
                </select>
            </div>
            <div class="settings-group">
                <label class="settings-item">
                    <input type="checkbox" id="showCountryFlags" ${recommendationSettings.showCountryFlags ? 'checked' : ''}>
                    <span>${t('show_country_flags', 'Показывать флаги стран')}</span>
                </label>
                <label class="settings-item">
                    <input type="checkbox" id="groupByCountry" ${recommendationSettings.groupByCountry ? 'checked' : ''}>
                    <span>${t('group_by_country', 'Группировать по странам')}</span>
                </label>
            </div>
            <div class="settings-group">
                <label>${t('preferred_languages', 'Предпочитаемые языки')}:</label>
                <div class="language-checkboxes">
                    <label class="settings-item">
                        <input type="checkbox" class="language-checkbox" value="ru" 
                               ${recommendationSettings.preferredLanguages.includes('ru') ? 'checked' : ''}>
                        <span>🇷🇺 ${getLanguageName('ru')}</span>
                    </label>
                    <label class="settings-item">
                        <input type="checkbox" class="language-checkbox" value="en" 
                               ${recommendationSettings.preferredLanguages.includes('en') ? 'checked' : ''}>
                        <span>🇺🇸 ${getLanguageName('en')}</span>
                    </label>
                    <label class="settings-item">
                        <input type="checkbox" class="language-checkbox" value="uk" 
                               ${recommendationSettings.preferredLanguages.includes('uk') ? 'checked' : ''}>
                        <span>🇺🇦 ${getLanguageName('uk')}</span>
                    </label>
                    <label class="settings-item">
                        <input type="checkbox" class="language-checkbox" value="pl" 
                               ${recommendationSettings.preferredLanguages.includes('pl') ? 'checked' : ''}>
                        <span>🇵🇱 ${getLanguageName('pl')}</span>
                    </label>
                </div>
            </div>
            <div class="settings-group">
                <label>${t('categories_for_recommendations', 'Категории для рекомендаций')}:</label>
                <div class="category-checkboxes">
                    ${Object.keys(getLocalizedRecommendedFeeds()).map(cat => `
                        <label class="settings-item">
                            <input type="checkbox" class="category-checkbox" value="${cat}" 
                                   ${recommendationSettings.categories.includes(cat) ? 'checked' : ''}>
                            <span>${cat}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
            <div class="settings-actions">
                <button onclick="saveRecommendationSettings(); this.parentElement.parentElement.parentElement.remove()">
                    ${t('save', 'Сохранить')}
                </button>
                <button onclick="resetRecommendationSettings(); this.parentElement.parentElement.parentElement.remove()">
                    ${t('reset', 'Сбросить')}
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(settingsModal);
    settingsModal.style.display = 'flex';
    setTimeout(() => settingsModal.classList.add('visible'), 10);
}

function saveRecommendationSettings() {
    recommendationSettings.enabled = document.getElementById('enableRecommendations').checked;
    recommendationSettings.showOnStartup = document.getElementById('showOnStartup').checked;
    recommendationSettings.maxRecommendations = parseInt(document.getElementById('maxRecommendations').value);
    recommendationSettings.minQuality = parseInt(document.getElementById('minQuality').value);
    recommendationSettings.sortBy = document.getElementById('sortBy').value;
    recommendationSettings.showCountryFlags = document.getElementById('showCountryFlags').checked;
    recommendationSettings.groupByCountry = document.getElementById('groupByCountry').checked;

    const selectedCategories = Array.from(document.querySelectorAll('.category-checkbox:checked'))
        .map(cb => cb.value);
    recommendationSettings.categories = selectedCategories;

    const selectedLanguages = Array.from(document.querySelectorAll('.language-checkbox:checked'))
        .map(cb => cb.value);
    recommendationSettings.preferredLanguages = selectedLanguages;

    localStorage.setItem("recommendationSettings", JSON.stringify(recommendationSettings));
    showTranslatedNotification('settings_saved', 'success');

    // Обновляем отображение рекомендаций
    updateRecommendationsContent();
}

function resetRecommendationSettings() {
    recommendationSettings = { ...defaultRecommendationSettings };
    localStorage.setItem("recommendationSettings", JSON.stringify(recommendationSettings));
    showTranslatedNotification('settings_reset', 'success');
}

function closeRecommendationsModal() {
    const modal = document.getElementById('recommendationsModal');
    if (modal) {
        modal.classList.remove('visible');
        setTimeout(() => modal.remove(), 300);
    }
}

// Функция уведомлений
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#ff6b6b' : '#51cf66'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 3000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

async function addFeed() {
    const url = rssUrlInput.value.trim();
    if (!url || feeds.includes(url)) return;

    // Валидация и нормализация URL
    const normalizedUrl = normalizeRSSUrl(url);
    if (!normalizedUrl) {
        alert(t('enter_valid_rss_url', 'Пожалуйста, введите корректный URL RSS ленты'));
        return;
    }

    togglePreloader(true);

    try {
        // Проверяем доступность ленты
        const testResponse = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(normalizedUrl)}`);
        if (!testResponse.ok) {
            throw new Error('Лента недоступна');
        }

        const xmlText = await testResponse.text();
        const items = parseRSSFeed(xmlText);

        if (items.length === 0) {
            throw new Error('Лента не содержит элементов или имеет неверный формат');
        }

        // Определяем название ленты из XML
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        const feedTitle = xmlDoc.querySelector('channel > title, feed > title')?.textContent?.trim()
            || normalizedUrl.split("/")[2]
            || `Лента ${feeds.length + 1}`;

        feeds.push(normalizedUrl);
        feedNames[normalizedUrl] = feedTitle;
        feedCategories[normalizedUrl] = categorySelect.value || "Без категории";

        // Кэшируем загруженные данные
        feedCache.set(normalizedUrl, {
            items: items,
            timestamp: Date.now()
        });

        localStorage.setItem("rssFeeds", JSON.stringify(feeds));
        localStorage.setItem("feedNames", JSON.stringify(feedNames));
        localStorage.setItem("feedCategories", JSON.stringify(feedCategories));

        updateTabs();
        switchFeed(feeds.length - 1);
        rssUrlInput.value = "";

        console.log(`Добавлена лента: ${feedTitle} (${items.length} элементов)`);

    } catch (error) {
        alert(t('feed_add_error', 'Ошибка добавления ленты') + `: ${error.message}`);
        console.error('Add feed error:', error);
    } finally {
        togglePreloader(false);
    }
}

// Нормализация и валидация RSS URL
function normalizeRSSUrl(url) {
    try {
        // Добавляем протокол если отсутствует
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        const urlObj = new URL(url);

        // Проверяем популярные RSS пути
        const commonRSSPaths = [
            '/rss',
            '/rss.xml',
            '/feed',
            '/feed.xml',
            '/feeds/all.atom.xml',
            '/atom.xml',
            '/index.xml'
        ];

        // Если URL не содержит явного RSS пути, пробуем добавить
        if (!url.includes('rss') && !url.includes('feed') && !url.includes('atom') && !url.includes('.xml')) {
            // Возвращаем исходный URL, но позже можем попробовать автоопределение
            return url;
        }

        return url;
    } catch (e) {
        return null;
    }
}

// Автоопределение RSS ленты на сайте
async function discoverRSSFeeds(baseUrl) {
    try {
        const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(baseUrl)}`);
        const data = await response.json();
        const html = data.contents;

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Ищем RSS ссылки в HTML
        const rssLinks = [];
        const linkElements = doc.querySelectorAll('link[type*="rss"], link[type*="atom"], link[href*="rss"], link[href*="feed"]');

        linkElements.forEach(link => {
            const href = link.getAttribute('href');
            if (href) {
                const absoluteUrl = new URL(href, baseUrl).href;
                rssLinks.push({
                    url: absoluteUrl,
                    title: link.getAttribute('title') || 'RSS Feed'
                });
            }
        });

        return rssLinks;
    } catch (error) {
        console.warn('RSS discovery failed:', error);
        return [];
    }
}

function updateTabs() {
    tabs.innerHTML = "";
    const filteredFeeds = feeds.filter(
        (feed) =>
            categorySelect.value === "" ||
            feedCategories[feed] === categorySelect.value
    );

    filteredFeeds.forEach((feed, index) => {
        const tab = document.createElement("button");
        tab.className = `tab focus-ring ${index === currentFeedIndex ? "active" : ""}`;
        tab.setAttribute('role', 'tab');
        tab.setAttribute('aria-selected', index === currentFeedIndex ? 'true' : 'false');
        tab.setAttribute('aria-label', `RSS лента: ${feedNames[feed]}`);
        tab.setAttribute('tabindex', index === currentFeedIndex ? '0' : '-1');

        tab.innerHTML = `
            <span class="tab-name">${feedNames[feed]}</span>
            <button class="edit-icon focus-ring" onclick="editFeedName(event, '${feed}')" aria-label="${t('edit_feed_name', 'Редактировать название ленты')}" tabindex="-1">✏️</button>
        `;

        tab.onclick = (e) => {
            if (!e.target.classList.contains("edit-icon")) {
                // Обновляем ARIA атрибуты для всех вкладок
                document.querySelectorAll('.tab').forEach((t, i) => {
                    t.setAttribute('aria-selected', i === index ? 'true' : 'false');
                    t.setAttribute('tabindex', i === index ? '0' : '-1');
                });
                switchFeed(index);
            }
        };

        // Поддержка клавиатурной навигации для вкладок
        tab.onkeydown = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                tab.click();
            }
        };

        tabs.appendChild(tab);
    });

    const manageButton = document.createElement("button");
    manageButton.className = "manage-icon focus-ring";
    manageButton.textContent = "⚙️";
    manageButton.setAttribute('aria-label', 'Управление лентами');
    manageButton.onclick = showFeedManageModal;
    tabs.appendChild(manageButton);

    // Обновляем кнопки прокрутки после изменения вкладок
    setTimeout(updateScrollButtons, 100);
}

function editFeedName(event, feedUrl) {
    event.stopPropagation();
    const newName = prompt(t('enter_new_feed_name', 'Введите новое название ленты') + ":", feedNames[feedUrl]);
    if (newName && newName.trim()) {
        feedNames[feedUrl] = newName.trim();
        localStorage.setItem("feedNames", JSON.stringify(feedNames));
        updateTabs();
    }
}

function switchFeed(index) {
    currentFeedIndex = index;
    updateTabs();
    loadCurrentFeed();
}

// Улучшенная функция загрузки с кэшированием и поддержкой всех типов RSS
async function loadFeed(url, useCache = true) {
    // Проверяем кэш
    if (useCache && feedCache.has(url)) {
        const cached = feedCache.get(url);
        if (Date.now() - cached.timestamp < CACHE_DURATION) {
            displayFeedItems(cached.items);
            return;
        }
    }

    togglePreloader(true);
    try {
        // Используем несколько прокси для надежности
        const proxies = [
            `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
            `https://cors-anywhere.herokuapp.com/${url}`,
            `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
        ];

        let response;
        let xmlText;

        // Пробуем разные прокси
        for (const proxy of proxies) {
            try {
                response = await fetch(proxy, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (compatible; RSS Reader)'
                    }
                });
                if (response.ok) {
                    xmlText = await response.text();
                    break;
                }
            } catch (e) {
                continue;
            }
        }

        if (!xmlText) {
            throw new Error('Не удалось загрузить ленту');
        }

        const items = parseRSSFeed(xmlText);

        // Кэшируем результат
        feedCache.set(url, {
            items: items,
            timestamp: Date.now()
        });

        displayFeedItems(items);

    } catch (error) {
        feedGrid.innerHTML = `<p>${t('feed_load_error', 'Ошибка загрузки RSS-ленты. Попробуйте позже.')}</p>`;
        console.error('Feed loading error:', error);
    } finally {
        togglePreloader(false);
    }
}

// Универсальный парсер для всех типов RSS и Atom
function parseRSSFeed(xmlText) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

    // Проверяем на ошибки парсинга
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
        throw new Error('Ошибка парсинга XML');
    }

    let items = [];

    // RSS 2.0 и RSS 1.0
    let rssItems = xmlDoc.querySelectorAll('item');
    if (rssItems.length > 0) {
        items = Array.from(rssItems).map(item => parseRSSItem(item));
    }

    // Atom
    let atomEntries = xmlDoc.querySelectorAll('entry');
    if (atomEntries.length > 0) {
        items = Array.from(atomEntries).map(entry => parseAtomEntry(entry));
    }

    return items;
}

// Парсер для RSS элементов
function parseRSSItem(item) {
    const getTextContent = (selector) => {
        const element = item.querySelector(selector);
        return element ? element.textContent.trim() : '';
    };

    const getAttributeValue = (selector, attribute) => {
        const element = item.querySelector(selector);
        return element ? element.getAttribute(attribute) : '';
    };

    const title = getTextContent('title') || t('no_title', 'Без заголовка');
    const description = getTextContent('description') || getTextContent('summary') || '';

    // Пытаемся получить полный контент из разных источников
    let content = getTextContent('content\\:encoded') ||
        getTextContent('content') ||
        getTextContent('fulltext') ||
        getTextContent('body') ||
        description;

    // Если контент очень короткий, пытаемся найти дополнительный
    if (content.length < 100) {
        const additionalContent = getTextContent('excerpt') ||
            getTextContent('summary') ||
            getTextContent('abstract');
        if (additionalContent && additionalContent.length > content.length) {
            content = additionalContent;
        }
    }

    const link = getTextContent('link') || getTextContent('guid');
    const pubDate = getTextContent('pubDate') || getTextContent('dc\\:date') || getTextContent('published');
    const author = getTextContent('author') || getTextContent('dc\\:creator') || getTextContent('creator');

    // Извлекаем категории
    const categories = Array.from(item.querySelectorAll('category')).map(cat => cat.textContent.trim());

    // Медиа контент
    const enclosure = getAttributeValue('enclosure', 'url');
    const mediaType = getAttributeValue('enclosure', 'type');
    const mediaThumbnail = getAttributeValue('media\\:thumbnail', 'url');
    const mediaContent = getAttributeValue('media\\:content', 'url');

    // Изображения из контента
    let imageUrl = enclosure || mediaThumbnail || mediaContent;
    if (!imageUrl && content) {
        const imgMatch = content.match(/<img[^>]+src="([^"]+)"/i);
        if (imgMatch) imageUrl = imgMatch[1];
    }

    return {
        title,
        description: stripHtml(description),
        content: content,
        link,
        pubDate,
        author,
        categories,
        enclosure: imageUrl,
        mediaType: mediaType || (imageUrl ? 'image' : ''),
        isVideo: mediaType && mediaType.includes('video')
    };
}

// Парсер для Atom элементов
function parseAtomEntry(entry) {
    const getTextContent = (selector) => {
        const element = entry.querySelector(selector);
        return element ? element.textContent.trim() : '';
    };

    const getAttributeValue = (selector, attribute) => {
        const element = entry.querySelector(selector);
        return element ? element.getAttribute(attribute) : '';
    };

    const title = getTextContent('title') || t('no_title', 'Без заголовка');
    const summary = getTextContent('summary') || '';
    let content = getTextContent('content') || summary;

    // Для Atom пытаемся получить более полный контент
    if (content.length < 100) {
        const additionalContent = getTextContent('summary') || getTextContent('subtitle');
        if (additionalContent && additionalContent.length > content.length) {
            content = additionalContent;
        }
    }

    const link = getAttributeValue('link[rel="alternate"]', 'href') || getAttributeValue('link', 'href');
    const pubDate = getTextContent('published') || getTextContent('updated');
    const author = getTextContent('author name');

    // Извлекаем категории из Atom
    const categories = Array.from(entry.querySelectorAll('category')).map(cat =>
        cat.getAttribute('term') || cat.textContent.trim()
    ).filter(Boolean);

    // Медиа контент в Atom
    let imageUrl = getAttributeValue('link[rel="enclosure"]', 'href');
    if (!imageUrl && content) {
        const imgMatch = content.match(/<img[^>]+src="([^"]+)"/i);
        if (imgMatch) imageUrl = imgMatch[1];
    }

    return {
        title,
        description: stripHtml(summary),
        content: content,
        link,
        pubDate,
        author,
        categories,
        enclosure: imageUrl,
        mediaType: imageUrl ? 'image' : '',
        isVideo: false
    };
}

// Функция для отображения элементов ленты
function displayFeedItems(items) {
    feedGrid.innerHTML = '';

    if (items.length === 0) {
        feedGrid.innerHTML = `<p>${t('no_articles', 'Нет элементов в этой ленте')}</p>`;
        return;
    }

    // Прогрессивная загрузка - показываем элементы по частям
    const batchSize = 5;
    let currentBatch = 0;

    function renderBatch() {
        const start = currentBatch * batchSize;
        const end = Math.min(start + batchSize, items.length);

        for (let i = start; i < end; i++) {
            const item = items[i];
            const feedItem = createFeedItemElement(item, i - start);
            feedGrid.appendChild(feedItem);
        }

        currentBatch++;

        // Если есть еще элементы, загружаем следующую партию
        if (end < items.length) {
            setTimeout(renderBatch, 100);
        }
    }

    renderBatch();
}

// Создание элемента ленты
function createFeedItemElement(item, index) {
    const feedItem = document.createElement('div');
    feedItem.className = 'feed-item';
    feedItem.setAttribute('tabindex', '0');
    feedItem.setAttribute('role', 'article');
    feedItem.setAttribute('aria-label', `Статья: ${item.title}`);

    const imageHtml = item.enclosure && !item.isVideo
        ? `<img src="${item.enclosure}" alt="Изображение для статьи: ${item.title}" loading="lazy" onerror="this.style.display='none'">`
        : '';

    const videoHtml = item.enclosure && item.isVideo
        ? `<video controls src="${item.enclosure}" alt="Видео: ${item.title}" preload="metadata"></video>`
        : '';

    const dateHtml = item.pubDate
        ? `<div class="item-date" title="${t('publication_date', 'Дата публикации')}" data-date="${item.pubDate}">${formatDate(item.pubDate)}</div>`
        : '';

    const authorHtml = item.author
        ? `<div class="item-author" title="${t('article_author', 'Автор статьи')}">${t('author', 'Автор')}: ${item.author}</div>`
        : '';

    // Используем улучшенное описание для карточки
    const enhancedDescription = enhanceNewsCardContent(item.description, 200);

    feedItem.innerHTML = `
        ${imageHtml}
        ${videoHtml}
        <div class="item-content">
            <h2>${item.title}</h2>
            <p>${enhancedDescription}</p>
            <div class="item-meta">
                ${dateHtml}
                ${authorHtml}
            </div>
        </div>
    `;

    // Обработчики событий
    feedItem.onclick = () => showDetails(item);
    feedItem.onkeydown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            showDetails(item);
        }
    };

    // Анимация появления с задержкой
    feedItem.style.setProperty('--delay', `${index * 0.1}s`);
    setTimeout(() => feedItem.classList.add('visible'), index * 50);

    return feedItem;
}

// Вспомогательные функции
function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

function formatDate(dateString, lang = currentLanguage) {
    try {
        const date = new Date(dateString);

        // Локали для разных языков
        const locales = {
            'ru': 'ru-RU',
            'en': 'en-US',
            'uk': 'uk-UA',
            'pl': 'pl-PL',
            'cs': 'cs-CZ',
            'bg': 'bg-BG',
            'sr': 'sr-RS'
        };

        const locale = locales[lang] || 'ru-RU';

        return date.toLocaleDateString(locale, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return dateString;
    }
}

function loadCurrentFeed() {
    const filteredFeeds = feeds.filter(
        (feed) =>
            categorySelect.value === "" ||
            feedCategories[feed] === categorySelect.value
    );
    if (filteredFeeds.length > 0 && currentFeedIndex < filteredFeeds.length) {
        loadFeed(filteredFeeds[currentFeedIndex]);

        // Предзагрузка соседних лент для быстрого переключения
        preloadAdjacentFeeds(filteredFeeds, currentFeedIndex);
    } else if (feeds.length === 0) {
        showPlaceholder();
    } else {
        feedGrid.innerHTML = `<p>${t('no_feeds_in_category', 'Нет лент в этой категории')}</p>`;
    }
}

// Предзагрузка соседних лент
async function preloadAdjacentFeeds(filteredFeeds, currentIndex) {
    const preloadPromises = [];

    // Предзагружаем предыдущую и следующую ленты
    const indicesToPreload = [currentIndex - 1, currentIndex + 1].filter(
        index => index >= 0 && index < filteredFeeds.length && index !== currentIndex
    );

    for (const index of indicesToPreload) {
        const url = filteredFeeds[index];
        if (!feedCache.has(url) || Date.now() - feedCache.get(url).timestamp > CACHE_DURATION) {
            preloadPromises.push(preloadFeed(url));
        }
    }

    // Выполняем предзагрузку в фоне
    if (preloadPromises.length > 0) {
        Promise.allSettled(preloadPromises).catch(console.error);
    }
}

// Фоновая предзагрузка ленты
async function preloadFeed(url) {
    try {
        const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RSS Reader)' }
        });

        if (response.ok) {
            const xmlText = await response.text();
            const items = parseRSSFeed(xmlText);

            feedCache.set(url, {
                items: items,
                timestamp: Date.now()
            });
        }
    } catch (error) {
        console.warn('Preload failed for:', url, error);
    }
}

// Массовая загрузка всех лент (для обновления)
async function refreshAllFeeds() {
    if (isLoading) return;

    isLoading = true;
    togglePreloader(true);

    try {
        const refreshPromises = feeds.map(async (url) => {
            try {
                await preloadFeed(url);
                return { url, success: true };
            } catch (error) {
                return { url, success: false, error };
            }
        });

        const results = await Promise.allSettled(refreshPromises);
        const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;

        console.log(`Обновлено ${successCount} из ${feeds.length} лент`);

        // Перезагружаем текущую ленту
        loadCurrentFeed();

    } catch (error) {
        console.error('Ошибка массового обновления:', error);
    } finally {
        isLoading = false;
        togglePreloader(false);
    }
}

function showPlaceholder() {
    feedGrid.innerHTML = `
        <div class="placeholder">
            <svg width="400" height="400" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clip-path="url(#clip0_17_56)">
                <mask id="mask0_17_56" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="0" y="0" width="400"
                    height="400">
                    <path d="M400 0H0V400H400V0Z" fill="white" />
                </mask>
                <g mask="url(#mask0_17_56)">
                    <g filter="url(#filter0_d_17_56)">
                        <path
                            d="M345 50H75C72.2386 50 70 52.2386 70 55V325C70 327.761 72.2386 330 75 330H345C347.761 330 350 327.761 350 325V55C350 52.2386 347.761 50 345 50Z"
                            fill="url(#paint0_radial_17_56)" />
                    </g>
                    <g filter="url(#filter1_d_17_56)">
                        <path
                            d="M280 115H65C62.2386 115 60 117.239 60 120V335C60 337.761 62.2386 340 65 340H280C282.761 340 285 337.761 285 335V120C285 117.239 282.761 115 280 115Z"
                            fill="url(#paint1_radial_17_56)" />
                    </g>
                    <g filter="url(#filter2_d_17_56)">
                        <path
                            d="M215 180H55C52.2386 180 50 182.239 50 185V345C50 347.761 52.2386 350 55 350H215C217.761 350 220 347.761 220 345V185C220 182.239 217.761 180 215 180Z"
                            fill="url(#paint2_radial_17_56)" />
                    </g>
                    <g filter="url(#filter3_d_17_56)">
                        <path
                            d="M100.102 314V209.273H169.443V227.528H122.244V252.483H164.841V270.739H122.244V314H100.102Z"
                            fill="white" />
                    </g>
                </g>
            </g>
            <defs>
                <filter id="filter0_d_17_56" x="45" y="25" width="330" height="330" filterUnits="userSpaceOnUse"
                    color-interpolation-filters="sRGB">
                    <feFlood flood-opacity="0" result="BackgroundImageFix" />
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                        result="hardAlpha" />
                    <feOffset />
                    <feGaussianBlur stdDeviation="12.5" />
                    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0" />
                    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_17_56" />
                    <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_17_56" result="shape" />
                </filter>
                <filter id="filter1_d_17_56" x="35" y="90" width="275" height="275" filterUnits="userSpaceOnUse"
                    color-interpolation-filters="sRGB">
                    <feFlood flood-opacity="0" result="BackgroundImageFix" />
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                        result="hardAlpha" />
                    <feOffset />
                    <feGaussianBlur stdDeviation="12.5" />
                    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0" />
                    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_17_56" />
                    <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_17_56" result="shape" />
                </filter>
                <filter id="filter2_d_17_56" x="25" y="155" width="220" height="220" filterUnits="userSpaceOnUse"
                    color-interpolation-filters="sRGB">
                    <feFlood flood-opacity="0" result="BackgroundImageFix" />
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                        result="hardAlpha" />
                    <feOffset />
                    <feGaussianBlur stdDeviation="12.5" />
                    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0" />
                    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_17_56" />
                    <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_17_56" result="shape" />
                </filter>
                <filter id="filter3_d_17_56" x="90.1023" y="202.273" width="89.3409" height="124.727"
                    filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                    <feFlood flood-opacity="0" result="BackgroundImageFix" />
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                        result="hardAlpha" />
                    <feOffset dy="3" />
                    <feGaussianBlur stdDeviation="5" />
                    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.161 0" />
                    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_17_56" />
                    <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_17_56" result="shape" />
                </filter>
                <radialGradient id="paint0_radial_17_56" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse"
                    gradientTransform="translate(181.857 171.911) rotate(-45.2431) scale(401.463 231.962)">
                    <stop stop-color="#179C5A" />
                    <stop offset="1" stop-color="#137745" />
                </radialGradient>
                <radialGradient id="paint1_radial_17_56" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse"
                    gradientTransform="translate(147.546 210.765) rotate(-45.4052) scale(321.26 177.216)">
                    <stop stop-color="#2A9761" />
                    <stop offset="1" stop-color="#179C5A" />
                </radialGradient>
                <radialGradient id="paint2_radial_17_56" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse"
                    gradientTransform="translate(168.616 326.044) rotate(-46.9051) scale(199.009 190.559)">
                    <stop stop-color="#179C5A" />
                    <stop offset="1" stop-color="#33D183" />
                </radialGradient>
                <clipPath id="clip0_17_56">
                    <rect width="400" height="400" fill="white" />
                </clipPath>
            </defs>
        </svg>
            <h2>Fluent RSS Reader</h2>
            <p>Добро пожаловать в Fluent RSS Reader — ваш персональный агрегатор новостей! Добавляйте RSS-ленты, сортируйте их по категориям и наслаждайтесь удобным чтением. Мы создали этот проект, чтобы вы могли легко следить за любимыми источниками информации в одном месте.</p>
        </div>
    `;
}

if (feeds.length === 0) {
    showPlaceholder();
}

function showDetails(item) {
    currentItem = item;
    currentMode = "normal";
    updateModalContent();
    modal.style.display = "flex";
    setTimeout(() => modal.classList.add("visible"), 10);
    updateModeButtons();
}

// Улучшенная функция updateModalContent
function updateModalContent() {
    if (currentMode === 'normal') {
        const image = currentItem.enclosure && !currentItem.isVideo ? currentItem.enclosure : '';
        const video = currentItem.enclosure && currentItem.isVideo ? currentItem.enclosure : '';

        const dateHtml = currentItem.pubDate
            ? `<div class="modal-date" title="${t('publication_date', 'Дата публикации')}">📅 ${formatDate(currentItem.pubDate)}</div>`
            : '';

        const authorHtml = currentItem.author
            ? `<div class="modal-author" title="${t('article_author', 'Автор статьи')}">✍️ ${currentItem.author}</div>`
            : '';

        modalContent.innerHTML = `
            ${image ? `<img src="${image}" alt="Preview" loading="lazy">` : ''}
            ${video ? `<video controls src="${video}" alt="Video" preload="metadata"></video>` : ''}
            <div class="modal-header">
                <h1>${currentItem.title}</h1>
                <div class="modal-meta">
                    ${dateHtml}
                    ${authorHtml}
                </div>
            </div>
            <div class="modal-content-text">
                ${currentItem.content || currentItem.description}
            </div>
            <div class="modal-actions">
                <a href="${currentItem.link}" target="_blank" class="source-link">🔗 ${t('go_to_source', 'Перейти к источнику')}</a>
            </div>
        `;
    } else if (currentMode === 'web') {
        togglePreloader(true);
        modalContent.innerHTML = `
            <div class="iframe-container">
                <iframe src="${currentItem.link}" 
                        sandbox="allow-same-origin allow-scripts allow-forms allow-popups" 
                        onload="togglePreloader(false)"
                        onerror="handleIframeError()"></iframe>
            </div>
        `;
    }
}

// Обработка ошибок iframe
function handleIframeError() {
    togglePreloader(false);
    modalContent.innerHTML = `
        <div class="iframe-error">
            <h3>⚠️ ${t('page_load_error', 'Не удалось загрузить страницу')}</h3>
            <p>${t('embedding_not_allowed', 'Сайт не разрешает встраивание или недоступен.')}</p>
            <a href="${currentItem.link}" target="_blank" class="source-link">🔗 ${t('open_in_new_tab', 'Открыть в новой вкладке')}</a>
        </div>
    `;
}

// Функции для управления прелоадером веб-страницы
function showWebPreloader() {
    const webPreloader = document.getElementById("webPreloader");
    if (webPreloader) webPreloader.classList.add("active");
}

function hideWebPreloader() {
    const webPreloader = document.getElementById("webPreloader");
    if (webPreloader) webPreloader.classList.remove("active");
}

function switchMode(mode) {
    currentMode = mode;
    updateModalContent();
    updateModeButtons();
}

function updateModeButtons() {
    const buttons = document.querySelectorAll(".mode-btn");
    buttons.forEach((btn) => {
        btn.classList.toggle(
            "active",
            btn.textContent.toLowerCase() === currentMode
        );
    });
}

function showShareModal() {
    const link = currentItem.link;
    const title = currentItem.title;
    const description = currentItem.description || '';

    linkPreview.textContent = link;

    // Создаем улучшенное окно поделиться с категориями
    shareOptions.innerHTML = `
        <div class="share-section">
            <h4 class="share-section-title">Мессенджеры</h4>
            <div class="share-grid">
                <div class="share-option messenger" onclick="shareTo('whatsapp', '${link}')" title="WhatsApp">
                    <span class="share-icon">💬</span>
                    <span class="share-name">WhatsApp</span>
                </div>
                <div class="share-option messenger" onclick="shareTo('telegram', '${link}')" title="Telegram">
                    <span class="share-icon">✈️</span>
                    <span class="share-name">Telegram</span>
                </div>
                <div class="share-option messenger" onclick="shareTo('viber', '${link}')" title="Viber">
                    <span class="share-icon">📞</span>
                    <span class="share-name">Viber</span>
                </div>
            </div>
        </div>
        
        <div class="share-section">
            <h4 class="share-section-title">Социальные сети</h4>
            <div class="share-grid">
                <div class="share-option social" onclick="shareTo('vk', '${link}')" title="ВКонтакте">
                    <span class="share-icon">🌐</span>
                    <span class="share-name">ВКонтакте</span>
                </div>
                <div class="share-option social" onclick="shareTo('ok', '${link}')" title="Одноклассники">
                    <span class="share-icon">👥</span>
                    <span class="share-name">Одноклассники</span>
                </div>
                <div class="share-option social" onclick="shareTo('facebook', '${link}')" title="Facebook">
                    <span class="share-icon">📘</span>
                    <span class="share-name">Facebook</span>
                </div>
                <div class="share-option social" onclick="shareTo('x', '${link}')" title="X (Twitter)">
                    <span class="share-icon">🐦</span>
                    <span class="share-name">X</span>
                </div>
                <div class="share-option social" onclick="shareTo('linkedin', '${link}')" title="LinkedIn">
                    <span class="share-icon">💼</span>
                    <span class="share-name">LinkedIn</span>
                </div>
                <div class="share-option social" onclick="shareTo('reddit', '${link}')" title="Reddit">
                    <span class="share-icon">🤖</span>
                    <span class="share-name">Reddit</span>
                </div>
            </div>
        </div>
        
        <div class="share-section">
            <h4 class="share-section-title">Другие способы</h4>
            <div class="share-grid">
                <div class="share-option other" onclick="shareTo('email', '${link}')" title="Email">
                    <span class="share-icon">📧</span>
                    <span class="share-name">Email</span>
                </div>
                <div class="share-option other" onclick="shareTo('sms', '${link}')" title="SMS">
                    <span class="share-icon">📱</span>
                    <span class="share-name">SMS</span>
                </div>
                <div class="share-option other" onclick="copyLink()" title="Скопировать ссылку">
                    <span class="share-icon">📋</span>
                    <span class="share-name">Копировать</span>
                </div>
                <div class="share-option other" onclick="shareNative()" title="Поделиться через систему" id="nativeShare" style="display: none;">
                    <span class="share-icon">📤</span>
                    <span class="share-name">Поделиться</span>
                </div>
            </div>
        </div>
    `;

    // Показываем нативную кнопку поделиться если поддерживается
    if (navigator.share) {
        document.getElementById('nativeShare').style.display = 'flex';
    }

    shareModal.style.display = "flex";
    setTimeout(() => shareModal.classList.add("visible"), 10);
}

function shareTo(platform, link) {
    const title = currentItem.title;
    const description = currentItem.description || '';
    let shareUrl;

    switch (platform) {
        // Социальные сети
        case "vk":
            shareUrl = `https://vk.com/share.php?url=${encodeURIComponent(link)}&title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}`;
            break;
        case "ok":
            shareUrl = `https://connect.ok.ru/offer?url=${encodeURIComponent(link)}&title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}`;
            break;
        case "facebook":
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}&quote=${encodeURIComponent(title)}`;
            break;
        case "x":
            shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(link)}&text=${encodeURIComponent(title)}&hashtags=news`;
            break;
        case "linkedin":
            shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(description)}`;
            break;
        case "reddit":
            shareUrl = `https://reddit.com/submit?url=${encodeURIComponent(link)}&title=${encodeURIComponent(title)}`;
            break;

        // Мессенджеры
        case "whatsapp":
            shareUrl = `https://wa.me/?text=${encodeURIComponent(title + '\n\n' + link)}`;
            break;
        case "telegram":
            shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(title)}`;
            break;
        case "viber":
            shareUrl = `viber://forward?text=${encodeURIComponent(title + '\n' + link)}`;
            break;

        // Другие способы
        case "email":
            shareUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(description + '\n\nЧитать полностью: ' + link)}`;
            break;
        case "sms":
            shareUrl = `sms:?body=${encodeURIComponent(title + '\n' + link)}`;
            break;
    }

    if (shareUrl) {
        // Для некоторых протоколов используем location.href вместо window.open
        if (platform === 'viber' || platform === 'email' || platform === 'sms') {
            window.location.href = shareUrl;
        } else {
            window.open(shareUrl, "_blank", "width=600,height=400,scrollbars=yes,resizable=yes");
        }
    }

    closeShareModal();
}

function copyLink() {
    const link = currentItem.link;

    if (navigator.clipboard) {
        navigator.clipboard.writeText(link).then(() => {
            showNotification("Ссылка скопирована в буфер обмена!");
        }).catch(() => {
            // Fallback для старых браузеров
            fallbackCopyTextToClipboard(link);
        });
    } else {
        fallbackCopyTextToClipboard(link);
    }

    closeShareModal();
}

// Fallback функция для копирования в старых браузерах
function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        document.execCommand('copy');
        showNotification("Ссылка скопирована в буфер обмена!");
    } catch (err) {
        showNotification("Не удалось скопировать ссылку", "error");
    }

    document.body.removeChild(textArea);
}

// Нативное API поделиться
async function shareNative() {
    if (navigator.share) {
        try {
            await navigator.share({
                title: currentItem.title,
                text: currentItem.description || currentItem.title,
                url: currentItem.link
            });
            closeShareModal();
        } catch (err) {
            if (err.name !== 'AbortError') {
                showNotification("Ошибка при попытке поделиться", "error");
            }
        }
    } else {
        showNotification("Функция поделиться не поддерживается в этом браузере", "error");
    }
}

function showFeedManageModal() {
    const filteredFeeds = feeds.filter(
        (feed) =>
            categorySelect.value === "" ||
            feedCategories[feed] === categorySelect.value
    );
    feedManageOptions.innerHTML = filteredFeeds
        .map(
            (feed) => `
        <br>
        <div class="share-option">
            <span>${feedNames[feed]}</span>
            <div>
                <select onchange="changeFeedCategory('${feed}', this.value)">
                    ${categories
                    .map(
                        (cat) => `
                        <option value="${cat}" ${feedCategories[feed] === cat ? "selected" : ""
                            }>${cat}</option>
                    `
                    )
                    .join("")}
                </select>
                <span onclick="deleteFeed('${feed}')" style="margin-left: 10px;">🗑️</span>
                <span onclick="shareFeed('${feed}')" style="margin-left: 10px;">📤</span>
            </div>
        </div>
    `
        )
        .join("");
    feedManageModal.style.display = "flex";
    setTimeout(() => feedManageModal.classList.add("visible"), 10);
}

function changeFeedCategory(feedUrl, newCategory) {
    feedCategories[feedUrl] = newCategory;
    localStorage.setItem("feedCategories", JSON.stringify(feedCategories));
    updateTabs();
    loadCurrentFeed();
}

function deleteFeed(feedUrl) {
    if (confirm(t('confirm_delete_feed', 'Удалить ленту') + ` "${feedNames[feedUrl]}"?`)) {
        feeds = feeds.filter((f) => f !== feedUrl);
        delete feedNames[feedUrl];
        delete feedCategories[feedUrl];
        localStorage.setItem("rssFeeds", JSON.stringify(feeds));
        localStorage.setItem("feedNames", JSON.stringify(feedNames));
        localStorage.setItem("feedCategories", JSON.stringify(feedCategories));
        if (currentFeedIndex >= feeds.length) currentFeedIndex = 0;
        updateTabs();
        loadCurrentFeed();
        closeFeedManageModal();
    }
}

function shareFeed(feedUrl) {
    const shareLink = `${window.location.origin}${window.location.pathname
        }?feed=${encodeURIComponent(feedUrl)}`;
    navigator.clipboard.writeText(shareLink).then(() => {
        alert(t('feed_link_copied', 'Ссылка на ленту скопирована! Передайте её другу для добавления.'));
    });
    closeFeedManageModal();
}

function closeModal() {
    modal.classList.remove("visible");
    setTimeout(() => (modal.style.display = "none"), 300);
}

function closeShareModal() {
    shareModal.classList.remove("visible");
    setTimeout(() => (shareModal.style.display = "none"), 300);
}

function closeFeedManageModal() {
    feedManageModal.classList.remove("visible");
    setTimeout(() => (feedManageModal.style.display = "none"), 300);
}

function clearFeed() {
    if (!confirm('Вы уверены, что хотите удалить все ленты? Это действие нельзя отменить.')) {
        return;
    }

    feeds = [];
    feedNames = {};
    feedCategories = {};
    feedCache.clear();
    localStorage.setItem("rssFeeds", JSON.stringify(feeds));
    localStorage.setItem("feedNames", JSON.stringify(feedNames));
    localStorage.setItem("feedCategories", JSON.stringify(feedCategories));
    feedGrid.innerHTML = "";
    updateTabs();
    showPlaceholder();
}

// Экспорт лент в OPML формат
function exportFeeds() {
    if (feeds.length === 0) {
        alert('Нет лент для экспорта');
        return;
    }

    const opml = generateOPML();
    const blob = new Blob([opml], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `rss-feeds-${new Date().toISOString().split('T')[0]}.opml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Импорт лент из OPML файла
function importFeeds() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.opml,.xml';
    input.onchange = handleOPMLImport;
    input.click();
}

// Генерация OPML
function generateOPML() {
    const now = new Date().toUTCString();
    let opml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
    <head>
        <title>RSS Feeds Export</title>
        <dateCreated>${now}</dateCreated>
        <dateModified>${now}</dateModified>
    </head>
    <body>`;

    // Группируем по категориям
    const categorizedFeeds = {};
    feeds.forEach(feed => {
        const category = feedCategories[feed] || 'Без категории';
        if (!categorizedFeeds[category]) {
            categorizedFeeds[category] = [];
        }
        categorizedFeeds[category].push(feed);
    });

    Object.entries(categorizedFeeds).forEach(([category, categoryFeeds]) => {
        opml += `\n        <outline text="${category}" title="${category}">`;
        categoryFeeds.forEach(feed => {
            const title = feedNames[feed] || feed;
            opml += `\n            <outline type="rss" text="${title}" title="${title}" xmlUrl="${feed}" htmlUrl="${feed}"/>`;
        });
        opml += `\n        </outline>`;
    });

    opml += `\n    </body>
</opml>`;

    return opml;
}

// Обработка импорта OPML
async function handleOPMLImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const text = await file.text();
        const parser = new DOMParser();
        const opmlDoc = parser.parseFromString(text, 'text/xml');

        const outlines = opmlDoc.querySelectorAll('outline[xmlUrl]');
        let importedCount = 0;

        for (const outline of outlines) {
            const xmlUrl = outline.getAttribute('xmlUrl');
            const title = outline.getAttribute('text') || outline.getAttribute('title');
            const category = outline.parentElement.getAttribute('text') || 'Импортированные';

            if (xmlUrl && !feeds.includes(xmlUrl)) {
                feeds.push(xmlUrl);
                feedNames[xmlUrl] = title || xmlUrl.split('/')[2] || `Лента ${feeds.length}`;
                feedCategories[xmlUrl] = category;

                // Добавляем категорию если её нет
                if (!categories.includes(category)) {
                    categories.push(category);
                }

                importedCount++;
            }
        }

        if (importedCount > 0) {
            localStorage.setItem("rssFeeds", JSON.stringify(feeds));
            localStorage.setItem("feedNames", JSON.stringify(feedNames));
            localStorage.setItem("feedCategories", JSON.stringify(feedCategories));
            localStorage.setItem("categories", JSON.stringify(categories));

            updateCategorySelect();
            updateTabs();
            loadCurrentFeed();

            alert(`Импортировано ${importedCount} лент`);
        } else {
            alert('Не найдено новых лент для импорта');
        }

    } catch (error) {
        alert('Ошибка импорта OPML файла: ' + error.message);
        console.error('OPML import error:', error);
    }
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme");

    if (!currentTheme) {
        document.documentElement.setAttribute("data-theme", "light");
    } else if (currentTheme === "light") {
        document.documentElement.setAttribute("data-theme", "dark");
    } else {
        document.documentElement.removeAttribute("data-theme");
    }

    // Обновляем все иконки темы
    updateAllThemeIcons();

    localStorage.setItem(
        "theme",
        document.documentElement.getAttribute("data-theme") || "system"
    );
}

const savedTheme = localStorage.getItem("theme");
if (savedTheme === "light") {
    document.documentElement.setAttribute("data-theme", "light");
    themeIcon.textContent = "☀️";
} else if (savedTheme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    themeIcon.textContent = "🌙";
} else {
    themeIcon.textContent = "🌓";
}

// Функция для обновления всех иконок темы
function updateAllThemeIcons() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    let iconText;

    if (!currentTheme) {
        iconText = "🌓";
    } else if (currentTheme === "light") {
        iconText = "☀️";
    } else {
        iconText = "🌙";
    }

    // Обновляем все иконки темы
    document.querySelectorAll('#themeIcon, .theme-icon').forEach(icon => {
        if (icon) icon.textContent = iconText;
    });
}

rssUrlInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") addFeed();
});

categorySelect.addEventListener("change", () => {
    currentFeedIndex = 0;
    updateTabs();
    loadCurrentFeed();
});

modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
});

shareModal.addEventListener("click", (e) => {
    if (e.target === shareModal) closeShareModal();
});

feedManageModal.addEventListener("click", (e) => {
    if (e.target === feedManageModal) closeFeedManageModal();
});

const urlParams = new URLSearchParams(window.location.search);
const sharedFeed = urlParams.get("feed");
if (sharedFeed && !feeds.includes(sharedFeed)) {
    feeds.push(sharedFeed);
    feedNames[sharedFeed] = sharedFeed.split("/")[2] || `Лента ${feeds.length}`;
    feedCategories[sharedFeed] = "Без категории";
    localStorage.setItem("rssFeeds", JSON.stringify(feeds));
    localStorage.setItem("feedNames", JSON.stringify(feedNames));
    localStorage.setItem("feedCategories", JSON.stringify(feedCategories));
    updateTabs();
    switchFeed(0);
}

// Очистка кэша при превышении лимита
function cleanupCache() {
    if (feedCache.size > 50) { // Максимум 50 лент в кэше
        const entries = Array.from(feedCache.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

        // Удаляем самые старые записи
        const toDelete = entries.slice(0, 10);
        toDelete.forEach(([url]) => feedCache.delete(url));
    }
}

// Автоматическая очистка устаревшего кэша
function cleanupExpiredCache() {
    const now = Date.now();
    for (const [url, data] of feedCache.entries()) {
        if (now - data.timestamp > CACHE_DURATION * 2) {
            feedCache.delete(url);
        }
    }
}

// Запускаем очистку кэша каждые 10 минут
setInterval(cleanupExpiredCache, 10 * 60 * 1000);

// Добавляем обработчик для обновления всех лент
function addRefreshButton() {
    const refreshBtn = document.createElement('button');
    refreshBtn.innerHTML = '🔄';
    refreshBtn.title = t('refresh_all_feeds', 'Обновить все ленты');
    refreshBtn.className = 'refresh-btn';
    refreshBtn.onclick = refreshAllFeeds;
    refreshBtn.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--accent-color);
        color: white;
        border: none;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        font-size: 20px;
        cursor: pointer;
        z-index: 1000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        transition: transform 0.2s;
    `;
    refreshBtn.onmouseover = () => refreshBtn.style.transform = 'scale(1.1)';
    refreshBtn.onmouseout = () => refreshBtn.style.transform = 'scale(1)';
    document.body.appendChild(refreshBtn);
}

// Retry механизм для загрузки лент
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, {
                ...options,
                timeout: 10000 // 10 секунд таймаут
            });

            if (response.ok) {
                return response;
            }

            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        } catch (error) {
            lastError = error;

            // Экспоненциальная задержка между попытками
            if (i < maxRetries - 1) {
                const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw lastError;
}

// Проверка подключения к интернету
function checkOnlineStatus() {
    if (!navigator.onLine) {
        feedGrid.innerHTML = `<p>⚠️ ${t('no_internet', 'Нет подключения к интернету')}</p>`;
        return false;
    }
    return true;
}

// Обработчики событий для статуса сети
window.addEventListener('online', () => {
    console.log('Подключение восстановлено');
    if (feeds.length > 0) {
        loadCurrentFeed();
    }
});

window.addEventListener('offline', () => {
    console.log('Подключение потеряно');
    feedGrid.innerHTML = `<p>⚠️ ${t('connection_lost', 'Нет подключения к интернету. Проверьте соединение.')}</p>`;
});

// Оптимизация производительности - дебаунс для поиска
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Инициализация при загрузке DOM
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 Инициализация приложения...');
    updateCategorySelect();
    updateTabs();
    loadCurrentFeed();
    addRefreshButton();
    console.log('✅ Инициализация завершена');
});

// Предзагрузка критических ресурсов
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(console.error);
}

// Функции для мобильного меню
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    const menuToggle = document.getElementById('menuToggle');
    const isVisible = mobileMenu.classList.contains('visible');

    if (isVisible) {
        mobileMenu.classList.remove('visible');
        menuToggle.setAttribute('aria-expanded', 'false');
        setTimeout(() => {
            mobileMenu.style.display = 'none';
        }, 300);

        // Возвращаем фокус на кнопку меню
        menuToggle.focus();
    } else {
        mobileMenu.style.display = 'flex';
        menuToggle.setAttribute('aria-expanded', 'true');
        setTimeout(() => {
            mobileMenu.classList.add('visible');
            // Фокусируемся на первом элементе меню
            const firstMenuItem = mobileMenu.querySelector('.mobile-nav-item');
            if (firstMenuItem) firstMenuItem.focus();
        }, 10);
    }
}

// Закрытие мобильного меню при клике вне его
document.addEventListener('click', (e) => {
    const mobileMenu = document.getElementById('mobileMenu');
    const menuToggle = document.getElementById('menuToggle');

    if (mobileMenu.classList.contains('visible') &&
        !mobileMenu.contains(e.target) &&
        !menuToggle.contains(e.target)) {
        toggleMobileMenu();
    }
});

// Адаптивное управление навигацией
function updateNavigationVisibility() {
    const screenWidth = window.innerWidth;
    const desktopItems = document.querySelectorAll('.nav-item.desktop-only');
    const menuToggle = document.getElementById('menuToggle');

    if (screenWidth <= 768) {
        // На мобильных устройствах скрываем десктопные элементы
        desktopItems.forEach(item => {
            item.style.display = 'none';
        });
        menuToggle.style.display = 'flex';
    } else {
        // На десктопе показываем все элементы
        desktopItems.forEach(item => {
            item.style.display = 'flex';
        });
        menuToggle.style.display = 'flex'; // Меню всегда видимо

        // Закрываем мобильное меню если оно открыто
        const mobileMenu = document.getElementById('mobileMenu');
        if (mobileMenu.classList.contains('visible')) {
            toggleMobileMenu();
        }
    }

    // Обновляем стили навигации
    updateNavigationStyles();
}

// Обновление стилей навигации
function updateNavigationStyles() {
    const bottomNav = document.getElementById('bottomNav');
    const screenWidth = window.innerWidth;

    if (screenWidth <= 480) {
        bottomNav.classList.add('compact');
    } else {
        bottomNav.classList.remove('compact');
    }
}

// Обновляем видимость при изменении размера окна
window.addEventListener('resize', debounce(() => {
    updateNavigationVisibility();
    resetBottomNavStyles(); // Сбрасываем стили при изменении размера
}, 250));

// Функция для обновления активного состояния навигации
function updateActiveNavItem(activeItem) {
    // Убираем активное состояние со всех элементов
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Добавляем активное состояние к выбранному элементу
    if (activeItem) {
        activeItem.classList.add('active');
    }
}

// Улучшенные функции навигации с индикацией активности
const originalLoadCurrentFeed = loadCurrentFeed;
loadCurrentFeed = function () {
    updateActiveNavItem(document.querySelector('.nav-item[onclick*="loadCurrentFeed"]'));
    return originalLoadCurrentFeed.apply(this, arguments);
};

const originalScrollToTop = scrollToTop;
scrollToTop = function () {
    updateActiveNavItem(document.querySelector('.nav-item[onclick*="scrollToTop"]'));
    setTimeout(() => updateActiveNavItem(null), 1000); // Убираем активность через секунду
    return originalScrollToTop.apply(this, arguments);
};

// Отключаем скрытие/показ навигации при прокрутке для стабильного позиционирования
// let lastScrollY = window.scrollY;
// let navHideTimeout;

// function handleNavScroll() {
//     const bottomNav = document.getElementById('bottomNav');
//     const currentScrollY = window.scrollY;

//     if (currentScrollY > lastScrollY && currentScrollY > 100) {
//         bottomNav.style.transform = 'translateY(100%)';
//         bottomNav.style.opacity = '0.8';
//     } else {
//         bottomNav.style.transform = 'translateY(0)';
//         bottomNav.style.opacity = '1';
//     }

//     lastScrollY = currentScrollY;

//     clearTimeout(navHideTimeout);
//     navHideTimeout = setTimeout(() => {
//         bottomNav.style.transform = 'translateY(0)';
//         bottomNav.style.opacity = '1';
//     }, 2000);
// }

// window.addEventListener('scroll', debounce(handleNavScroll, 10));

// Поддержка клавиатурной навигации
document.addEventListener('keydown', (e) => {
    // Закрытие модальных окон по Escape
    if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal.visible, .share-modal.visible');
        if (openModal) {
            if (openModal.id === 'mobileMenu') {
                toggleMobileMenu();
            } else if (openModal.id === 'modal') {
                closeModal();
            } else if (openModal.id === 'shareModal') {
                closeShareModal();
            } else if (openModal.id === 'feedManageModal') {
                closeFeedManageModal();
            } else if (openModal.id === 'recommendationsModal') {
                closeRecommendationsModal();
            }
        }
    }

    // Навигация по вкладкам стрелками
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const focusedTab = document.activeElement;
        if (focusedTab && focusedTab.classList.contains('tab')) {
            const tabs = Array.from(document.querySelectorAll('.tab'));
            const currentIndex = tabs.indexOf(focusedTab);
            let nextIndex;

            if (e.key === 'ArrowLeft') {
                nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
            } else {
                nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
            }

            tabs[nextIndex].focus();
            e.preventDefault();
        }
    }
});

// Управление фокусом в мобильном меню
document.addEventListener('keydown', (e) => {
    const mobileMenu = document.getElementById('mobileMenu');
    if (!mobileMenu.classList.contains('visible')) return;

    const focusableElements = mobileMenu.querySelectorAll('button, [tabindex="0"]');
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.key === 'Tab') {
        if (e.shiftKey) {
            if (document.activeElement === firstElement) {
                lastElement.focus();
                e.preventDefault();
            }
        } else {
            if (document.activeElement === lastElement) {
                firstElement.focus();
                e.preventDefault();
            }
        }
    }
});

// Функции для прокрутки категорий
function scrollTabs(direction) {
    const tabsContainer = document.getElementById('tabs');
    const scrollAmount = 200;

    if (direction === 'left') {
        tabsContainer.scrollBy({
            left: -scrollAmount,
            behavior: 'smooth'
        });
    } else {
        tabsContainer.scrollBy({
            left: scrollAmount,
            behavior: 'smooth'
        });
    }

    updateScrollButtons();
}

// Обновление состояния кнопок прокрутки
function updateScrollButtons() {
    const tabsContainer = document.getElementById('tabs');
    const scrollLeft = document.getElementById('scrollLeft');
    const scrollRight = document.getElementById('scrollRight');
    const scrollProgress = document.getElementById('scrollProgress');

    if (!tabsContainer || !scrollLeft || !scrollRight) return;

    const { scrollLeft: currentScroll, scrollWidth, clientWidth } = tabsContainer;
    const maxScroll = scrollWidth - clientWidth;

    // Обновляем состояние кнопок
    scrollLeft.disabled = currentScroll <= 0;
    scrollRight.disabled = currentScroll >= maxScroll;

    // Обновляем индикатор прогресса
    if (scrollProgress && maxScroll > 0) {
        const progress = (currentScroll / maxScroll) * 100;
        scrollProgress.style.width = `${progress}%`;
    }
}

// Прокрутка колесом мыши
function initTabsScrolling() {
    const tabsContainer = document.getElementById('tabs');
    if (!tabsContainer) return;

    // Прокрутка колесом мыши
    tabsContainer.addEventListener('wheel', (e) => {
        if (e.deltaY !== 0) {
            e.preventDefault();
            tabsContainer.scrollBy({
                left: e.deltaY > 0 ? 100 : -100,
                behavior: 'smooth'
            });
            updateScrollButtons();
        }
    });

    // Обновление при прокрутке
    tabsContainer.addEventListener('scroll', updateScrollButtons);

    // Обновление при изменении размера окна
    window.addEventListener('resize', updateScrollButtons);

    // Инициальное обновление
    setTimeout(updateScrollButtons, 100);
}

// Улучшенная функция показа деталей новости
function showDetails(item) {
    currentItem = item;
    currentMode = "normal";

    const modal = document.getElementById('modal');
    const modalContent = modal.querySelector('.modal-content');

    // Создаем улучшенную структуру модального окна
    modalContent.innerHTML = `
        <div class="modal-header">
            <div class="mode-switch">
                <button class="mode-btn active focus-ring" onclick="switchMode('normal')">Статья</button>
                <button class="mode-btn focus-ring" onclick="switchMode('web')">Веб-страница</button>
            </div>
        </div>
        <div class="modal-body" id="modalBody">
            <!-- Контент будет здесь -->
        </div>
        <div class="modal-footer">
            <div class="news-actions">
                <a href="${item.link}" target="_blank" class="news-action-btn primary focus-ring">
                    <span>🔗</span>
                    <span>Читать на сайте</span>
                </a>
                <button class="news-action-btn focus-ring" onclick="showShareModal()">
                    <span>📤</span>
                    <span>Поделиться</span>
                </button>
            </div>
        </div>
    `;

    updateModalContent();
    modal.style.display = "flex";
    setTimeout(() => modal.classList.add("visible"), 10);
    updateModeButtons();
}

// Обновленная функция контента модального окна
function updateModalContent() {
    const modalBody = document.getElementById('modalBody');
    if (!modalBody || !currentItem) return;

    if (currentMode === 'normal') {
        const imageHtml = currentItem.enclosure && !currentItem.isVideo
            ? `<div class="news-media">
                 <img src="${currentItem.enclosure}" alt="Изображение к новости" loading="lazy">
               </div>`
            : '';

        const videoHtml = currentItem.enclosure && currentItem.isVideo
            ? `<div class="news-media">
                 <video controls src="${currentItem.enclosure}" preload="metadata"></video>
               </div>`
            : '';

        const dateHtml = currentItem.pubDate
            ? `<div class="news-meta-item">
                 <span class="news-meta-icon">📅</span>
                 <span>${formatDate(currentItem.pubDate)}</span>
               </div>`
            : '';

        const authorHtml = currentItem.author
            ? `<div class="news-meta-item">
                 <span class="news-meta-icon">✍️</span>
                 <span>${currentItem.author}</span>
               </div>`
            : '';

        // Обрабатываем и форматируем контент статьи
        const articleContent = processArticleContent(currentItem);

        modalBody.innerHTML = `
            <h1 class="news-title">${currentItem.title}</h1>
            ${(dateHtml || authorHtml) ? `
                <div class="news-meta">
                    ${dateHtml}
                    ${authorHtml}
                </div>
            ` : ''}
            ${imageHtml}
            ${videoHtml}
            <div class="news-content">${articleContent}</div>
        `;
    } else if (currentMode === 'web') {
        togglePreloader(true);
        modalBody.innerHTML = `
            <div class="iframe-container">
                <iframe src="${currentItem.link}" 
                        sandbox="allow-same-origin allow-scripts allow-forms allow-popups" 
                        onload="togglePreloader(false)"
                        onerror="handleIframeError()"></iframe>
            </div>
        `;
    }
}

// Инициализация адаптивной навигации
updateNavigationVisibility();

// Функция для обработки и улучшения контента статьи
function processArticleContent(item) {
    let content = item.content || item.description || '';

    // Если контент пустой, возвращаем сообщение
    if (!content.trim()) {
        return '<p class="no-content">Текст статьи недоступен. <a href="' + item.link + '" target="_blank">Читать на сайте источника</a></p>';
    }

    // Очищаем и улучшаем HTML контент
    content = cleanAndEnhanceHTML(content);

    // Добавляем дополнительную информацию если есть
    if (item.categories && item.categories.length > 0) {
        const categoriesHtml = item.categories.map(cat =>
            `<span class="article-category">${cat}</span>`
        ).join('');
        content = `<div class="article-categories">${categoriesHtml}</div>` + content;
    }

    return content;
}

// Функция для очистки и улучшения HTML контента
function cleanAndEnhanceHTML(html) {
    // Создаем временный элемент для безопасной обработки HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Удаляем опасные элементы
    const dangerousElements = tempDiv.querySelectorAll('script, style, iframe[src*="javascript"], object, embed');
    dangerousElements.forEach(el => el.remove());

    // Улучшаем изображения
    const images = tempDiv.querySelectorAll('img');
    images.forEach(img => {
        img.setAttribute('loading', 'lazy');
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.style.borderRadius = 'var(--radius-md)';
        img.style.marginBottom = 'var(--spacing-lg)';

        // Добавляем обработчик ошибок
        img.onerror = function () {
            this.style.display = 'none';
        };

        // Оборачиваем в контейнер если нужно
        if (!img.parentElement.classList.contains('image-container')) {
            const container = document.createElement('div');
            container.className = 'image-container';
            img.parentNode.insertBefore(container, img);
            container.appendChild(img);
        }
    });

    // Улучшаем ссылки
    const links = tempDiv.querySelectorAll('a');
    links.forEach(link => {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');

        // Добавляем иконку для внешних ссылок
        if (link.hostname && link.hostname !== window.location.hostname) {
            link.innerHTML += ' <span class="external-link-icon">↗</span>';
        }
    });

    // Улучшаем списки
    const lists = tempDiv.querySelectorAll('ul, ol');
    lists.forEach(list => {
        list.style.marginBottom = 'var(--spacing-lg)';
        list.style.paddingLeft = 'var(--spacing-xl)';
    });

    // Улучшаем параграфы
    const paragraphs = tempDiv.querySelectorAll('p');
    paragraphs.forEach(p => {
        if (p.textContent.trim()) {
            p.style.marginBottom = 'var(--spacing-lg)';
            p.style.lineHeight = '1.8';
        } else {
            p.remove(); // Удаляем пустые параграфы
        }
    });

    // Улучшаем заголовки
    const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach(heading => {
        heading.style.marginTop = 'var(--spacing-xl)';
        heading.style.marginBottom = 'var(--spacing-md)';
        heading.style.color = 'var(--text)';
        heading.style.fontWeight = '600';
    });

    // Улучшаем цитаты
    const blockquotes = tempDiv.querySelectorAll('blockquote');
    blockquotes.forEach(quote => {
        quote.className = 'enhanced-quote';
        quote.style.borderLeft = '4px solid var(--accent-color)';
        quote.style.paddingLeft = 'var(--spacing-lg)';
        quote.style.margin = 'var(--spacing-xl) 0';
        quote.style.fontStyle = 'italic';
        quote.style.background = 'var(--surface)';
        quote.style.padding = 'var(--spacing-lg)';
        quote.style.borderRadius = '0 var(--radius-md) var(--radius-md) 0';
    });

    // Улучшаем таблицы
    const tables = tempDiv.querySelectorAll('table');
    tables.forEach(table => {
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.marginBottom = 'var(--spacing-lg)';
        table.style.border = '1px solid var(--border)';
        table.style.borderRadius = 'var(--radius-md)';
        table.style.overflow = 'hidden';

        // Стилизуем ячейки
        const cells = table.querySelectorAll('td, th');
        cells.forEach(cell => {
            cell.style.padding = 'var(--spacing-md)';
            cell.style.borderBottom = '1px solid var(--border)';
            if (cell.tagName === 'TH') {
                cell.style.background = 'var(--surface)';
                cell.style.fontWeight = '600';
            }
        });
    });

    // Добавляем код блоки
    const codeBlocks = tempDiv.querySelectorAll('pre, code');
    codeBlocks.forEach(code => {
        code.style.background = 'var(--surface)';
        code.style.padding = code.tagName === 'PRE' ? 'var(--spacing-lg)' : 'var(--spacing-xs) var(--spacing-sm)';
        code.style.borderRadius = 'var(--radius-sm)';
        code.style.fontFamily = '"Courier New", monospace';
        code.style.fontSize = '0.9em';
        if (code.tagName === 'PRE') {
            code.style.overflowX = 'auto';
            code.style.marginBottom = 'var(--spacing-lg)';
        }
    });

    // Обрабатываем видео
    const videos = tempDiv.querySelectorAll('video');
    videos.forEach(video => {
        video.setAttribute('controls', '');
        video.style.width = '100%';
        video.style.maxHeight = '400px';
        video.style.borderRadius = 'var(--radius-md)';
        video.style.marginBottom = 'var(--spacing-lg)';
    });

    return tempDiv.innerHTML;
}

// Функция для извлечения дополнительных данных из RSS элемента
function extractAdditionalData(item) {
    // Извлекаем категории если есть
    if (item.querySelector) {
        const categories = Array.from(item.querySelectorAll('category')).map(cat => cat.textContent);
        if (categories.length > 0) {
            return { categories };
        }
    }
    return {};
}

// Обновляем функцию парсинга RSS для извлечения дополнительных данных
function parseRSSItemEnhanced(item) {
    const basicData = parseRSSItem(item);
    const additionalData = extractAdditionalData(item);

    return { ...basicData, ...additionalData };
}

// Функция для улучшения отображения контента в карточках новостей
function enhanceNewsCardContent(description, maxLength = 200) {
    if (!description) return '';

    // Удаляем HTML теги для превью
    const textOnly = description.replace(/<[^>]*>/g, '');

    // Обрезаем текст
    if (textOnly.length > maxLength) {
        return textOnly.substring(0, maxLength).trim() + '...';
    }

    return textOnly;
}

// Функция для отслеживания использования платформ поделиться
function trackShareUsage(platform) {
    const shareStats = JSON.parse(localStorage.getItem('shareStats')) || {};
    shareStats[platform] = (shareStats[platform] || 0) + 1;
    localStorage.setItem('shareStats', JSON.stringify(shareStats));
}

// Функция для получения популярных платформ
function getPopularPlatforms() {
    const shareStats = JSON.parse(localStorage.getItem('shareStats')) || {};
    return Object.entries(shareStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 4)
        .map(([platform]) => platform);
}

// Улучшенная функция shareTo с отслеживанием
const originalShareTo = shareTo;
shareTo = function (platform, link) {
    trackShareUsage(platform);
    return originalShareTo.apply(this, arguments);
};

// Функция для создания быстрых кнопок поделиться
function createQuickShareButtons() {
    const popularPlatforms = getPopularPlatforms();
    if (popularPlatforms.length === 0) return '';

    const platformNames = {
        'whatsapp': { icon: '💬', name: 'WhatsApp' },
        'telegram': { icon: '✈️', name: 'Telegram' },
        'vk': { icon: '🌐', name: 'ВК' },
        'facebook': { icon: '📘', name: 'Facebook' },
        'x': { icon: '🐦', name: 'X' },
        'linkedin': { icon: '💼', name: 'LinkedIn' }
    };

    return `
        <div class="quick-share-section">
            <h4 class="share-section-title">Часто используемые</h4>
            <div class="share-grid">
                ${popularPlatforms.map(platform => {
        const info = platformNames[platform];
        if (!info) return '';
        return `
                        <div class="share-option popular" onclick="shareTo('${platform}', '${currentItem.link}')" title="${info.name}">
                            <span class="share-icon">${info.icon}</span>
                            <span class="share-name">${info.name}</span>
                        </div>
                    `;
    }).join('')}
            </div>
        </div>
    `;
}

// Функция для генерации QR кода (опционально)
function generateQRCode(text) {
    // Простая реализация QR кода через внешний сервис
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;
}

// Функция для добавления QR кода в окно поделиться
function addQRCodeToShare() {
    if (!currentItem) return '';

    const qrUrl = generateQRCode(currentItem.link);
    return `
        <div class="qr-code-section">
            <h4 class="share-section-title">QR код</h4>
            <div class="qr-code-container">
                <img src="${qrUrl}" alt="QR код для ссылки" class="qr-code-image" loading="lazy">
                <p class="qr-code-text">Отсканируйте для быстрого доступа</p>
            </div>
        </div>
    `;
}

// Функция для определения устройства и показа соответствующих опций
function getDeviceSpecificOptions() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);

    let deviceOptions = '';

    if (isMobile) {
        deviceOptions += `
            <div class="share-option other" onclick="shareTo('sms', '${currentItem.link}')" title="SMS">
                <span class="share-icon">📱</span>
                <span class="share-name">SMS</span>
            </div>
        `;
    }

    if (isIOS) {
        deviceOptions += `
            <div class="share-option other" onclick="shareToAirDrop()" title="AirDrop">
                <span class="share-icon">📡</span>
                <span class="share-name">AirDrop</span>
            </div>
        `;
    }

    return deviceOptions;
}

// Функция для AirDrop (только iOS)
function shareToAirDrop() {
    if (navigator.share) {
        shareNative();
    } else {
        showNotification('AirDrop доступен только через нативное API поделиться', 'error');
    }
}

// Инициализация прокрутки вкладок
initTabsScrolling();

// Функция для анализа интересов пользователя
function analyzeUserInterests() {
    const userDomains = feeds.map(feed => {
        try {
            return new URL(feed).hostname.replace('www.', '');
        } catch {
            return null;
        }
    }).filter(Boolean);

    const interests = [];

    // Анализируем домены и определяем интересы
    Object.entries(RECOMMENDED_FEEDS).forEach(([category, categoryFeeds]) => {
        const matchingFeeds = categoryFeeds.filter(feed =>
            userDomains.some(domain => domain.includes(feed.domain) || feed.domain.includes(domain))
        );

        if (matchingFeeds.length > 0) {
            interests.push(category);
        }
    });

    return interests;
}

// Функция для получения персонализированных рекомендаций
function getPersonalizedRecommendations() {
    const userInterests = analyzeUserInterests();
    const userDomains = feeds.map(feed => {
        try {
            return new URL(feed).hostname.replace('www.', '');
        } catch {
            return null;
        }
    }).filter(Boolean);

    let recommendations = [];

    // Сначала добавляем рекомендации по интересам пользователя
    userInterests.forEach(interest => {
        const categoryFeeds = RECOMMENDED_FEEDS[interest] || [];
        const newFeeds = categoryFeeds.filter(feed =>
            !feeds.includes(feed.url) &&
            !userDomains.includes(feed.domain)
        );
        recommendations.push(...newFeeds);
    });

    // Если рекомендаций мало, добавляем популярные из других категорий
    if (recommendations.length < recommendationSettings.maxRecommendations) {
        Object.values(RECOMMENDED_FEEDS).forEach(categoryFeeds => {
            categoryFeeds.forEach(feed => {
                if (!feeds.includes(feed.url) &&
                    !recommendations.find(r => r.url === feed.url)) {
                    recommendations.push(feed);
                }
            });
        });
    }

    return recommendations.slice(0, recommendationSettings.maxRecommendations * 2);
}

// Функция для показа умных рекомендаций в placeholder
function updatePlaceholderWithRecommendations() {
    if (!recommendationSettings.enabled || feeds.length > 0) return;

    const personalizedRecommendations = getPersonalizedRecommendations().slice(0, 3);

    if (personalizedRecommendations.length === 0) return;

    const recommendationsHtml = personalizedRecommendations.map(feed => `
        <div class="placeholder-recommendation" onclick="addRecommendedFeed('${feed.url}', '${feed.name}', '${feed.category}')">
            <div class="placeholder-rec-icon">📰</div>
            <div class="placeholder-rec-info">
                <h4>${feed.name}</h4>
                <p>${feed.description}</p>
                <span class="placeholder-rec-category">${feed.category}</span>
            </div>
            <button class="placeholder-rec-btn">+ Добавить</button>
        </div>
    `).join('');

    const existingPlaceholder = document.querySelector('.placeholder');
    if (existingPlaceholder) {
        existingPlaceholder.innerHTML += `
            <div class="placeholder-recommendations">
                <h3>🌟 Рекомендуемые ленты</h3>
                <div class="placeholder-rec-list">
                    ${recommendationsHtml}
                </div>
                <button class="show-all-recommendations" onclick="showRecommendations()">
                    Показать все рекомендации
                </button>
            </div>
        `;
    }
}

// Показываем рекомендации при первом запуске или если нет лент
if (recommendationSettings.showOnStartup && feeds.length === 0) {
    setTimeout(() => {
        showRecommendations();
    }, 1000);
} else if (feeds.length === 0) {
    // Обновляем placeholder с рекомендациями
    setTimeout(updatePlaceholderWithRecommendations, 500);
}

// Функция для отслеживания активности и обновления рекомендаций
function trackUserActivity(action, data = {}) {
    const activity = JSON.parse(localStorage.getItem('userActivity')) || {
        feedViews: {},
        categoryPreferences: {},
        lastActive: Date.now()
    };

    switch (action) {
        case 'viewFeed':
            const feedUrl = data.feedUrl;
            const category = feedCategories[feedUrl];

            activity.feedViews[feedUrl] = (activity.feedViews[feedUrl] || 0) + 1;
            if (category) {
                activity.categoryPreferences[category] = (activity.categoryPreferences[category] || 0) + 1;
            }
            break;

        case 'addFeed':
            const newCategory = data.category;
            if (newCategory) {
                activity.categoryPreferences[newCategory] = (activity.categoryPreferences[newCategory] || 0) + 5;
            }
            break;
    }

    activity.lastActive = Date.now();
    localStorage.setItem('userActivity', JSON.stringify(activity));
}

// Улучшенная функция получения персонализированных рекомендаций
function getSmartRecommendations() {
    const activity = JSON.parse(localStorage.getItem('userActivity')) || {};
    const userInterests = analyzeUserInterests();
    const categoryPreferences = activity.categoryPreferences || {};

    // Сортируем категории по предпочтениям пользователя
    const sortedCategories = Object.keys(RECOMMENDED_FEEDS).sort((a, b) => {
        const scoreA = (categoryPreferences[a] || 0) + (userInterests.includes(a) ? 10 : 0);
        const scoreB = (categoryPreferences[b] || 0) + (userInterests.includes(b) ? 10 : 0);
        return scoreB - scoreA;
    });

    let recommendations = [];

    // Добавляем рекомендации по приоритету категорий
    sortedCategories.forEach(category => {
        if (recommendationSettings.categories.includes(category)) {
            const categoryFeeds = RECOMMENDED_FEEDS[category] || [];
            const newFeeds = categoryFeeds.filter(feed => !feeds.includes(feed.url));
            recommendations.push(...newFeeds);
        }
    });

    // Удаляем дубликаты и ограничиваем количество
    const uniqueRecommendations = recommendations.filter((feed, index, self) =>
        index === self.findIndex(f => f.url === feed.url)
    );

    return uniqueRecommendations.slice(0, recommendationSettings.maxRecommendations * 2);
}

// Обновляем функцию переключения лент для отслеживания активности
const originalSwitchFeed = switchFeed;
switchFeed = function (index) {
    const filteredFeeds = feeds.filter(
        (feed) =>
            categorySelect.value === "" ||
            feedCategories[feed] === categorySelect.value
    );

    if (filteredFeeds[index]) {
        trackUserActivity('viewFeed', { feedUrl: filteredFeeds[index] });
    }

    return originalSwitchFeed.apply(this, arguments);
};

// Обновляем функцию добавления ленты для отслеживания
const originalAddRecommendedFeed = addRecommendedFeed;
addRecommendedFeed = async function (url, name, category) {
    const result = await originalAddRecommendedFeed.apply(this, arguments);
    trackUserActivity('addFeed', { category });
    return result;
};

// Функция для показа уведомления о новых рекомендациях
function checkForNewRecommendations() {
    if (!recommendationSettings.enabled || feeds.length === 0) return;

    const lastCheck = localStorage.getItem('lastRecommendationCheck');
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;

    // Проверяем раз в день
    if (!lastCheck || now - parseInt(lastCheck) > dayInMs) {
        const smartRecommendations = getSmartRecommendations();
        const newRecommendations = smartRecommendations.slice(0, 3);

        if (newRecommendations.length > 0) {
            setTimeout(() => {
                showNotification(`🌟 Найдено ${newRecommendations.length} новых рекомендаций для вас!`);
            }, 3000);
        }

        localStorage.setItem('lastRecommendationCheck', now.toString());
    }
}

// Запускаем проверку новых рекомендаций
setTimeout(checkForNewRecommendations, 5000);

console.log('🚀 Fluent RSS Reader загружен и оптимизирован!');
// Функция для получения уникальных стран из рекомендаций
function getAvailableCountries() {
    const countries = new Set();
    Object.values(RECOMMENDED_FEEDS).forEach(categoryFeeds => {
        categoryFeeds.forEach(feed => {
            if (feed.country) {
                countries.add(feed.country);
            }
        });
    });
    return Array.from(countries).sort();
}

// Функция для получения статистики рекомендаций
function getRecommendationStats() {
    let totalFeeds = 0;
    const languageStats = {};
    const countryStats = {};
    const qualityStats = { high: 0, medium: 0, low: 0 };

    Object.values(RECOMMENDED_FEEDS).forEach(categoryFeeds => {
        totalFeeds += categoryFeeds.length;
        categoryFeeds.forEach(feed => {
            // Статистика по языкам
            languageStats[feed.language] = (languageStats[feed.language] || 0) + 1;

            // Статистика по странам
            countryStats[feed.country] = (countryStats[feed.country] || 0) + 1;

            // Статистика по качеству
            if (feed.quality >= 9) qualityStats.high++;
            else if (feed.quality >= 7) qualityStats.medium++;
            else qualityStats.low++;
        });
    });

    return {
        total: totalFeeds,
        languages: languageStats,
        countries: countryStats,
        quality: qualityStats
    };
}

// Функция для показа статистики в консоли (для отладки)
function showRecommendationStats() {
    const stats = getRecommendationStats();
    console.log('📊 Статистика рекомендаций:', stats);
    console.log(`📰 Всего лент: ${stats.total}`);
    console.log('🌍 По странам:', stats.countries);
    console.log('🗣️ По языкам:', stats.languages);
    console.log('⭐ По качеству:', `Высокое: ${stats.quality.high}, Среднее: ${stats.quality.medium}, Низкое: ${stats.quality.low}`);
}

// Функция для поиска рекомендаций по ключевым словам
function searchRecommendations(query) {
    const results = [];
    const searchQuery = query.toLowerCase();

    Object.entries(RECOMMENDED_FEEDS).forEach(([category, categoryFeeds]) => {
        categoryFeeds.forEach(feed => {
            if (feed.name.toLowerCase().includes(searchQuery) ||
                feed.description.toLowerCase().includes(searchQuery) ||
                feed.domain.toLowerCase().includes(searchQuery) ||
                feed.country.toLowerCase().includes(searchQuery)) {
                results.push({ ...feed, category });
            }
        });
    });

    return results.sort((a, b) => b.quality - a.quality);
}
// Функция для показа статистики рекомендаций в интерфейсе
function showRecommendationStatsModal() {
    const stats = getRecommendationStats();
    const statsModal = document.createElement('div');
    statsModal.className = 'share-modal';
    const translation = translations[currentLanguage] || translations['ru'];

    const topCountries = Object.entries(stats.countries)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10);

    const topLanguages = Object.entries(stats.languages)
        .sort(([, a], [, b]) => b - a);

    // Получаем переводы для единиц измерения
    const feedsWord = getFeedsWord(stats.total);
    const categoriesWord = getCategoriesWord(Object.keys(RECOMMENDED_FEEDS).length);
    const countriesWord = getCountriesWord(Object.keys(stats.countries).length);

    statsModal.innerHTML = `
        <div class="share-modal-close-overlay">
            <button class="close-btn focus-ring" onclick="this.parentElement.parentElement.remove()" aria-label="${t('close_statistics', 'Закрыть статистику')}">×</button>
        </div>
        <div class="share-modal-content stats-content">
            <h3>📊 ${t('recommendations_statistics', 'Статистика рекомендаций')}</h3>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <h4>📰 ${t('general_info', 'Общая информация')}</h4>
                    <p><strong>${t('total_feeds', 'Всего лент')}:</strong> ${stats.total} ${feedsWord}</p>
                    <p><strong>${t('total_categories', 'Категорий')}:</strong> ${Object.keys(RECOMMENDED_FEEDS).length} ${categoriesWord}</p>
                    <p><strong>${t('total_countries', 'Стран')}:</strong> ${Object.keys(stats.countries).length} ${countriesWord}</p>
                </div>
                
                <div class="stat-card">
                    <h4>⭐ ${t('quality_distribution', 'Качество')}</h4>
                    <p><strong>${t('high_quality', 'Высокое (9-10)')}:</strong> ${stats.quality.high}</p>
                    <p><strong>${t('medium_quality', 'Среднее (7-8)')}:</strong> ${stats.quality.medium}</p>
                    <p><strong>${t('low_quality', 'Низкое (1-6)')}:</strong> ${stats.quality.low}</p>
                </div>
                
                ${createCategoryStatsCard()}
                
                <div class="stat-card">
                    <h4>🗣️ ${t('languages', 'Языки')}</h4>
                    ${topLanguages.map(([lang, count]) => {
        const langName = getLanguageName(lang);
        const feedsWord = getFeedsWord(count);
        return `<p><strong>${langName}:</strong> ${count} ${feedsWord}</p>`;
    }).join('')}
                </div>
                
                <div class="stat-card">
                    <h4>🌍 ${t('top_countries', 'Топ стран')}</h4>
                    ${topCountries.map(([country, count]) => {
        const feedsWord = getFeedsWord(count);
        return `<p><strong>${country}:</strong> ${count} ${feedsWord}</p>`;
    }).join('')}
                </div>
            </div>
            
            <div class="stats-actions">
                <button onclick="this.parentElement.parentElement.parentElement.remove()">
                    ${t('close', 'Закрыть')}
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(statsModal);
    statsModal.style.display = 'flex';
    setTimeout(() => statsModal.classList.add('visible'), 10);

}// Функция для экспорта рекомендаций
function exportRecommendations(format = 'json') {
    const stats = getRecommendationStats();
    const timestamp = new Date().toISOString().split('T')[0];

    let content, filename, mimeType;

    switch (format) {
        case 'json':
            content = JSON.stringify({
                metadata: {
                    exportDate: new Date().toISOString(),
                    totalFeeds: stats.total,
                    categories: Object.keys(RECOMMENDED_FEEDS).length
                },
                feeds: RECOMMENDED_FEEDS
            }, null, 2);
            filename = `rss-recommendations-${timestamp}.json`;
            mimeType = 'application/json';
            break;

        case 'csv':
            const csvRows = ['Name,URL,Domain,Description,Country,Language,Quality,Category'];
            Object.entries(RECOMMENDED_FEEDS).forEach(([category, feeds]) => {
                feeds.forEach(feed => {
                    csvRows.push([
                        `"${feed.name}"`,
                        `"${feed.url}"`,
                        `"${feed.domain}"`,
                        `"${feed.description}"`,
                        `"${feed.country}"`,
                        `"${feed.language}"`,
                        feed.quality,
                        `"${category}"`
                    ].join(','));
                });
            });
            content = csvRows.join('\n');
            filename = `rss-recommendations-${timestamp}.csv`;
            mimeType = 'text/csv';
            break;

        case 'opml':
            const opmlFeeds = [];
            Object.entries(RECOMMENDED_FEEDS).forEach(([category, feeds]) => {
                feeds.forEach(feed => {
                    opmlFeeds.push(`    <outline text="${feed.name}" title="${feed.name}" type="rss" xmlUrl="${feed.url}" htmlUrl="https://${feed.domain}" description="${feed.description}"/>`);
                });
            });
            content = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="1.0">
  <head>
    <title>RSS Recommendations Export</title>
    <dateCreated>${new Date().toUTCString()}</dateCreated>
  </head>
  <body>
${opmlFeeds.join('\n')}
  </body>
</opml>`;
            filename = `rss-recommendations-${timestamp}.opml`;
            mimeType = 'text/x-opml';
            break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification(`Рекомендации экспортированы в ${format.toUpperCase()}`);
}

// Функция для показа модального окна экспорта
function showExportModal() {
    const exportModal = document.createElement('div');
    exportModal.className = 'share-modal';

    exportModal.innerHTML = `
        <div class="share-modal-close-overlay">
            <button class="close-btn focus-ring" onclick="this.parentElement.parentElement.remove()" aria-label="Закрыть экспорт">×</button>
        </div>
        <div class="share-modal-content export-content">
            <h3>📤 ${t('export_recommendations', 'Экспорт рекомендаций')}</h3>
            <p>${t('export_description', 'Выберите формат для экспорта базы рекомендуемых RSS лент:')}</p>
            
            <div class="export-options">
                <div class="export-option" onclick="exportRecommendations('json'); this.parentElement.parentElement.parentElement.parentElement.remove()">
                    <div class="export-icon">📄</div>
                    <div class="export-info">
                        <h4>JSON</h4>
                        <p>${t('json_description', 'Структурированные данные для разработчиков')}</p>
                    </div>
                </div>
                
                <div class="export-option" onclick="exportRecommendations('csv'); this.parentElement.parentElement.parentElement.parentElement.remove()">
                    <div class="export-icon">📊</div>
                    <div class="export-info">
                        <h4>CSV</h4>
                        <p>${t('csv_description', 'Таблица для Excel и Google Sheets')}</p>
                    </div>
                </div>
                
                <div class="export-option" onclick="exportRecommendations('opml'); this.parentElement.parentElement.parentElement.parentElement.remove()">
                    <div class="export-icon">📡</div>
                    <div class="export-info">
                        <h4>OPML</h4>
                        <p>${t('opml_description', 'Стандартный формат для RSS читалок')}</p>
                    </div>
                </div>
            </div>
            
            <div class="export-actions">
                <button onclick="this.parentElement.parentElement.parentElement.remove()">
                    ${t('cancel', 'Отмена')}
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(exportModal);
    exportModal.style.display = 'flex';
    setTimeout(() => exportModal.classList.add('visible'), 10);
}
// Показываем статистику при загрузке(для демонстрации)
document.addEventListener('DOMContentLoaded', function () {
    // Небольшая задержка чтобы все загрузилось
    setTimeout(() => {
        console.log('🌟 Система рекомендаций RSS лент обновлена!');
        showRecommendationStats();

        console.log('\n🚀 Новые возможности:');
        console.log('• Ленты из', Object.keys(getRecommendationStats().countries).length, 'стран');
        console.log('• Фильтрация по качеству, языку и стране');
        console.log('• Группировка по странам');
        console.log('• Экспорт в JSON, CSV и OPML');
        console.log('• Подробная статистика');
        console.log('• Улучшенный интерфейс с флагами и рейтингами');
    }, 1000);
});
// Функция для тестирования рекомендаций
function testRecommendations() {
    console.log('🧪 Тестирование рекомендаций...');
    console.log('Настройки:', recommendationSettings);
    console.log('Количество категорий:', Object.keys(RECOMMENDED_FEEDS).length);
    console.log('Общее количество лент:', Object.values(RECOMMENDED_FEEDS).flat().length);

    // Проверяем первую ленту из каждой категории
    Object.entries(RECOMMENDED_FEEDS).forEach(([category, feeds]) => {
        if (feeds.length > 0) {
            console.log(`${category}: ${feeds[0].name} (${feeds[0].country})`);
        }
    });

    // Пробуем показать рекомендации
    try {
        showRecommendations();
        console.log('✅ Рекомендации должны отображаться');
    } catch (error) {
        console.error('❌ Ошибка при показе рекомендаций:', error);
    }
}

// Добавляем функцию в глобальную область для отладки
window.testRecommendations = testRecommendations;
// Функция для диагностики и восстановления
function diagnoseAndFix() {
    console.log('🔍 Диагностика состояния приложения:');
    console.log('Количество лент:', feeds.length);
    console.log('Ленты:', feeds);
    console.log('Названия лент:', feedNames);
    console.log('Категории лент:', feedCategories);
    console.log('Доступные категории:', categories);

    // Проверяем localStorage
    console.log('localStorage rssFeeds:', localStorage.getItem("rssFeeds"));
    console.log('localStorage feedNames:', localStorage.getItem("feedNames"));
    console.log('localStorage categories:', localStorage.getItem("categories"));

    // Если нет лент, показываем плейсхолдер
    if (feeds.length === 0) {
        console.log('📝 Показываем плейсхолдер...');
        showPlaceholder();
    } else {
        console.log('📰 Обновляем интерфейс...');
        updateTabs();
        loadCurrentFeed();
    }

    // Проверяем рекомендации
    console.log('🌟 Настройки рекомендаций:', recommendationSettings);
    console.log('📊 Количество рекомендуемых лент:', Object.values(RECOMMENDED_FEEDS).flat().length);
}

// Добавляем в глобальную область для отладки
window.diagnoseAndFix = diagnoseAndFix;

// Вызываем диагностику при загрузке
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(() => {
        console.log('🚀 Запуск диагностики...');
        diagnoseAndFix();
    }, 500);
});
// Функция для добавления тестовых лент
function addTestFeeds() {
    console.log('➕ Добавляем тестовые ленты...');

    const testFeeds = [
        {
            url: "https://lenta.ru/rss",
            name: "Лента.ру",
            category: "Новости"
        },
        {
            url: "https://habr.com/ru/rss/hub/programming/",
            name: "Хабр - Программирование",
            category: "Технологии"
        }
    ];

    testFeeds.forEach(feed => {
        if (!feeds.includes(feed.url)) {
            feeds.push(feed.url);
            feedNames[feed.url] = feed.name;
            feedCategories[feed.url] = feed.category;

            if (!categories.includes(feed.category)) {
                categories.push(feed.category);
            }
        }
    });

    // Сохраняем в localStorage
    localStorage.setItem("rssFeeds", JSON.stringify(feeds));
    localStorage.setItem("feedNames", JSON.stringify(feedNames));
    localStorage.setItem("feedCategories", JSON.stringify(feedCategories));
    localStorage.setItem("categories", JSON.stringify(categories));

    // Обновляем интерфейс
    updateCategorySelect();
    updateTabs();
    loadCurrentFeed();

    console.log('✅ Тестовые ленты добавлены!');
}

// Добавляем в глобальную область
window.addTestFeeds = addTestFeeds;
// Функция для сброса inline стилей навигации
function resetBottomNavStyles() {
    const bottomNav = document.getElementById('bottomNav');
    if (bottomNav) {
        // Убираем все inline стили которые могли быть добавлены JavaScript
        bottomNav.style.transform = '';
        bottomNav.style.opacity = '';
        bottomNav.style.left = '';
        bottomNav.style.right = '';
        bottomNav.style.width = '';
        bottomNav.style.bottom = '';

        console.log('🔧 Сброшены inline стили навигации');
    }
}

// Вызываем сброс при загрузке DOM
document.addEventListener('DOMContentLoaded', function () {
    resetBottomNavStyles();
});

// Добавляем в глобальную область для отладки
window.resetBottomNavStyles = resetBottomNavStyles;
// Принудительный сброс всех стилей навигации
function forceResetNavigation() {
    const bottomNav = document.getElementById('bottomNav');
    if (bottomNav) {
        // Убираем все возможные inline стили
        const stylesToReset = [
            'transform', 'opacity', 'left', 'right', 'width', 'bottom',
            'top', 'margin', 'marginLeft', 'marginRight', 'position'
        ];

        stylesToReset.forEach(style => {
            bottomNav.style[style] = '';
        });

        // Убираем все классы которые могут влиять на позиционирование
        bottomNav.classList.remove('scrolled');

        console.log('🔧 Принудительно сброшены все стили навигации');
    }
}

// Вызываем принудительный сброс каждые 5 секунд для отладки
setInterval(forceResetNavigation, 5000);

// Добавляем в глобальную область
window.forceResetNavigation = forceResetNavigation;
// Система интернационализации(i18n)
const translations = {
    ru: {
        // Основной интерфейс
        rss_url_label: "URL RSS-ленты",
        rss_url_placeholder: "Введите URL RSS-ленты",
        rss_help: "Введите полный URL RSS или Atom ленты",
        category_label: "Категория",
        category_select_aria: "Выберите категорию",
        all_categories: "Все категории",
        add_feed_btn: "Добавить",
        add_help: "Добавить RSS ленту в выбранную категорию",
        add_category_btn: "Добавить категорию",

        // Навигация
        refresh: "Обновить",
        scroll_top: "Наверх",
        theme: "Тема",
        recommendations: "Рекомендации",
        menu: "Меню",
        refresh_current_feed: "Обновить текущую ленту",
        scroll_to_top: "Прокрутить страницу наверх",
        toggle_theme: "Переключить тему оформления",
        show_recommendations: "Показать рекомендуемые RSS ленты",
        open_menu: "Открыть меню действий",

        // Модальные окна
        share: "Поделиться",
        copy_link: "Скопировать ссылку",
        close: "Закрыть",

        // Футер
        footer_description: "Современный RSS-ридер с поддержкой множества языков и красивым дизайном",
        footer_features: "Возможности",
        footer_multilingual: "Многоязычность",
        footer_offline: "Офлайн режим",
        footer_search: "Поиск статей",
        footer_categories: "Категории",
        footer_languages: "Языки",
        footer_created_by: "Создано с ❤️",
        footer_year: "2025",

        // Мобильное меню
        actions_menu_title: "Действия",
        close_menu: "Закрыть меню",
        actions_navigation: "Навигация по действиям",
        main_actions_section: "Основные действия",
        refresh_feed: "Обновить ленту",
        refresh_all_feeds: "Обновить все ленты",
        change_theme: "Сменить тему",
        feed_management_section: "Управление лентами",
        recommended_feeds: "Рекомендуемые ленты",
        export_feeds: "Экспорт лент",
        import_feeds: "Импорт лент",
        install_app: "Установить приложение",
        dangerous_actions_section: "Опасные действия",
        clear_all_feeds: "Очистить все ленты",

        // Модальные окна
        close_modal: "Закрыть модальное окно",
        normal_mode: "Обычный",
        web_mode: "Веб-страница",
        share_modal_title: "Поделиться",
        close_share_modal: "Закрыть окно поделиться",
        close_feed_manage: "Закрыть управление лентами",
        feed_management_title: "Управление лентами",

        // Дополнительные переводы
        refresh_all_feeds: "Обновить все ленты",
        export_feeds: "Экспортировать ленты в OPML файл",
        import_feeds: "Импортировать ленты из OPML файла",
        install_app: "Установить приложение как PWA",
        clear_all_feeds: "Удалить все RSS ленты",

        // Уведомления
        feed_added: "Лента добавлена",
        feed_removed: "Лента удалена",
        category_added: "Категория добавлена",
        error_invalid_url: "Неверный URL",
        error_feed_exists: "Лента уже существует",

        // Плейсхолдеры и сообщения
        no_feeds_message: "Нет лент для отображения",
        loading_feed: "Загрузка ленты...",
        feed_load_error: "Ошибка загрузки ленты",
        no_articles: "Нет статей в этой ленте",

        // Кнопки и действия
        add_feed: "Добавить ленту",
        remove_feed: "Удалить ленту",
        edit_feed: "Редактировать ленту",
        refresh_feed: "Обновить ленту",

        // Категории
        no_category: "Без категории",
        create_category: "Создать категорию",
        category_name: "Название категории",

        // Поиск
        search_placeholder: "Поиск по статьям...",
        no_search_results: "Ничего не найдено",

        // Время
        just_now: "только что",
        minutes_ago: "минут назад",
        hours_ago: "часов назад",
        days_ago: "дней назад",

        // Статистика
        total_feeds: "Всего лент",
        total_articles: "Всего статей",
        last_update: "Последнее обновление",

        // Рекомендации
        recommended_rss_feeds: "Рекомендуемые RSS ленты",
        recommendations_description: "Выберите качественные источники новостей по интересующим вас темам",
        close_recommendations: "Закрыть рекомендации",
        settings: "Настройки",
        statistics: "Статистика",
        export: "Экспорт",
        all: "Все",
        add_feed: "Добавить",
        added: "Добавлено",
        quality: "Качество",
        language: "Язык",
        country: "Страна",
        no_recommendations: "Нет рекомендаций для выбранных фильтров",

        // Настройки рекомендаций
        recommendation_settings: "Настройки рекомендаций",
        enable_recommendations: "Включить рекомендации",
        show_on_startup: "Показывать при запуске",
        max_recommendations: "Максимум рекомендаций",
        min_quality: "Минимальное качество",
        sort_by: "Сортировка",
        sort_by_quality: "По качеству",
        sort_by_name: "По названию",
        sort_by_country: "По стране",
        show_country_flags: "Показывать флаги стран",
        group_by_country: "Группировать по странам",
        preferred_languages: "Предпочитаемые языки",
        categories_for_recommendations: "Категории для рекомендаций",
        save: "Сохранить",
        reset: "Сбросить",

        // Статистика рекомендаций
        recommendations_statistics: "Статистика рекомендаций",
        general_info: "Общая информация",
        total_feeds: "Всего лент",
        total_categories: "Категорий",
        total_countries: "Стран",
        quality_distribution: "Распределение по качеству",
        high_quality: "Высокое (9-10)",
        medium_quality: "Среднее (7-8)",
        low_quality: "Низкое (1-6)",
        languages: "Языки",
        top_countries: "Топ стран",
        categories_stats: "Категории",
        close_statistics: "Закрыть статистику",
        close_settings: "Закрыть настройки",
        settings_saved: "Настройки сохранены",
        settings_reset: "Настройки сброшены",

        // Модальное окно новости
        publication_date: "Дата публикации",
        article_author: "Автор статьи",
        author: "Автор",
        go_to_source: "Перейти к источнику",
        page_load_error: "Не удалось загрузить страницу",
        embedding_not_allowed: "Сайт не разрешает встраивание или недоступен.",
        open_in_new_tab: "Открыть в новой вкладке",

        // Дополнительные элементы интерфейса
        loading: "Загрузка...",
        error: "Ошибка",
        retry: "Повторить",
        cancel: "Отмена",
        confirm: "Подтвердить",
        delete: "Удалить",
        edit: "Редактировать",
        save: "Сохранить",

        // Сообщения об ошибках
        network_error: "Ошибка сети",
        invalid_feed: "Неверный формат ленты",
        feed_not_found: "Лента не найдена",
        access_denied: "Доступ запрещен",

        // Форматирование времени
        now: "сейчас",
        minute: "минута",
        minutes: "минут",
        hour: "час",
        hours: "часов",
        day: "день",
        days: "дней",
        week: "неделя",
        weeks: "недель",
        month: "месяц",
        months: "месяцев",
        year: "год",
        years: "лет",
        ago: "назад",

        // Дополнительные переводы для статистики
        close_statistics: "Закрыть статистику",
        categories_distribution: "Распределение по категориям"
    },

    en: {
        // Main interface
        rss_url_label: "RSS Feed URL",
        rss_url_placeholder: "Enter RSS feed URL",
        rss_help: "Enter full RSS or Atom feed URL",
        category_label: "Category",
        category_select_aria: "Select category",
        all_categories: "All categories",
        add_feed_btn: "Add",
        add_help: "Add RSS feed to selected category",
        add_category_btn: "Add category",

        // Navigation
        refresh: "Refresh",
        scroll_top: "Top",
        theme: "Theme",
        recommendations: "Recommendations",
        menu: "Menu",
        refresh_current_feed: "Refresh current feed",
        scroll_to_top: "Scroll to top",
        toggle_theme: "Toggle theme",
        show_recommendations: "Show recommended RSS feeds",
        open_menu: "Open actions menu",

        // Modals
        share: "Share",
        copy_link: "Copy link",
        close: "Close",

        // Footer
        footer_description: "Modern RSS reader with multilingual support and beautiful design",
        footer_features: "Features",
        footer_multilingual: "Multilingual",
        footer_offline: "Offline mode",
        footer_search: "Article search",
        footer_categories: "Categories",
        footer_languages: "Languages",
        footer_created_by: "Made with ❤️",
        footer_year: "2025",

        // Mobile menu
        actions_menu_title: "Actions",
        close_menu: "Close menu",
        actions_navigation: "Actions navigation",
        main_actions_section: "Main actions",
        refresh_feed: "Refresh feed",
        refresh_all_feeds: "Refresh all feeds",
        change_theme: "Change theme",
        feed_management_section: "Feed management",
        recommended_feeds: "Recommended feeds",
        export_feeds: "Export feeds",
        import_feeds: "Import feeds",
        install_app: "Install app",
        dangerous_actions_section: "Dangerous actions",
        clear_all_feeds: "Clear all feeds",

        // Modals
        close_modal: "Close modal",
        normal_mode: "Normal",
        web_mode: "Web page",
        share_modal_title: "Share",
        close_share_modal: "Close share modal",
        close_feed_manage: "Close feed management",
        feed_management_title: "Feed management",

        // Additional translations
        refresh_all_feeds: "Refresh all feeds",
        export_feeds: "Export feeds to OPML file",
        import_feeds: "Import feeds from OPML file",
        install_app: "Install app as PWA",
        clear_all_feeds: "Delete all RSS feeds",

        // Notifications
        feed_added: "Feed added",
        feed_removed: "Feed removed",
        category_added: "Category added",
        error_invalid_url: "Invalid URL",
        error_feed_exists: "Feed already exists",

        // Placeholders and messages
        no_feeds_message: "No feeds to display",
        loading_feed: "Loading feed...",
        feed_load_error: "Feed loading error",
        no_articles: "No articles in this feed",

        // Buttons and actions
        add_feed: "Add feed",
        remove_feed: "Remove feed",
        edit_feed: "Edit feed",
        refresh_feed: "Refresh feed",

        // Categories
        no_category: "No category",
        create_category: "Create category",
        category_name: "Category name",

        // Search
        search_placeholder: "Search articles...",
        no_search_results: "Nothing found",

        // Time
        just_now: "just now",
        minutes_ago: "minutes ago",
        hours_ago: "hours ago",
        days_ago: "days ago",

        // Statistics
        total_feeds: "Total feeds",
        total_articles: "Total articles",
        last_update: "Last update",

        // Recommendations
        recommended_rss_feeds: "Recommended RSS Feeds",
        recommendations_description: "Choose quality news sources for topics that interest you",
        close_recommendations: "Close recommendations",
        settings: "Settings",
        statistics: "Statistics",
        export: "Export",
        all: "All",
        add_feed: "Add",
        added: "Added",
        quality: "Quality",
        language: "Language",
        country: "Country",
        no_recommendations: "No recommendations for selected filters",

        // Recommendation settings
        recommendation_settings: "Recommendation Settings",
        enable_recommendations: "Enable recommendations",
        show_on_startup: "Show on startup",
        max_recommendations: "Maximum recommendations",
        min_quality: "Minimum quality",
        sort_by: "Sort by",
        sort_by_quality: "By quality",
        sort_by_name: "By name",
        sort_by_country: "By country",
        show_country_flags: "Show country flags",
        group_by_country: "Group by country",
        preferred_languages: "Preferred languages",
        categories_for_recommendations: "Categories for recommendations",
        save: "Save",
        reset: "Reset",

        // Recommendation statistics
        recommendations_statistics: "Recommendations Statistics",
        general_info: "General Information",
        total_feeds: "Total feeds",
        total_categories: "Categories",
        total_countries: "Countries",
        quality_distribution: "Quality Distribution",
        high_quality: "High (9-10)",
        medium_quality: "Medium (7-8)",
        low_quality: "Low (1-6)",
        languages: "Languages",
        top_countries: "Top Countries",
        categories_stats: "Categories",
        close_statistics: "Close statistics",
        close_settings: "Close settings",
        settings_saved: "Settings saved",
        settings_reset: "Settings reset",

        // News modal
        publication_date: "Publication date",
        article_author: "Article author",
        author: "Author",
        go_to_source: "Go to source",
        page_load_error: "Failed to load page",
        embedding_not_allowed: "Site does not allow embedding or is unavailable.",
        open_in_new_tab: "Open in new tab",

        // Additional interface elements
        loading: "Loading...",
        error: "Error",
        retry: "Retry",
        cancel: "Cancel",
        confirm: "Confirm",
        delete: "Delete",
        edit: "Edit",
        save: "Save",

        // Error messages
        network_error: "Network error",
        invalid_feed: "Invalid feed format",
        feed_not_found: "Feed not found",
        access_denied: "Access denied",

        // Time formatting
        now: "now",
        minute: "minute",
        minutes: "minutes",
        hour: "hour",
        hours: "hours",
        day: "day",
        days: "days",
        week: "week",
        weeks: "weeks",
        month: "month",
        months: "months",
        year: "year",
        years: "years",
        ago: "ago",

        // Additional translations for statistics
        close_statistics: "Close statistics",
        categories_distribution: "Categories Distribution"
    },

    uk: {
        // Основний інтерфейс
        rss_url_label: "URL RSS-стрічки",
        rss_url_placeholder: "Введіть URL RSS-стрічки",
        rss_help: "Введіть повний URL RSS або Atom стрічки",
        category_label: "Категорія",
        category_select_aria: "Оберіть категорію",
        all_categories: "Всі категорії",
        add_feed_btn: "Додати",
        add_help: "Додати RSS стрічку до обраної категорії",
        add_category_btn: "Додати категорію",

        // Навігація
        refresh: "Оновити",
        scroll_top: "Вгору",
        theme: "Тема",
        recommendations: "Рекомендації",
        menu: "Меню",

        // Модальні вікна
        share: "Поділитися",
        copy_link: "Копіювати посилання",
        close: "Закрити",

        // Футер
        footer_description: "Сучасний RSS-читач з підтримкою багатьох мов та красивим дизайном",
        footer_features: "Можливості",
        footer_multilingual: "Багатомовність",
        footer_offline: "Офлайн режим",
        footer_search: "Пошук статей",
        footer_categories: "Категорії",
        footer_languages: "Мови",
        footer_created_by: "Створено з ❤️",
        footer_year: "2025",

        // Мобільне меню
        actions_menu_title: "Дії",
        close_menu: "Закрити меню",
        actions_navigation: "Навігація по діях",
        main_actions_section: "Основні дії",
        refresh_feed: "Оновити стрічку",
        refresh_all_feeds: "Оновити всі стрічки",
        change_theme: "Змінити тему",
        feed_management_section: "Управління стрічками",
        recommended_feeds: "Рекомендовані стрічки",
        export_feeds: "Експорт стрічок",
        import_feeds: "Імпорт стрічок",
        install_app: "Встановити додаток",
        dangerous_actions_section: "Небезпечні дії",
        clear_all_feeds: "Очистити всі стрічки",

        // Модальні вікна
        close_modal: "Закрити модальне вікно",
        normal_mode: "Звичайний",
        web_mode: "Веб-сторінка",
        share_modal_title: "Поділитися",
        close_share_modal: "Закрити вікно поділитися",
        close_feed_manage: "Закрити управління стрічками",
        feed_management_title: "Управління стрічками",

        // Додаткові переклади
        refresh_all_feeds: "Оновити всі стрічки",
        export_feeds: "Експортувати стрічки в OPML файл",
        import_feeds: "Імпортувати стрічки з OPML файлу",
        install_app: "Встановити додаток як PWA",
        clear_all_feeds: "Видалити всі RSS стрічки",

        // Сповіщення
        feed_added: "Стрічку додано",
        feed_removed: "Стрічку видалено",
        category_added: "Категорію додано",
        error_invalid_url: "Неправильний URL",
        error_feed_exists: "Стрічка вже існує",

        // Заповнювачі та повідомлення
        no_feeds_message: "Немає стрічок для відображення",
        loading_feed: "Завантаження стрічки...",
        feed_load_error: "Помилка завантаження стрічки",
        no_articles: "Немає статей у цій стрічці",

        // Кнопки та дії
        add_feed: "Додати стрічку",
        remove_feed: "Видалити стрічку",
        edit_feed: "Редагувати стрічку",
        refresh_feed: "Оновити стрічку",

        // Категорії
        no_category: "Без категорії",
        create_category: "Створити категорію",
        category_name: "Назва категорії",

        // Пошук
        search_placeholder: "Пошук по статтях...",
        no_search_results: "Нічого не знайдено",

        // Час
        just_now: "щойно",
        minutes_ago: "хвилин тому",
        hours_ago: "годин тому",
        days_ago: "днів тому",

        // Статистика
        total_feeds: "Всього стрічок",
        total_articles: "Всього статей",
        last_update: "Останнє оновлення",

        // Рекомендації
        recommended_rss_feeds: "Рекомендовані RSS стрічки",
        recommendations_description: "Оберіть якісні джерела новин за темами, які вас цікавлять",
        close_recommendations: "Закрити рекомендації",
        settings: "Налаштування",
        statistics: "Статистика",
        export: "Експорт",
        all: "Всі",
        add_feed: "Додати",
        added: "Додано",
        quality: "Якість",
        language: "Мова",
        country: "Країна",
        no_recommendations: "Немає рекомендацій для обраних фільтрів",

        // Модальне вікно новини
        publication_date: "Дата публікації",
        article_author: "Автор статті",
        author: "Автор",
        go_to_source: "Перейти до джерела",
        page_load_error: "Не вдалося завантажити сторінку",
        embedding_not_allowed: "Сайт не дозволяє вбудовування або недоступний.",
        open_in_new_tab: "Відкрити в новій вкладці",

        // Форматування часу
        now: "зараз",
        minute: "хвилина",
        minutes: "хвилин",
        hour: "година",
        hours: "годин",
        day: "день",
        days: "днів",
        week: "тиждень",
        weeks: "тижнів",
        month: "місяць",
        months: "місяців",
        year: "рік",
        years: "років",
        ago: "тому",

        // Статистика рекомендацій
        recommendations_statistics: "Статистика рекомендацій",
        general_info: "Загальна інформація",
        total_feeds: "Всього стрічок",
        total_categories: "Категорій",
        total_countries: "Країн",
        quality_distribution: "Розподіл за якістю",
        high_quality: "Високе (9-10)",
        medium_quality: "Середнє (7-8)",
        low_quality: "Низьке (1-6)",
        languages: "Мови",
        top_countries: "Топ країн",
        categories_stats: "Категорії",
        close_statistics: "Закрити статистику",
        close_settings: "Закрити налаштування",
        settings_saved: "Налаштування збережено",
        settings_reset: "Налаштування скинуто",

        // Додаткові переклади для статистики
        close_statistics: "Закрити статистику",
        categories_distribution: "Розподіл по категоріях"
    },

    pl: {
        // Główny interfejs
        rss_url_label: "URL kanału RSS",
        rss_url_placeholder: "Wprowadź URL kanału RSS",
        rss_help: "Wprowadź pełny URL kanału RSS lub Atom",
        category_label: "Kategoria",
        category_select_aria: "Wybierz kategorię",
        all_categories: "Wszystkie kategorie",
        add_feed_btn: "Dodaj",
        add_help: "Dodaj kanał RSS do wybranej kategorii",
        add_category_btn: "Dodaj kategorię",

        // Nawigacja
        refresh: "Odśwież",
        scroll_top: "Na górę",
        theme: "Motyw",
        recommendations: "Rekomendacje",
        menu: "Menu",

        // Okna modalne
        share: "Udostępnij",
        copy_link: "Kopiuj link",
        close: "Zamknij",

        // Stopka
        footer_description: "Nowoczesny czytnik RSS z obsługą wielu języków i pięknym designem",
        footer_features: "Funkcje",
        footer_multilingual: "Wielojęzyczność",
        footer_offline: "Tryb offline",
        footer_search: "Wyszukiwanie artykułów",
        footer_categories: "Kategorie",
        footer_languages: "Języki",
        footer_created_by: "Stworzone z ❤️",
        footer_year: "2025",

        // Menu mobilne
        actions_menu_title: "Akcje",
        close_menu: "Zamknij menu",
        actions_navigation: "Nawigacja akcji",
        main_actions_section: "Główne akcje",
        refresh_feed: "Odśwież kanał",
        refresh_all_feeds: "Odśwież wszystkie kanały",
        change_theme: "Zmień motyw",
        feed_management_section: "Zarządzanie kanałami",
        recommended_feeds: "Polecane kanały",
        export_feeds: "Eksport kanałów",
        import_feeds: "Import kanałów",
        install_app: "Zainstaluj aplikację",
        dangerous_actions_section: "Niebezpieczne akcje",
        clear_all_feeds: "Wyczyść wszystkie kanały",

        // Okna modalne
        close_modal: "Zamknij okno modalne",
        normal_mode: "Normalny",
        web_mode: "Strona internetowa",
        share_modal_title: "Udostępnij",
        close_share_modal: "Zamknij okno udostępniania",
        close_feed_manage: "Zamknij zarządzanie kanałami",
        feed_management_title: "Zarządzanie kanałami",

        // Dodatkowe tłumaczenia
        refresh_all_feeds: "Odśwież wszystkie kanały",
        export_feeds: "Eksportuj kanały do pliku OPML",
        import_feeds: "Importuj kanały z pliku OPML",
        install_app: "Zainstaluj aplikację jako PWA",
        clear_all_feeds: "Usuń wszystkie kanały RSS",

        // Powiadomienia
        feed_added: "Kanał dodany",
        feed_removed: "Kanał usunięty",
        category_added: "Kategoria dodana",
        error_invalid_url: "Nieprawidłowy URL",
        error_feed_exists: "Kanał już istnieje",

        // Symbole zastępcze i wiadomości
        no_feeds_message: "Brak kanałów do wyświetlenia",
        loading_feed: "Ładowanie kanału...",
        feed_load_error: "Błąd ładowania kanału",
        no_articles: "Brak artykułów w tym kanale",

        // Przyciski i akcje
        add_feed: "Dodaj kanał",
        remove_feed: "Usuń kanał",
        edit_feed: "Edytuj kanał",
        refresh_feed: "Odśwież kanał",

        // Kategorie
        no_category: "Bez kategorii",
        create_category: "Utwórz kategorię",
        category_name: "Nazwa kategorii",

        // Wyszukiwanie
        search_placeholder: "Szukaj artykułów...",
        no_search_results: "Nic nie znaleziono",

        // Czas
        just_now: "właśnie teraz",
        minutes_ago: "minut temu",
        hours_ago: "godzin temu",
        days_ago: "dni temu",

        // Statystyki
        total_feeds: "Łącznie kanałów",
        total_articles: "Łącznie artykułów",
        last_update: "Ostatnia aktualizacja",

        // Re
        recommended_rss_feeds: "Polecane kanały RSS",
        recommendations_description: "Wybierz wysokiej jakości źródła wiadomości na interesujące Cię tematy",
        close_recommendations: "Zamknij rekomendacje",
        settings: "Ustawienia",
        statistics: "Statystyki",
        export: "Eksport",
        all: "Wszystkie",
        add_feed: "Dodaj",
        added: "Dodano",
        quality: "Jakość",
        language: "Język",
        country: "Kraj",
        no_recommendations: "Brak rekomendacji dla wybranych filtrów",

        // Okno modalne wiadomości
        publication_date: "Data publikacji",
        article_author: "Autor artykułu",
        author: "Autor",
        go_to_source: "Przejdź do źródła",
        page_load_error: "Nie udało się załadować strony",
        embedding_not_allowed: "Strona nie pozwala na osadzanie lub jest niedostępna.",
        open_in_new_tab: "Otwórz w nowej karcie",

        // Formatowanie czasu
        now: "teraz",
        minute: "minuta",
        minutes: "minut",
        hour: "godzina",
        hours: "godzin",
        day: "dzień",
        days: "dni",
        week: "tydzień",
        weeks: "tygodni",
        month: "miesiąc",
        months: "miesięcy",
        year: "rok",
        years: "lat",
        ago: "temu",

        // Statystyki rekomendacji
        recommendations_statistics: "Statystyki rekomendacji",
        general_info: "Informacje ogólne",
        total_feeds: "Łącznie kanałów",
        total_categories: "Kategorii",
        total_countries: "Krajów",
        quality_distribution: "Rozkład jakości",
        high_quality: "Wysokie (9-10)",
        medium_quality: "Średnie (7-8)",
        low_quality: "Niskie (1-6)",
        languages: "Języki",
        top_countries: "Najlepsze kraje",
        categories_stats: "Kategorie",
        close_statistics: "Zamknij statystyki",
        close_settings: "Zamknij ustawienia",
        settings_saved: "Ustawienia zapisane",
        settings_reset: "Ustawienia zresetowane",

        // Dodatkowe tłumaczenia dla statystyk
        close_statistics: "Zamknij statystyki"
    },

    cs: {
        // Hlavní rozhraní
        rss_url_label: "URL RSS kanálu",
        rss_url_placeholder: "Zadejte URL RSS kanálu",
        rss_help: "Zadejte úplnou URL RSS nebo Atom kanálu",
        category_label: "Kategorie",
        category_select_aria: "Vyberte kategorii",
        all_categories: "Všechny kategorie",
        add_feed_btn: "Přidat",
        add_help: "Přidat RSS kanál do vybrané kategorie",
        add_category_btn: "Přidat kategorii",

        // Navigace
        refresh: "Obnovit",
        scroll_top: "Nahoru",
        theme: "Téma",
        recommendations: "Doporučení",
        menu: "Menu",

        // Modální okna
        share: "Sdílet",
        copy_link: "Kopírovat odkaz",
        close: "Zavřít",

        // Zápatí
        footer_description: "Moderní RSS čtečka s podporou více jazyků a krásným designem",
        footer_features: "Funkce",
        footer_multilingual: "Vícejazyčnost",
        footer_offline: "Offline režim",
        footer_search: "Vyhledávání článků",
        footer_categories: "Kategorie",
        footer_languages: "Jazyky",
        footer_created_by: "Vytvořeno s ❤️",
        footer_year: "2025",

        // Mobilní menu
        actions_menu_title: "Akce",
        close_menu: "Zavřít menu",
        actions_navigation: "Navigace akcí",
        main_actions_section: "Hlavní akce",
        refresh_feed: "Obnovit kanál",
        refresh_all_feeds: "Obnovit všechny kanály",
        change_theme: "Změnit téma",
        feed_management_section: "Správa kanálů",
        recommended_feeds: "Doporučené kanály",
        export_feeds: "Export kanálů",
        import_feeds: "Import kanálů",
        install_app: "Nainstalovat aplikaci",
        dangerous_actions_section: "Nebezpečné akce",
        clear_all_feeds: "Vymazat všechny kanály",

        // Modální okna
        close_modal: "Zavřít modální okno",
        normal_mode: "Normální",
        web_mode: "Webová stránka",
        share_modal_title: "Sdílet",
        close_share_modal: "Zavřít okno sdílení",
        close_feed_manage: "Zavřít správu kanálů",
        feed_management_title: "Správa kanálů",

        // Další překlady
        refresh_all_feeds: "Obnovit všechny kanály",
        export_feeds: "Exportovat kanály do OPML souboru",
        import_feeds: "Importovat kanály z OPML souboru",
        install_app: "Nainstalovat aplikaci jako PWA",
        clear_all_feeds: "Smazat všechny RSS kanály",

        // Oznámení
        feed_added: "Kanál přidán",
        feed_removed: "Kanál odstraněn",
        category_added: "Kategorie přidána",
        error_invalid_url: "Neplatná URL",
        error_feed_exists: "Kanál již existuje",

        // Zástupné symboly a zprávy
        no_feeds_message: "Žádné kanály k zobrazení",
        loading_feed: "Načítání kanálu...",
        feed_load_error: "Chyba načítání kanálu",
        no_articles: "Žádné články v tomto kanálu",

        // Tlačítka a akce
        add_feed: "Přidat kanál",
        remove_feed: "Odstranit kanál",
        edit_feed: "Upravit kanál",
        refresh_feed: "Obnovit kanál",

        // Kategorie
        no_category: "Bez kategorie",
        create_category: "Vytvořit kategorii",
        category_name: "Název kategorie",

        // Vyhledávání
        search_placeholder: "Hledat články...",
        no_search_results: "Nic nenalezeno",

        // Čas
        just_now: "právě teď",
        minutes_ago: "minut zpět",
        hours_ago: "hodin zpět",
        days_ago: "dní zpět",

        // Statistiky
        total_feeds: "Celkem kanálů",
        total_articles: "Celkem článků",
        last_update: "Poslední aktualizace",

        // Doporučení
        recommended_rss_feeds: "Doporučené RSS kanály",
        recommendations_description: "Vyberte kvalitní zdroje zpráv na témata, která vás zajímají",
        close_recommendations: "Zavřít doporučení",
        settings: "Nastavení",
        statistics: "Statistiky",
        export: "Export",
        all: "Všechny",
        add_feed: "Přidat",
        added: "Přidáno",
        quality: "Kvalita",
        language: "Jazyk",
        country: "Země",
        no_recommendations: "Žádná doporučení pro vybrané filtry",

        // Modální okno zprávy
        publication_date: "Datum publikace",
        article_author: "Autor článku",
        author: "Autor",
        go_to_source: "Přejít ke zdroji",
        page_load_error: "Nepodařilo se načíst stránku",
        embedding_not_allowed: "Stránka neumožňuje vkládání nebo není dostupná.",
        open_in_new_tab: "Otevřít v nové kartě",

        // Formátování času
        now: "nyní",
        minute: "minuta",
        minutes: "minut",
        hour: "hodina",
        hours: "hodin",
        day: "den",
        days: "dní",
        week: "týden",
        weeks: "týdnů",
        month: "měsíc",
        months: "měsíců",
        year: "rok",
        years: "let",
        ago: "zpět",

        // Statistiky doporučení
        recommendations_statistics: "Statistiky doporučení",
        general_info: "Obecné informace",
        total_feeds: "Celkem kanálů",
        total_categories: "Kategorií",
        total_countries: "Zemí",
        quality_distribution: "Rozdělení kvality",
        high_quality: "Vysoké (9-10)",
        medium_quality: "Střední (7-8)",
        low_quality: "Nízké (1-6)",
        languages: "Jazyky",
        top_countries: "Top země",
        categories_stats: "Kategorie",
        close_statistics: "Zavřít statistiky",
        close_settings: "Zavřít nastavení",
        settings_saved: "Nastavení uloženo",
        settings_reset: "Nastavení resetováno",

        // Další překlady pro statistiky
        close_statistics: "Zavřít statistiky"
    },

    bg: {
        // Основен интерфейс
        rss_url_label: "URL на RSS емисия",
        rss_url_placeholder: "Въведете URL на RSS емисия",
        rss_help: "Въведете пълен URL на RSS или Atom емисия",
        category_label: "Категория",
        category_select_aria: "Изберете категория",
        all_categories: "Всички категории",
        add_feed_btn: "Добави",
        add_help: "Добави RSS емисия към избраната категория",
        add_category_btn: "Добави категория",

        // Навигация
        refresh: "Обнови",
        scroll_top: "Нагоре",
        theme: "Тема",
        recommendations: "Препоръки",
        menu: "Меню",

        // Модални прозорци
        share: "Сподели",
        copy_link: "Копирай връзка",
        close: "Затвори",

        // Долен колонтитул
        footer_description: "Модерен RSS четец с поддръжка на множество езици и красив дизайн",
        footer_features: "Функции",
        footer_multilingual: "Многоезичност",
        footer_offline: "Офлайн режим",
        footer_search: "Търсене на статии",
        footer_categories: "Категории",
        footer_languages: "Езици",
        footer_created_by: "Създадено с ❤️",
        footer_year: "2025",

        // Мобилно меню
        actions_menu_title: "Действия",
        close_menu: "Затвори меню",
        actions_navigation: "Навигация на действията",
        main_actions_section: "Основни действия",
        refresh_feed: "Обнови емисия",
        refresh_all_feeds: "Обнови всички емисии",
        change_theme: "Смени тема",
        feed_management_section: "Управление на емисии",
        recommended_feeds: "Препоръчани емисии",
        export_feeds: "Експорт на емисии",
        import_feeds: "Импорт на емисии",
        install_app: "Инсталирай приложение",
        dangerous_actions_section: "Опасни действия",
        clear_all_feeds: "Изчисти всички емисии",

        // Модални прозорци
        close_modal: "Затвори модален прозорец",
        normal_mode: "Нормален",
        web_mode: "Уеб страница",
        share_modal_title: "Сподели",
        close_share_modal: "Затвори прозорец за споделяне",
        close_feed_manage: "Затвори управление на емисии",
        feed_management_title: "Управление на емисии",

        // Допълнителни преводи
        refresh_all_feeds: "Обнови всички емисии",
        export_feeds: "Експортирай емисии в OPML файл",
        import_feeds: "Импортирай емисии от OPML файл",
        install_app: "Инсталирай приложение като PWA",
        clear_all_feeds: "Изтрий всички RSS емисии",

        // Известия
        feed_added: "Емисията е добавена",
        feed_removed: "Емисията е премахната",
        category_added: "Категорията е добавена",
        error_invalid_url: "Невалиден URL",
        error_feed_exists: "Емисията вече съществува",

        // Заместители и съобщения
        no_feeds_message: "Няма емисии за показване",
        loading_feed: "Зареждане на емисия...",
        feed_load_error: "Грешка при зареждане на емисия",
        no_articles: "Няма статии в тази емисия",

        // Бутони и действия
        add_feed: "Добави емисия",
        remove_feed: "Премахни емисия",
        edit_feed: "Редактирай емисия",
        refresh_feed: "Обнови емисия",

        // Категории
        no_category: "Без категория",
        create_category: "Създай категория",
        category_name: "Име на категория",

        // Търсене
        search_placeholder: "Търси статии...",
        no_search_results: "Нищо не е намерено",

        // Време
        just_now: "току-що",
        minutes_ago: "минути преди",
        hours_ago: "часове преди",
        days_ago: "дни преди",

        // Статистики
        total_feeds: "Общо емисии",
        total_articles: "Общо статии",
        last_update: "Последна актуализация",

        // Препоръки
        recommended_rss_feeds: "Препоръчани RSS емисии",
        recommendations_description: "Изберете качествени източници на новини по теми, които ви интересуват",
        close_recommendations: "Затвори препоръки",
        settings: "Настройки",
        statistics: "Статистики",
        export: "Експорт",
        all: "Всички",
        add_feed: "Добави",
        added: "Добавено",
        quality: "Качество",
        language: "Език",
        country: "Страна",
        no_recommendations: "Няма препоръки за избраните филтри",

        // Модален прозорец за новини
        publication_date: "Дата на публикуване",
        article_author: "Автор на статията",
        author: "Автор",
        go_to_source: "Отиди към източника",
        page_load_error: "Неуспешно зареждане на страницата",
        embedding_not_allowed: "Сайтът не позволява вграждане или не е достъпен.",
        open_in_new_tab: "Отвори в нов таб",

        // Форматиране на време
        now: "сега",
        minute: "минута",
        minutes: "минути",
        hour: "час",
        hours: "часа",
        day: "ден",
        days: "дни",
        week: "седмица",
        weeks: "седмици",
        month: "месец",
        months: "месеца",
        year: "година",
        years: "години",
        ago: "преди",

        // Статистики рекомендации
        recommendations_statistics: "Статистики на препоръките",
        general_info: "Обща информация",
        total_feeds: "Общо емисии",
        total_categories: "Категории",
        total_countries: "Страни",
        quality_distribution: "Разпределение по качество",
        high_quality: "Високо (9-10)",
        medium_quality: "Средно (7-8)",
        low_quality: "Ниско (1-6)",
        languages: "Езици",
        top_countries: "Топ страни",
        categories_stats: "Категории",
        close_statistics: "Затвори статистики",
        close_settings: "Затвори настройки",
        settings_saved: "Настройките са запазени",
        settings_reset: "Настройките са нулирани",

        // Допълнителни преводи за статистики
        close_statistics: "Затвори статистики"
    },

    sr: {
        // Glavni interfejs
        rss_url_label: "URL RSS kanala",
        rss_url_placeholder: "Unesite URL RSS kanala",
        rss_help: "Unesite potpunu URL RSS ili Atom kanala",
        category_label: "Kategorija",
        category_select_aria: "Izaberite kategoriju",
        all_categories: "Sve kategorije",
        add_feed_btn: "Dodaj",
        add_help: "Dodaj RSS kanal u izabranu kategoriju",
        add_category_btn: "Dodaj kategoriju",

        // Navigacija
        refresh: "Osveži",
        scroll_top: "Na vrh",
        theme: "Tema",
        recommendations: "Preporuke",
        menu: "Meni",

        // Modalni prozori
        share: "Podeli",
        copy_link: "Kopiraj link",
        close: "Zatvori",

        // Podnožje
        footer_description: "Moderni RSS čitač sa podrškom za više jezika i lepim dizajnom",
        footer_features: "Mogućnosti",
        footer_multilingual: "Višejezičnost",
        footer_offline: "Offline režim",
        footer_search: "Pretraga članaka",
        footer_categories: "Kategorije",
        footer_languages: "Jezici",
        footer_created_by: "Napravljeno sa ❤️",
        footer_year: "2025",

        // Mobilni meni
        actions_menu_title: "Akcije",
        close_menu: "Zatvori meni",
        actions_navigation: "Navigacija akcija",
        main_actions_section: "Glavne akcije",
        refresh_feed: "Osveži kanal",
        refresh_all_feeds: "Osveži sve kanale",
        change_theme: "Promeni temu",
        feed_management_section: "Upravljanje kanalima",
        recommended_feeds: "Preporučeni kanali",
        export_feeds: "Izvoz kanala",
        import_feeds: "Uvoz kanala",
        install_app: "Instaliraj aplikaciju",
        dangerous_actions_section: "Opasne akcije",
        clear_all_feeds: "Obriši sve kanale",

        // Modalni prozori
        close_modal: "Zatvori modalni prozor",
        normal_mode: "Normalni",
        web_mode: "Veb stranica",
        share_modal_title: "Podeli",
        close_share_modal: "Zatvori prozor za deljenje",
        close_feed_manage: "Zatvori upravljanje kanalima",
        feed_management_title: "Upravljanje kanalima",

        // Dodatni prevodi
        refresh_all_feeds: "Osveži sve kanale",
        export_feeds: "Izvezi kanale u OPML fajl",
        import_feeds: "Uvezi kanale iz OPML fajla",
        install_app: "Instaliraj aplikaciju kao PWA",
        clear_all_feeds: "Obriši sve RSS kanale",

        // Obaveštenja
        feed_added: "Kanal je dodat",
        feed_removed: "Kanal je uklonjen",
        category_added: "Kategorija je dodana",
        error_invalid_url: "Neispravna URL",
        error_feed_exists: "Kanal već postoji",

        // Zamenski tekst i poruke
        no_feeds_message: "Nema kanala za prikaz",
        loading_feed: "Učitavanje kanala...",
        feed_load_error: "Greška pri učitavanju kanala",
        no_articles: "Nema članaka u ovom kanalu",

        // Dugmad i akcije
        add_feed: "Dodaj kanal",
        remove_feed: "Ukloni kanal",
        edit_feed: "Uredi kanal",
        refresh_feed: "Osveži kanal",

        // Kategorije
        no_category: "Bez kategorije",
        create_category: "Kreiraj kategoriju",
        category_name: "Ime kategorije",

        // Pretraga
        search_placeholder: "Pretraži članke...",
        no_search_results: "Ništa nije pronađeno",

        // Vreme
        just_now: "upravo sada",
        minutes_ago: "minuta ranije",
        hours_ago: "sati ranije",
        days_ago: "dana ranije",

        // Statistike
        total_feeds: "Ukupno kanala",
        total_articles: "Ukupno članaka",
        last_update: "Poslednje ažuriranje",

        // Preporuke
        recommended_rss_feeds: "Preporučeni RSS kanali",
        recommendations_description: "Izaberite kvalitetne izvore vesti na teme koje vas zanimaju",
        close_recommendations: "Zatvori preporuke",
        settings: "Podešavanja",
        statistics: "Statistike",
        export: "Izvoz",
        all: "Svi",
        add_feed: "Dodaj",
        added: "Dodano",
        quality: "Kvalitet",
        language: "Jezik",
        country: "Zemlja",
        no_recommendations: "Nema preporuka za izabrane filtere",

        // Modalni prozor vesti
        publication_date: "Datum objavljivanja",
        article_author: "Autor članka",
        author: "Autor",
        go_to_source: "Idi na izvor",
        page_load_error: "Neuspešno učitavanje stranice",
        embedding_not_allowed: "Sajt ne dozvoljava ugrađivanje ili nije dostupan.",
        open_in_new_tab: "Otvori u novom tabu",

        // Formatiranje vremena
        now: "sada",
        minute: "minut",
        minutes: "minuta",
        hour: "sat",
        hours: "sati",
        day: "dan",
        days: "dana",
        week: "nedelja",
        weeks: "nedelja",
        month: "mesec",
        months: "meseci",
        year: "godina",
        years: "godina",
        ago: "pre",

        // Statistike preporuka
        recommendations_statistics: "Statistike preporuka",
        general_info: "Opšte informacije",
        total_feeds: "Ukupno kanala",
        total_categories: "Kategorije",
        total_countries: "Zemlje",
        quality_distribution: "Raspodela kvaliteta",
        high_quality: "Visok (9-10)",
        medium_quality: "Srednji (7-8)",
        low_quality: "Nizak (1-6)",
        languages: "Jezici",
        top_countries: "Top zemlje",
        categories_stats: "Kategorije",
        close_statistics: "Zatvori statistike",
        close_settings: "Zatvori podešavanja",
        settings_saved: "Podešavanja sačuvana",
        settings_reset: "Podešavanja resetovana",

        // Dodatni prevodi za statistike
        close_statistics: "Zatvori statistike"
    }
};

// Текущий язык
let currentLanguage = 'ru';

// Функция для определения языка системы
function detectSystemLanguage() {
    const browserLang = navigator.language || navigator.userLanguage;
    const langCode = browserLang.split('-')[0].toLowerCase();

    // Проверяем, поддерживается ли язык
    if (translations[langCode]) {
        return langCode;
    }

    // Если язык не поддерживается, возвращаем русский по умолчанию
    return 'ru';
}

// Функция для получения сохраненного языка или автоопределения
function getPreferredLanguage() {
    const savedLang = localStorage.getItem('preferredLanguage');
    if (savedLang && translations[savedLang]) {
        return savedLang;
    }

    return detectSystemLanguage();
}

// Функция для применения переводов
function applyTranslations(lang) {
    const translation = translations[lang] || translations['ru'];

    // Обновляем элементы с data-i18n атрибутами
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translation[key]) {
            element.textContent = translation[key];
        }
    });

    // Обновляем placeholder'ы
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        if (translation[key]) {
            element.placeholder = translation[key];
        }
    });

    // Обновляем aria-label атрибуты
    document.querySelectorAll('[data-i18n-aria]').forEach(element => {
        const key = element.getAttribute('data-i18n-aria');
        if (translation[key]) {
            element.setAttribute('aria-label', translation[key]);
        }
    });

    // Обновляем lang атрибут документа
    document.documentElement.lang = lang;

    // Обновляем title страницы
    const titles = {
        ru: "Fluent RSS Reader — персональный агрегатор новостей",
        en: "Fluent RSS Reader — Personal News Aggregator",
        uk: "Fluent RSS Reader — Персональний агрегатор новин",
        pl: "Fluent RSS Reader — Osobisty agregator wiadomości",
        cs: "Fluent RSS Reader — Osobní agregátor zpráv",
        bg: "Fluent RSS Reader — Личен агрегатор на новини",
        sr: "Fluent RSS Reader — Lični agregator vesti"
    };

    if (titles[lang]) {
        document.title = titles[lang];
    }
}

// Функция для смены языка
function changeLanguage(lang) {
    if (!translations[lang]) {
        console.warn(`Language ${lang} not supported`);
        return;
    }

    currentLanguage = lang;
    localStorage.setItem('preferredLanguage', lang);

    // Применяем переводы
    applyTranslations(lang);

    // Обновляем селектор языка
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        languageSelect.value = lang;
    }

    console.log(`🌍 Язык изменен на: ${lang}`);
}

// Функция для инициализации языка
function initializeLanguage() {
    const preferredLang = getPreferredLanguage();

    console.log(`🌍 Определен предпочитаемый язык: ${preferredLang}`);
    console.log(`🌍 Язык системы: ${navigator.language}`);

    // Устанавливаем язык
    changeLanguage(preferredLang);
}

// Инициализация языка при загрузке DOM
document.addEventListener('DOMContentLoaded', function () {
    initializeLanguage();

    // Показываем приветствие с информацией о языке
    setTimeout(() => {
        showLanguageWelcome();
    }, 1000);
});

// Добавляем в глобальную область для отладки
window.changeLanguage = changeLanguage;
window.detectSystemLanguage = detectSystemLanguage;
window.translations = translations;
// Функция для показа уведомления о выборе языка при первом запуске
function showLanguageWelcome() {
    const hasSeenWelcome = localStorage.getItem('hasSeenLanguageWelcome');

    if (!hasSeenWelcome) {
        const detectedLang = detectSystemLanguage();
        const langNames = {
            ru: 'Русский',
            en: 'English',
            uk: 'Українська',
            pl: 'Polski',
            cs: 'Čeština',
            bg: 'Български',
            sr: 'Srpski'
        };

        const message = currentLanguage === 'ru'
            ? `Добро пожаловать! Мы автоматически определили ваш язык как ${langNames[detectedLang]}. Вы можете изменить язык в селекторе выше.`
            : `Welcome! We automatically detected your language as ${langNames[detectedLang]}. You can change the language in the selector above.`;

        setTimeout(() => {
            showNotification(message, 'info', 5000);
            localStorage.setItem('hasSeenLanguageWelcome', 'true');
        }, 2000);
    }
}

// Функция для получения информации о языке
function getLanguageInfo() {
    return {
        current: currentLanguage,
        detected: detectSystemLanguage(),
        browser: navigator.language,
        supported: Object.keys(translations),
        translations: translations[currentLanguage]
    };
}

// Добавляем в глобальную область для отладки
window.getLanguageInfo = getLanguageInfo;
window.showLanguageWelcome = showLanguageWelcome;
// Функция для показа переводимых уведомлений
function showTranslatedNotification(messageKey, type = 'success', duration = 3000) {
    const translation = translations[currentLanguage] || translations['ru'];
    const message = translation[messageKey] || messageKey;

    showNotification(message, type, duration);
}

// Обновленная функция для уведомлений с поддержкой длительности
function showNotification(message, type = 'success', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // Добавляем стили если их нет
    if (!document.querySelector('.notification-styles')) {
        const style = document.createElement('style');
        style.className = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: var(--spacing-xl);
                right: var(--spacing-xl);
                padding: var(--spacing-md) var(--spacing-lg);
                border-radius: var(--radius-md);
                color: white;
                font-weight: 500;
                z-index: var(--z-toast);
                opacity: 0;
                transform: translateX(100%);
                transition: all var(--transition-normal);
                max-width: 300px;
                word-wrap: break-word;
            }
            
            .notification.success {
                background: var(--success-color);
            }
            
            .notification.error {
                background: var(--error-color);
            }
            
            .notification.info {
                background: var(--info-color);
            }
            
            .notification.warning {
                background: var(--warning-color);
                color: var(--text-dark);
            }
            
            .notification.show {
                opacity: 1;
                transform: translateX(0);
            }
            
            @media (max-width: 768px) {
                .notification {
                    top: var(--spacing-lg);
                    right: var(--spacing-md);
                    left: var(--spacing-md);
                    max-width: none;
                }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Показываем уведомление
    setTimeout(() => notification.classList.add('show'), 100);

    // Убираем уведомление
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, duration);
}
// Функция для обновления динамического контента с переводами
function updateDynamicTranslations() {
    const translation = translations[currentLanguage] || translations['ru'];

    // Обновляем опции категорий
    const categorySelect = document.getElementById('categorySelect');
    if (categorySelect && categorySelect.options.length > 0) {
        categorySelect.options[0].textContent = translation.all_categories || 'Все категории';
    }

    // Обновляем плейсхолдеры если они есть
    const placeholderElements = document.querySelectorAll('.placeholder h2, .placeholder p');
    placeholderElements.forEach(element => {
        if (element.tagName === 'H2') {
            element.textContent = 'Fluent RSS Reader';
        } else if (element.tagName === 'P') {
            element.textContent = translation.footer_description || 'Современный RSS-ридер с поддержкой множества языков и красивым дизайном';
        }
    });

    // Обновляем сообщения об ошибках и загрузке
    const loadingElements = document.querySelectorAll('[data-loading-text]');
    loadingElements.forEach(element => {
        const key = element.getAttribute('data-loading-text');
        if (translation[key]) {
            element.textContent = translation[key];
        }
    });
}

// Функция для получения переведенного текста
function t(key, fallback = '') {
    const translation = translations[currentLanguage] || translations['ru'];
    return translation[key] || fallback || key;
}

// Улучшенная функция для форматирования времени с учетом языка
function formatTimeAgo(date, lang = currentLanguage) {
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffMs / 604800000);
    const diffMonths = Math.floor(diffMs / 2629746000);
    const diffYears = Math.floor(diffMs / 31556952000);

    const translation = translations[lang] || translations['ru'];

    if (diffMins < 1) {
        return translation.just_now || translation.now || 'только что';
    } else if (diffMins === 1) {
        return `1 ${translation.minute || 'минута'} ${translation.ago || 'назад'}`;
    } else if (diffMins < 60) {
        return `${diffMins} ${translation.minutes || 'минут'} ${translation.ago || 'назад'}`;
    } else if (diffHours === 1) {
        return `1 ${translation.hour || 'час'} ${translation.ago || 'назад'}`;
    } else if (diffHours < 24) {
        return `${diffHours} ${translation.hours || 'часов'} ${translation.ago || 'назад'}`;
    } else if (diffDays === 1) {
        return `1 ${translation.day || 'день'} ${translation.ago || 'назад'}`;
    } else if (diffDays < 7) {
        return `${diffDays} ${translation.days || 'дней'} ${translation.ago || 'назад'}`;
    } else if (diffWeeks === 1) {
        return `1 ${translation.week || 'неделя'} ${translation.ago || 'назад'}`;
    } else if (diffWeeks < 4) {
        return `${diffWeeks} ${translation.weeks || 'недель'} ${translation.ago || 'назад'}`;
    } else if (diffMonths === 1) {
        return `1 ${translation.month || 'месяц'} ${translation.ago || 'назад'}`;
    } else if (diffMonths < 12) {
        return `${diffMonths} ${translation.months || 'месяцев'} ${translation.ago || 'назад'}`;
    } else if (diffYears === 1) {
        return `1 ${translation.year || 'год'} ${translation.ago || 'назад'}`;
    } else {
        return `${diffYears} ${translation.years || 'лет'} ${translation.ago || 'назад'}`;
    }
}

// Функция для обновления всех переводов
function updateAllTranslations(lang) {
    applyTranslations(lang);
    updateDynamicTranslations();

    // Обновляем время в статьях если они есть
    const timeElements = document.querySelectorAll('.item-date[data-date]');
    timeElements.forEach(element => {
        const date = element.getAttribute('data-date');
        if (date) {
            element.textContent = formatTimeAgo(date, lang);
        }
    });
}

// Обновляем функцию смены языка
const originalChangeLanguage = changeLanguage;
changeLanguage = function (lang) {
    originalChangeLanguage(lang);
    updateAllTranslations(lang);
    updateAllDates();
    updatePlaceholders();

    // Обновляем модальное окно если оно открыто
    if (currentItem && modal.classList.contains('visible')) {
        updateModalContent();
    }

    // Обновляем рекомендации если они открыты
    const recommendationsModal = document.getElementById('recommendationsModal');
    if (recommendationsModal && recommendationsModal.classList.contains('visible')) {
        // Пересоздаем модальное окно рекомендаций с новыми переводами
        recommendationsModal.remove();
        createRecommendationsModal();
        updateRecommendationsContent();
        document.getElementById('recommendationsModal').style.display = 'flex';
        setTimeout(() => document.getElementById('recommendationsModal').classList.add('visible'), 10);
    }
};

// Функция для создания переводимых уведомлений с контекстом
function showContextualNotification(messageKey, context = {}, type = 'success', duration = 3000) {
    const translation = translations[currentLanguage] || translations['ru'];
    let message = translation[messageKey] || messageKey;

    // Заменяем плейсхолдеры в сообщении
    Object.keys(context).forEach(key => {
        message = message.replace(`{${key}}`, context[key]);
    });

    showNotification(message, type, duration);
}

// Функция для получения всех переводов текущего языка
function getCurrentTranslations() {
    return translations[currentLanguage] || translations['ru'];
}

// Функция для проверки полноты переводов
function checkTranslationCompleteness() {
    const baseKeys = Object.keys(translations['ru']);
    const completeness = {};

    Object.keys(translations).forEach(lang => {
        const langKeys = Object.keys(translations[lang]);
        const missing = baseKeys.filter(key => !langKeys.includes(key));
        const extra = langKeys.filter(key => !baseKeys.includes(key));

        completeness[lang] = {
            total: baseKeys.length,
            translated: langKeys.length,
            missing: missing,
            extra: extra,
            percentage: Math.round((langKeys.length / baseKeys.length) * 100)
        };
    });

    return completeness;
}

window.t = t;
window.formatTimeAgo = formatTimeAgo;
window.updateAllTranslations = updateAllTranslations;
window.showContextualNotification = showContextualNotification;
window.getCurrentTranslations = getCurrentTranslations;
window.checkTranslationCompleteness = checkTranslationCompleteness;
// Функция для получения локализованных рекомендуемых лент
function getLocalizedRecommendedFeeds() {
    const lang = currentLanguage;
    const translation = translations[lang] || translations['ru'];

    // Базовые категории с переводами
    const localizedCategories = {
        ru: {
            "🌍 Мировые новости": "🌍 Мировые новости",
            "💻 Технологии": "💻 Технологии",
            "🔬 Наука": "🔬 Наука",
            "⚽ Спорт": "⚽ Спорт",
            "🎬 Развлечения": "🎬 Развлечения",
            "💰 Экономика": "💰 Экономика",
            "🏥 Здоровье": "🏥 Здоровье",
            "🌱 Экология": "🌱 Экология"
        },
        en: {
            "🌍 Мировые новости": "🌍 World News",
            "💻 Технологии": "💻 Technology",
            "🔬 Наука": "🔬 Science",
            "⚽ Спорт": "⚽ Sports",
            "🎬 Развлечения": "🎬 Entertainment",
            "💰 Экономика": "💰 Business",
            "🏥 Здоровье": "🏥 Health",
            "🌱 Экология": "🌱 Environment"
        },
        uk: {
            "🌍 Мировые новости": "🌍 Світові новини",
            "💻 Технологии": "💻 Технології",
            "🔬 Наука": "🔬 Наука",
            "⚽ Спорт": "⚽ Спорт",
            "🎬 Развлечения": "🎬 Розваги",
            "💰 Экономика": "💰 Економіка",
            "🏥 Здоровье": "🏥 Здоров'я",
            "🌱 Экология": "🌱 Екологія"
        },
        pl: {
            "🌍 Мировые новости": "🌍 Wiadomości światowe",
            "💻 Технологии": "💻 Technologia",
            "🔬 Наука": "🔬 Nauka",
            "⚽ Спорт": "⚽ Sport",
            "🎬 Развлечения": "🎬 Rozrywka",
            "💰 Экономика": "💰 Biznes",
            "🏥 Здоровье": "🏥 Zdrowie",
            "🌱 Экология": "🌱 Środowisko"
        },
        cs: {
            "🌍 Мировые новости": "🌍 Světové zprávy",
            "💻 Технологии": "💻 Technologie",
            "🔬 Наука": "🔬 Věda",
            "⚽ Спорт": "⚽ Sport",
            "🎬 Развлечения": "🎬 Zábava",
            "💰 Экономика": "💰 Obchod",
            "🏥 Здоровье": "🏥 Zdraví",
            "🌱 Экология": "🌱 Životní prostředí"
        },
        bg: {
            "🌍 Мировые новости": "🌍 Световни новини",
            "💻 Технологии": "💻 Технологии",
            "🔬 Наука": "🔬 Наука",
            "⚽ Спорт": "⚽ Спорт",
            "🎬 Развлечения": "🎬 Забавления",
            "💰 Экономика": "💰 Бизнес",
            "🏥 Здоровье": "🏥 Здраве",
            "🌱 Экология": "🌱 Околна среда"
        },
        sr: {
            "🌍 Мировые новости": "🌍 Svetske vesti",
            "💻 Технологии": "💻 Tehnologija",
            "🔬 Наука": "🔬 Nauka",
            "⚽ Спорт": "⚽ Sport",
            "🎬 Развлечения": "🎬 Zabava",
            "💰 Экономика": "💰 Biznis",
            "🏥 Здоровье": "🏥 Zdravlje",
            "🌱 Экология": "🌱 Životna sredina"
        }
    };

    const categoryTranslations = localizedCategories[lang] || localizedCategories['ru'];
    const localizedFeeds = {};

    // Фильтруем ленты по языку пользователя
    Object.entries(RECOMMENDED_FEEDS).forEach(([originalCategory, feeds]) => {
        const localizedCategory = categoryTranslations[originalCategory] || originalCategory;

        // Фильтруем ленты по языку
        const filteredFeeds = feeds.filter(feed => {
            // Если язык пользователя русский или украинский - показываем русскоязычные ленты
            if (['ru', 'uk'].includes(lang)) {
                return feed.language === 'ru' || feed.language === 'uk';
            }
            // Для других языков показываем английские + локальные ленты
            else if (lang === 'en') {
                return feed.language === 'en';
            }
            // Для славянских языков показываем английские + русские ленты
            else {
                return feed.language === 'en' || feed.language === 'ru';
            }
        });

        if (filteredFeeds.length > 0) {
            localizedFeeds[localizedCategory] = filteredFeeds;
        }
    });

    return localizedFeeds;
}

// Функция для получения рекомендаций по языку
function getLanguageSpecificRecommendations(targetLang = currentLanguage) {
    const languageFeeds = {};

    Object.entries(RECOMMENDED_FEEDS).forEach(([category, feeds]) => {
        const filteredFeeds = feeds.filter(feed => {
            // Логика фильтрации по языкам
            switch (targetLang) {
                case 'ru':
                case 'uk':
                case 'bg':
                case 'sr':
                    return ['ru', 'uk', 'bg', 'sr'].includes(feed.language);
                case 'pl':
                case 'cs':
                    return ['en', 'ru', 'pl', 'cs'].includes(feed.language);
                case 'en':
                default:
                    return feed.language === 'en';
            }
        });

        if (filteredFeeds.length > 0) {
            languageFeeds[category] = filteredFeeds;
        }
    });

    return languageFeeds;
}
// Функция для обновления всех дат при смене языка
function updateAllDates() {
    // Обновляем даты в карточках новостей
    const dateElements = document.querySelectorAll('.item-date[data-date]');
    dateElements.forEach(element => {
        const date = element.getAttribute('data-date');
        if (date) {
            element.textContent = formatDate(date);
            element.title = t('publication_date', 'Дата публикации');
        }
    });

    // Обновляем даты в модальном окне
    const modalDateElements = document.querySelectorAll('.modal-date');
    modalDateElements.forEach(element => {
        if (currentItem && currentItem.pubDate) {
            element.innerHTML = `📅 ${formatDate(currentItem.pubDate)}`;
            element.title = t('publication_date', 'Дата публикации');
        }
    });

    // Обновляем авторов в модальном окне
    const modalAuthorElements = document.querySelectorAll('.modal-author');
    modalAuthorElements.forEach(element => {
        if (currentItem && currentItem.author) {
            element.innerHTML = `✍️ ${currentItem.author}`;
            element.title = t('article_author', 'Автор статьи');
        }
    });

    // Обновляем ссылки на источники
    const sourceLinks = document.querySelectorAll('.source-link');
    sourceLinks.forEach(link => {
        if (link.textContent.includes('🔗')) {
            link.textContent = `🔗 ${t('go_to_source', 'Перейти к источнику')}`;
        } else if (link.textContent.includes('Открыть в новой вкладке') || link.textContent.includes('Open in new tab')) {
            link.textContent = `🔗 ${t('open_in_new_tab', 'Открыть в новой вкладке')}`;
        }
    });
}

// Функция для локализации сообщений об ошибках
function getLocalizedErrorMessage(errorType) {
    const errorMessages = {
        network: t('network_error', 'Ошибка сети'),
        invalid_feed: t('invalid_feed', 'Неверный формат ленты'),
        not_found: t('feed_not_found', 'Лента не найдена'),
        access_denied: t('access_denied', 'Доступ запрещен'),
        loading: t('loading', 'Загрузка...'),
        error: t('error', 'Ошибка')
    };

    return errorMessages[errorType] || errorMessages.error;
}

// Функция для локализации плейсхолдеров
function updatePlaceholders() {
    // Обновляем плейсхолдер поиска если он есть
    const searchInputs = document.querySelectorAll('input[type="search"], input[placeholder*="поиск"], input[placeholder*="search"]');
    searchInputs.forEach(input => {
        input.placeholder = t('search_placeholder', 'Поиск по статьям...');
    });

    // Обновляем сообщения о загрузке
    const loadingElements = document.querySelectorAll('.loading-message, .loading-text');
    loadingElements.forEach(element => {
        element.textContent = t('loading', 'Загрузка...');
    });

    // Обновляем сообщения об ошибках
    const errorElements = document.querySelectorAll('.error-message, .error-text');
    errorElements.forEach(element => {
        if (element.textContent.includes('Ошибка') || element.textContent.includes('Error')) {
            element.textContent = t('error', 'Ошибка');
        }
    });
}
// Функции для правильного склонения слов в зависимости от языка и числа
function getFeedsWord(count) {
    const lang = currentLanguage;

    switch (lang) {
        case 'ru':
            if (count % 10 === 1 && count % 100 !== 11) return 'лента';
            if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'ленты';
            return 'лент';
        case 'en':
            return count === 1 ? 'feed' : 'feeds';
        case 'uk':
            if (count % 10 === 1 && count % 100 !== 11) return 'стрічка';
            if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'стрічки';
            return 'стрічок';
        case 'pl':
            if (count === 1) return 'kanał';
            if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'kanały';
            return 'kanałów';
        case 'cs':
            if (count === 1) return 'kanál';
            if ([2, 3, 4].includes(count)) return 'kanály';
            return 'kanálů';
        case 'bg':
            return count === 1 ? 'емисия' : 'емисии';
        case 'sr':
            if (count % 10 === 1 && count % 100 !== 11) return 'kanal';
            if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'kanala';
            return 'kanala';
        default:
            return 'лент';
    }
}

function getCategoriesWord(count) {
    const lang = currentLanguage;

    switch (lang) {
        case 'ru':
            if (count % 10 === 1 && count % 100 !== 11) return 'категория';
            if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'категории';
            return 'категорий';
        case 'en':
            return count === 1 ? 'category' : 'categories';
        case 'uk':
            if (count % 10 === 1 && count % 100 !== 11) return 'категорія';
            if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'категорії';
            return 'категорій';
        case 'pl':
            if (count === 1) return 'kategoria';
            if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'kategorie';
            return 'kategorii';
        case 'cs':
            if (count === 1) return 'kategorie';
            if ([2, 3, 4].includes(count)) return 'kategorie';
            return 'kategorií';
        case 'bg':
            return count === 1 ? 'категория' : 'категории';
        case 'sr':
            if (count % 10 === 1 && count % 100 !== 11) return 'kategorija';
            if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'kategorije';
            return 'kategorija';
        default:
            return 'категорий';
    }
}

function getCountriesWord(count) {
    const lang = currentLanguage;

    switch (lang) {
        case 'ru':
            if (count % 10 === 1 && count % 100 !== 11) return 'страна';
            if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'страны';
            return 'стран';
        case 'en':
            return count === 1 ? 'country' : 'countries';
        case 'uk':
            if (count % 10 === 1 && count % 100 !== 11) return 'країна';
            if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'країни';
            return 'країн';
        case 'pl':
            if (count === 1) return 'kraj';
            if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'kraje';
            return 'krajów';
        case 'cs':
            if (count === 1) return 'země';
            if ([2, 3, 4].includes(count)) return 'země';
            return 'zemí';
        case 'bg':
            return count === 1 ? 'страна' : 'страни';
        case 'sr':
            if (count % 10 === 1 && count % 100 !== 11) return 'zemlja';
            if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'zemlje';
            return 'zemalja';
        default:
            return 'стран';
    }
}

function getLanguageName(langCode) {
    const lang = currentLanguage;

    const languageNames = {
        ru: {
            'ru': 'Русский',
            'en': 'Английский',
            'uk': 'Украинский',
            'pl': 'Польский',
            'cs': 'Чешский',
            'bg': 'Болгарский',
            'sr': 'Сербский'
        },
        en: {
            'ru': 'Russian',
            'en': 'English',
            'uk': 'Ukrainian',
            'pl': 'Polish',
            'cs': 'Czech',
            'bg': 'Bulgarian',
            'sr': 'Serbian'
        },
        uk: {
            'ru': 'Російська',
            'en': 'Англійська',
            'uk': 'Українська',
            'pl': 'Польська',
            'cs': 'Чеська',
            'bg': 'Болгарська',
            'sr': 'Сербська'
        },
        pl: {
            'ru': 'Rosyjski',
            'en': 'Angielski',
            'uk': 'Ukraiński',
            'pl': 'Polski',
            'cs': 'Czeski',
            'bg': 'Bułgarski',
            'sr': 'Serbski'
        },
        cs: {
            'ru': 'Ruština',
            'en': 'Angličtina',
            'uk': 'Ukrajinština',
            'pl': 'Polština',
            'cs': 'Čeština',
            'bg': 'Bulharština',
            'sr': 'Srbština'
        },
        bg: {
            'ru': 'Руски',
            'en': 'Английски',
            'uk': 'Украински',
            'pl': 'Полски',
            'cs': 'Чешки',
            'bg': 'Български',
            'sr': 'Сръбски'
        },
        sr: {
            'ru': 'Ruski',
            'en': 'Engleski',
            'uk': 'Ukrajinski',
            'pl': 'Poljski',
            'cs': 'Češki',
            'bg': 'Bugarski',
            'sr': 'Srpski'
        }
    };

    return languageNames[lang]?.[langCode] || langCode.toUpperCase();
}
// Функция для получения переведенного названия категории
function getLocalizedCategoryName(originalCategory) {
    const lang = currentLanguage;

    const categoryTranslations = {
        ru: {
            "🌍 Мировые новости": "🌍 Мировые новости",
            "💻 Технологии": "💻 Технологии",
            "🔬 Наука": "🔬 Наука",
            "⚽ Спорт": "⚽ Спорт",
            "🎬 Развлечения": "🎬 Развлечения",
            "💰 Экономика": "💰 Экономика",
            "🏥 Здоровье": "🏥 Здоровье",
            "🌱 Экология": "🌱 Экология"
        },
        en: {
            "🌍 Мировые новости": "🌍 World News",
            "💻 Технологии": "💻 Technology",
            "🔬 Наука": "🔬 Science",
            "⚽ Спорт": "⚽ Sports",
            "🎬 Развлечения": "🎬 Entertainment",
            "💰 Экономика": "💰 Business",
            "🏥 Здоровье": "🏥 Health",
            "🌱 Экология": "🌱 Environment"
        },
        uk: {
            "🌍 Мировые новости": "🌍 Світові новини",
            "💻 Технологии": "💻 Технології",
            "🔬 Наука": "🔬 Наука",
            "⚽ Спорт": "⚽ Спорт",
            "🎬 Развлечения": "🎬 Розваги",
            "💰 Экономика": "💰 Економіка",
            "🏥 Здоровье": "🏥 Здоров'я",
            "🌱 Экология": "🌱 Екологія"
        },
        pl: {
            "🌍 Мировые новости": "🌍 Wiadomości światowe",
            "💻 Технологии": "💻 Technologia",
            "🔬 Наука": "🔬 Nauka",
            "⚽ Спорт": "⚽ Sport",
            "🎬 Развлечения": "🎬 Rozrywka",
            "💰 Экономика": "💰 Biznes",
            "🏥 Здоровье": "🏥 Zdrowie",
            "🌱 Экология": "🌱 Środowisko"
        },
        cs: {
            "🌍 Мировые новости": "🌍 Světové zprávy",
            "💻 Технологии": "💻 Technologie",
            "🔬 Наука": "🔬 Věda",
            "⚽ Спорт": "⚽ Sport",
            "🎬 Развлечения": "🎬 Zábava",
            "💰 Экономика": "💰 Obchod",
            "🏥 Здоровье": "🏥 Zdraví",
            "🌱 Экология": "🌱 Životní prostředí"
        },
        bg: {
            "🌍 Мировые новости": "🌍 Световни новини",
            "💻 Технологии": "💻 Технологии",
            "🔬 Наука": "🔬 Наука",
            "⚽ Спорт": "⚽ Спорт",
            "🎬 Развлечения": "🎬 Забавления",
            "💰 Экономика": "💰 Бизнес",
            "🏥 Здоровье": "🏥 Здраве",
            "🌱 Экология": "🌱 Околна среда"
        },
        sr: {
            "🌍 Мировые новости": "🌍 Svetske vesti",
            "💻 Технологии": "💻 Tehnologija",
            "🔬 Наука": "🔬 Nauka",
            "⚽ Спорт": "⚽ Sport",
            "🎬 Развлечения": "🎬 Zabava",
            "💰 Экономика": "💰 Biznis",
            "🏥 Здоровье": "🏥 Zdravlje",
            "🌱 Экология": "🌱 Životna sredina"
        }
    };

    return categoryTranslations[lang]?.[originalCategory] || originalCategory;
}

// Функция для получения статистики по категориям с переводами
function getCategoryStats() {
    const categoryStats = {};

    Object.entries(RECOMMENDED_FEEDS).forEach(([originalCategory, feeds]) => {
        const localizedName = getLocalizedCategoryName(originalCategory);
        categoryStats[localizedName] = {
            original: originalCategory,
            localized: localizedName,
            count: feeds.length,
            feeds: feeds
        };
    });

    return categoryStats;
}

// Функция для создания статистики по категориям
function createCategoryStatsCard() {
    const categoryStats = getCategoryStats();
    const translation = translations[currentLanguage] || translations['ru'];

    const sortedCategories = Object.entries(categoryStats)
        .sort(([, a], [, b]) => b.count - a.count);

    return `
        <div class="stat-card">
            <h4>📂 ${t('categories_distribution', 'Распределение по категориям')}</h4>
            ${sortedCategories.map(([localizedName, data]) => {
        const feedsWord = getFeedsWord(data.count);
        return `<p><strong>${localizedName}:</strong> ${data.count} ${feedsWord}</p>`;
    }).join('')}
        </div>
    `;
}
// Функции для правильного склонения слов в зависимости от языка
function getFeedsWord(count) {
    const lang = currentLanguage;

    switch (lang) {
        case 'ru':
            if (count % 10 === 1 && count % 100 !== 11) return 'лента';
            if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'ленты';
            return 'лент';
        case 'uk':
            if (count % 10 === 1 && count % 100 !== 11) return 'стрічка';
            if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'стрічки';
            return 'стрічок';
        case 'pl':
            if (count === 1) return 'kanał';
            if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'kanały';
            return 'kanałów';
        case 'cs':
            if (count === 1) return 'kanál';
            if ([2, 3, 4].includes(count)) return 'kanály';
            return 'kanálů';
        case 'bg':
            if (count === 1) return 'емисия';
            return 'емисии';
        case 'sr':
            if (count % 10 === 1 && count % 100 !== 11) return 'kanal';
            if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'kanala';
            return 'kanala';
        case 'en':
        default:
            return count === 1 ? 'feed' : 'feeds';
    }
}

function getCategoriesWord(count) {
    const lang = currentLanguage;

    switch (lang) {
        case 'ru':
            if (count % 10 === 1 && count % 100 !== 11) return 'категория';
            if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'категории';
            return 'категорий';
        case 'uk':
            if (count % 10 === 1 && count % 100 !== 11) return 'категорія';
            if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'категорії';
            return 'категорій';
        case 'pl':
            if (count === 1) return 'kategoria';
            if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'kategorie';
            return 'kategorii';
        case 'cs':
            if (count === 1) return 'kategorie';
            if ([2, 3, 4].includes(count)) return 'kategorie';
            return 'kategorií';
        case 'bg':
            if (count === 1) return 'категория';
            return 'категории';
        case 'sr':
            if (count % 10 === 1 && count % 100 !== 11) return 'kategorija';
            if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'kategorije';
            return 'kategorija';
        case 'en':
        default:
            return count === 1 ? 'category' : 'categories';
    }
}

function getCountriesWord(count) {
    const lang = currentLanguage;

    switch (lang) {
        case 'ru':
            if (count % 10 === 1 && count % 100 !== 11) return 'страна';
            if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'страны';
            return 'стран';
        case 'uk':
            if (count % 10 === 1 && count % 100 !== 11) return 'країна';
            if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'країни';
            return 'країн';
        case 'pl':
            if (count === 1) return 'kraj';
            if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'kraje';
            return 'krajów';
        case 'cs':
            if (count === 1) return 'země';
            if ([2, 3, 4].includes(count)) return 'země';
            return 'zemí';
        case 'bg':
            if (count === 1) return 'страна';
            return 'страни';
        case 'sr':
            if (count % 10 === 1 && count % 100 !== 11) return 'zemlja';
            if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'zemlje';
            return 'zemalja';
        case 'en':
        default:
            return count === 1 ? 'country' : 'countries';
    }
}

// Функция для получения локализованных названий языков
function getLanguageName(langCode) {
    const lang = currentLanguage;

    const languageNames = {
        ru: {
            'ru': 'Русский',
            'en': 'Английский',
            'uk': 'Украинский',
            'pl': 'Польский',
            'cs': 'Чешский',
            'bg': 'Болгарский',
            'sr': 'Сербский'
        },
        en: {
            'ru': 'Russian',
            'en': 'English',
            'uk': 'Ukrainian',
            'pl': 'Polish',
            'cs': 'Czech',
            'bg': 'Bulgarian',
            'sr': 'Serbian'
        },
        uk: {
            'ru': 'Російська',
            'en': 'Англійська',
            'uk': 'Українська',
            'pl': 'Польська',
            'cs': 'Чеська',
            'bg': 'Болгарська',
            'sr': 'Сербська'
        },
        pl: {
            'ru': 'Rosyjski',
            'en': 'Angielski',
            'uk': 'Ukraiński',
            'pl': 'Polski',
            'cs': 'Czeski',
            'bg': 'Bułgarski',
            'sr': 'Serbski'
        },
        cs: {
            'ru': 'Ruština',
            'en': 'Angličtina',
            'uk': 'Ukrajinština',
            'pl': 'Polština',
            'cs': 'Čeština',
            'bg': 'Bulharština',
            'sr': 'Srbština'
        },
        bg: {
            'ru': 'Руски',
            'en': 'Английски',
            'uk': 'Украински',
            'pl': 'Полски',
            'cs': 'Чешки',
            'bg': 'Български',
            'sr': 'Сръбски'
        },
        sr: {
            'ru': 'Ruski',
            'en': 'Engleski',
            'uk': 'Ukrajinski',
            'pl': 'Poljski',
            'cs': 'Češki',
            'bg': 'Bugarski',
            'sr': 'Srpski'
        }
    };

    return languageNames[lang]?.[langCode] || langCode.toUpperCase();
}

// Функция для создания карточки статистики по категориям
function createCategoryStatsCard() {
    const translation = translations[currentLanguage] || translations['ru'];
    const categoryStats = {};

    // Подсчитываем количество лент в каждой категории
    Object.entries(RECOMMENDED_FEEDS).forEach(([category, feeds]) => {
        categoryStats[category] = feeds.length;
    });

    // Сортируем по количеству лент
    const sortedCategories = Object.entries(categoryStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8); // Показываем топ-8 категорий

    return `
        <div class="stat-card">
            <h4>📂 ${t('categories_stats', 'Категории')}</h4>
            ${sortedCategories.map(([category, count]) => {
        const feedsWord = getFeedsWord(count);
        return `<p><strong>${category}:</strong> ${count} ${feedsWord}</p>`;
    }).join('')}
        </div>
    `;
}

// Функция для проверки полноты переводов модальных окон
function checkModalTranslationsCompleteness() {
    const requiredKeys = [
        'recommendation_settings', 'enable_recommendations', 'show_on_startup',
        'max_recommendations', 'min_quality', 'sort_by', 'sort_by_quality',
        'sort_by_name', 'sort_by_country', 'show_country_flags', 'group_by_country',
        'preferred_languages', 'categories_for_recommendations', 'save', 'reset',
        'recommendations_statistics', 'general_info', 'total_feeds', 'total_categories',
        'total_countries', 'quality_distribution', 'high_quality', 'medium_quality',
        'low_quality', 'languages', 'top_countries', 'categories_stats',
        'close_statistics', 'close_settings', 'settings_saved', 'settings_reset'
    ];

    const completeness = {};

    Object.keys(translations).forEach(lang => {
        const langTranslations = translations[lang];
        const missing = requiredKeys.filter(key => !langTranslations[key]);

        completeness[lang] = {
            total: requiredKeys.length,
            translated: requiredKeys.length - missing.length,
            missing: missing,
            percentage: Math.round(((requiredKeys.length - missing.length) / requiredKeys.length) * 100)
        };
    });

    console.log('📊 Полнота переводов модальных окон:', completeness);
    return completeness;
}

// Добавляем в глобальную область для отладки
window.testModalTranslations = testModalTranslations;
window.checkModalTranslationsCompleteness = checkModalTranslationsCompleteness;