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
let categories = JSON.parse(localStorage.getItem("categories")) || [];
let currentFeedIndex = 0;
let currentItem = null;
let currentMode = "normal";
let allArticles = [];
let currentLanguage = localStorage.getItem('language') || 'ru';

// Инициализация категорий по умолчанию
function initDefaultCategories() {
    if (categories.length === 0) {
        const t = translations[currentLanguage] || translations.ru;
        categories = [t.no_category];
        localStorage.setItem("categories", JSON.stringify(categories));
    }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    initLanguage();
    initDefaultCategories();
    
    // Проверяем, первый ли это запуск
    const isFirstRun = !localStorage.getItem('hasVisited');
    if (isFirstRun && feeds.length === 0) {
        showWelcomeModal();
        localStorage.setItem('hasVisited', 'true');
    } else if (feeds.length === 0) {
        showPlaceholder();
    }
    
    updateCategorySelect();
    updateTabs();
    loadCurrentFeed();
});

window.addEventListener("scroll", () => {
    bottomNav.classList.toggle("scrolled", window.scrollY > 50);
});

const preloader = document.getElementById('preloader');

function togglePreloader(show) {
    preloader.classList.toggle('active', show);
}

function hidePreloader() {
    preloader.classList.remove("active");
}

function updateCategorySelect() {
    const t = translations[currentLanguage] || translations.ru;
    categorySelect.innerHTML = `<option value="">${t.all_categories}</option>`;
    categories.forEach((category) => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
}

function addCategory() {
    const t = translations[currentLanguage] || translations.ru;
    const newCategory = prompt(t.new_category_prompt);
    if (
        newCategory &&
        newCategory.trim() &&
        !categories.includes(newCategory.trim())
    ) {
        categories.push(newCategory.trim());
        localStorage.setItem("categories", JSON.stringify(categories));
        updateCategorySelect();
    }
}

function addFeed() {
    const url = rssUrlInput.value.trim();
    if (!url || feeds.includes(url)) return;

    const t = translations[currentLanguage] || translations.ru;
    feeds.push(url);
    feedNames[url] = url.split("/")[2] || `Feed ${feeds.length}`;
    feedCategories[url] = categorySelect.value || t.no_category;
    localStorage.setItem("rssFeeds", JSON.stringify(feeds));
    localStorage.setItem("feedNames", JSON.stringify(feedNames));
    localStorage.setItem("feedCategories", JSON.stringify(feedCategories));
    updateTabs();
    switchFeed(0);
    rssUrlInput.value = "";
}

function updateTabs() {
    tabs.innerHTML = "";
    const filteredFeeds = feeds.filter(
        (feed) =>
            categorySelect.value === "" ||
            feedCategories[feed] === categorySelect.value
    );
    filteredFeeds.forEach((feed, index) => {
        const tab = document.createElement("div");
        tab.className = `tab ${index === currentFeedIndex ? "active" : ""}`;
        tab.innerHTML = `
            <span class="tab-name">${feedNames[feed]}</span>
            <span class="edit-icon" onclick="editFeedName(event, '${feed}')">✏️</span>
        `;
        tab.onclick = (e) => {
            if (e.target.className !== "edit-icon") switchFeed(index);
        };
        tabs.appendChild(tab);
    });
    const manageIcon = document.createElement("span");
    manageIcon.className = "manage-icon";
    manageIcon.textContent = "⚙️";
    manageIcon.onclick = showFeedManageModal;
    tabs.appendChild(manageIcon);
}

function editFeedName(event, feedUrl) {
    event.stopPropagation();
    const t = translations[currentLanguage] || translations.ru;
    const newName = prompt(t.new_feed_name_prompt, feedNames[feedUrl]);
    if (newName && newName.trim()) {
        feedNames[feedUrl] = newName.trim();
        localStorage.setItem("feedNames", JSON.stringify(feedNames));
        updateTabs();
    }
}

// Функция поиска по статьям
function searchArticles() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    if (!searchTerm) {
        loadCurrentFeed();
        return;
    }
    
    const filteredArticles = allArticles.filter(article => 
        article.title.toLowerCase().includes(searchTerm) ||
        article.description.toLowerCase().includes(searchTerm) ||
        article.content.toLowerCase().includes(searchTerm)
    );
    
    displayArticles(filteredArticles);
}

// Функция отображения статей
function displayArticles(articles) {
    feedGrid.innerHTML = '';
    if (articles.length > 0) {
        articles.forEach((article, idx) => {
            const feedItem = document.createElement('div');
            feedItem.className = 'feed-item';
            feedItem.innerHTML = `
                ${article.enclosure && !article.mediaType.includes('video') ? `<img src="${article.enclosure}" alt="Preview">` : ''}
                ${article.enclosure && article.mediaType.includes('video') ? `<video controls src="${article.enclosure}" alt="Video"></video>` : ''}
                <h2>${article.title}</h2>
                <p>${article.description.substring(0, 150)}...</p>
            `;
            feedItem.onclick = () => showDetails(article);
            feedGrid.appendChild(feedItem);
            setTimeout(() => feedItem.classList.add('visible'), idx * 100);
        });
    } else {
        const t = translations[currentLanguage] || translations.ru;
        feedGrid.innerHTML = `<p>${t.no_items}</p>`;
    }
}

// Обработчик поиска по Enter и в реальном времени
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchArticles();
            }
        });
        
        // Поиск в реальном времени с задержкой
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                if (e.target.value.length > 2 || e.target.value.length === 0) {
                    searchArticles();
                }
            }, 300);
        });
    }
});

function switchFeed(index) {
    currentFeedIndex = index;
    updateTabs();
    loadCurrentFeed();
}

//  функция loadFeed
async function loadFeed(url) {
    togglePreloader(true);
    const t = translations[currentLanguage] || translations.ru;
    
    try {
        const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);
        const xmlText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        const items = xmlDoc.getElementsByTagName('item');
        
        allArticles = []; // Очищаем массив статей
        feedGrid.innerHTML = '';
        
        if (items.length > 0) {
            Array.from(items).forEach((item, idx) => {
                const title = item.getElementsByTagName('title')[0]?.textContent || t.no_title;
                const description = item.getElementsByTagName('description')[0]?.textContent || '';
                const content = item.getElementsByTagName('content:encoded')[0]?.textContent || description;
                const link = item.getElementsByTagName('link')[0]?.textContent || '';
                const enclosure = item.getElementsByTagName('enclosure')[0]?.getAttribute('url') || '';
                const mediaType = item.getElementsByTagName('enclosure')[0]?.getAttribute('type') || '';
                const pubDate = item.getElementsByTagName('pubDate')[0]?.textContent || '';

                const article = { title, description, content, link, enclosure, mediaType, pubDate };
                allArticles.push(article);

                const feedItem = document.createElement('div');
                feedItem.className = 'feed-item';
                feedItem.innerHTML = `
                    ${enclosure && !mediaType.includes('video') ? `<img src="${enclosure}" alt="Preview" loading="lazy">` : ''}
                    ${enclosure && mediaType.includes('video') ? `<video controls src="${enclosure}" alt="Video" preload="metadata"></video>` : ''}
                    <h2>${title}</h2>
                    <p>${description.substring(0, 150)}...</p>
                    ${pubDate ? `<small style="color: var(--text-secondary); font-size: 12px;">${new Date(pubDate).toLocaleDateString()}</small>` : ''}
                `;
                feedItem.onclick = () => showDetails(article);
                feedGrid.appendChild(feedItem);
                setTimeout(() => feedItem.classList.add('visible'), idx * 100);
            });
        } else {
            feedGrid.innerHTML = `<p>${t.no_items}</p>`;
        }
    } catch (error) {
        feedGrid.innerHTML = `<p>${t.loading_error}</p>`;
        console.error(error);
    } finally {
        togglePreloader(false);
    }
}

function loadCurrentFeed() {
    const t = translations[currentLanguage] || translations.ru;
    const filteredFeeds = feeds.filter(
        (feed) =>
            categorySelect.value === "" ||
            feedCategories[feed] === categorySelect.value
    );
    
    // Очищаем поиск
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    
    if (filteredFeeds.length > 0 && currentFeedIndex < filteredFeeds.length) {
        loadFeed(filteredFeeds[currentFeedIndex]);
    } else if (feeds.length === 0) {
        showPlaceholder();
    } else {
        feedGrid.innerHTML = `<p>${t.no_feeds_category}</p>`;
    }
}

function showPlaceholder() {
    const t = translations[currentLanguage] || translations.ru;
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
                    <g filter="url(#filter2_d_56)">
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
            <h2>${t.welcome_title}</h2>
            <p>${t.welcome_text}</p>
        </div>
    `;
}

if (feeds === 0) {
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

// функция updateModalContent
function updateModalContent() {
    const t = translations[currentLanguage] || translations.ru;
    
    if (currentMode === 'normal') {
        const image = currentItem.enclosure && !currentItem.mediaType.includes('video') ? currentItem.enclosure : '';
        const video = currentItem.enclosure && currentItem.mediaType.includes('video') ? currentItem.enclosure : '';
        modalContent.innerHTML = `
            ${image ? `<img src="${image}" alt="Preview" loading="lazy">` : ''}
            ${video ? `<video controls src="${video}" alt="Video" preload="metadata"></video>` : ''}
            <h1>${currentItem.title}</h1>
            <p>${currentItem.content}</p>
            <a href="${currentItem.link}" target="_blank">${t.go_to_source}</a>
        `;
    } else if (currentMode === 'web') {
        togglePreloader(true);
        modalContent.innerHTML = `
            <div class="iframe-container">
                <iframe src="${currentItem.link}" sandbox="allow-same-origin allow-scripts" onload="togglePreloader(false)"></iframe>
            </div>
        `;
    }
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
    linkPreview.textContent = link;
    shareOptions.innerHTML = `
        <div class="share-option" onclick="shareTo('vk', '${link}')"><span>🔗</span> ВКонтакте</div>
        <div class="share-option" onclick="shareTo('x', '${link}')"><span>🐦</span> X</div>
        <div class="share-option" onclick="shareTo('ok', '${link}')"><span>👥</span> Одноклассники</div>
        <div class="share-option" onclick="shareTo('whatsapp', '${link}')"><span>💬</span> WhatsApp</div>
        <div class="share-option" onclick="shareTo('telegram', '${link}')"><span>📱</span> Telegram</div>
    `;
    shareModal.style.display = "flex";
    setTimeout(() => shareModal.classList.add("visible"), 10);
}

function shareTo(platform, link) {
    let shareUrl;
    switch (platform) {
        case "vk":
            shareUrl = `https://vk.com/share.php?url=${encodeURIComponent(link)}`;
            break;
        case "x":
            shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
                link
            )}&text=${encodeURIComponent(currentItem.title)}`;
            break;
        case "ok":
            shareUrl = `https://connect.ok.ru/offer?url=${encodeURIComponent(
                link
            )}&title=${encodeURIComponent(currentItem.title)}`;
            break;
        case "whatsapp":
            shareUrl = `https://wa.me/?text=${encodeURIComponent(
                currentItem.title + " " + link
            )}`;
            break;
        case "telegram":
            shareUrl = `https://t.me/share/url?url=${encodeURIComponent(
                link
            )}&text=${encodeURIComponent(currentItem.title)}`;
            break;
    }
    window.open(shareUrl, "_blank");
    closeShareModal();
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
                <span onclick="deleteFeed('${feed}')" style="margin-left: 10px;">�️</spaan>
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
    const t = translations[currentLanguage] || translations.ru;
    if (confirm(`${t.delete_feed_confirm} "${feedNames[feedUrl]}"?`)) {
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
    const t = translations[currentLanguage] || translations.ru;
    const shareLink = `${window.location.origin}${window.location.pathname}?feed=${encodeURIComponent(feedUrl)}`;
    navigator.clipboard.writeText(shareLink).then(() => {
        alert(t.feed_link_copied);
    });
    closeFeedManageModal();
}

function copyLink() {
    const t = translations[currentLanguage] || translations.ru;
    navigator.clipboard.writeText(currentItem.link).then(() => {
        alert(t.link_copied);
    });
    closeShareModal();
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
    if (confirm('Вы уверены, что хотите удалить все ленты?')) {
        feeds = [];
        feedNames = {};
        feedCategories = {};
        localStorage.setItem("rssFeeds", JSON.stringify(feeds));
        localStorage.setItem("feedNames", JSON.stringify(feedNames));
        localStorage.setItem("feedCategories", JSON.stringify(feedCategories));
        // Сбрасываем флаг первого запуска для показа рекомендаций
        localStorage.removeItem('hasVisited');
        feedGrid.innerHTML = "";
        updateTabs();
        showPlaceholder();
    }
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    if (!currentTheme) {
        document.documentElement.setAttribute("data-theme", "light");
        themeIcon.textContent = "☀️";
    } else if (currentTheme === "light") {
        document.documentElement.setAttribute("data-theme", "dark");
        themeIcon.textContent = "🌙";
    } else {
        document.documentElement.removeAttribute("data-theme");
        themeIcon.textContent = "🌓";
    }
    localStorage.setItem(
        "theme",
        document.documentElement.getAttribute("data-theme") || "system"
    );
}

// Функция смены языка
function changeLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;
    updatePageLanguage(lang);
    updateCategorySelect();
    updateTabs();
    
    // Если открыто модальное окно приветствия, обновляем его
    const welcomeModal = document.getElementById('welcomeModal');
    if (welcomeModal.classList.contains('visible')) {
        selectedFeeds.clear();
        showWelcomeModal();
    }
    
    if (feeds.length === 0) {
        showPlaceholder();
    }
}

// Функция обновления языка страницы
function updatePageLanguage(lang) {
    const t = translations[lang] || translations.ru;
    
    // Обновляем title и meta теги
    document.title = t.title;
    const descMeta = document.querySelector('meta[name="description"]');
    const keywordsMeta = document.querySelector('meta[name="keywords"]');
    if (descMeta) descMeta.content = t.description;
    if (keywordsMeta) keywordsMeta.content = t.keywords;
    
    // Обновляем все элементы с data-i18n
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (t[key]) {
            element.textContent = t[key];
        }
    });
    
    // Обновляем placeholder'ы
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        if (t[key]) {
            element.placeholder = t[key];
        }
    });
}

// Инициализация языка
function initLanguage() {
    const savedLang = localStorage.getItem('language') || 'ru';
    currentLanguage = savedLang;
    const langSelect = document.getElementById('languageSelect');
    if (langSelect) {
        langSelect.value = savedLang;
    }
    updatePageLanguage(savedLang);
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

// Функции для модального окна приветствия
let selectedFeeds = new Set();
let feedExamples = {};

// Загрузка примеров лент
async function loadFeedExamples() {
    try {
        const response = await fetch('/feeds-examples.json');
        feedExamples = await response.json();
    } catch (error) {
        console.error('Ошибка загрузки примеров лент:', error);
        // Fallback данные
        feedExamples = {
            feeds: {
                ru: {
                    news: [
                        { name: "Lenta.ru", url: "https://lenta.ru/rss", description: "Новости России и мира" },
                        { name: "РБК", url: "http://static.feed.rbc.ru/rbc/logical/footer/news.rss", description: "Деловые новости" }
                    ],
                    tech: [
                        { name: "Habr", url: "https://habr.com/ru/rss/hub/all/", description: "IT-сообщество" }
                    ]
                },
                en: {
                    news: [
                        { name: "BBC News", url: "http://feeds.bbci.co.uk/news/rss.xml", description: "Latest news from BBC" },
                        { name: "Reuters", url: "http://feeds.reuters.com/reuters/topNews", description: "Breaking news" }
                    ],
                    tech: [
                        { name: "TechCrunch", url: "http://feeds.feedburner.com/TechCrunch", description: "Technology news" }
                    ]
                }
            },
            categories: {
                ru: { news: "Новости", tech: "Технологии", science: "Наука" },
                en: { news: "News", tech: "Technology", science: "Science" }
            }
        };
    }
}

// Показать модальное окно приветствия
async function showWelcomeModal() {
    await loadFeedExamples();
    const modal = document.getElementById('welcomeModal');
    const recommendedFeeds = document.getElementById('recommendedFeeds');
    const t = translations[currentLanguage] || translations.ru;
    
    // Получаем ленты для текущего языка
    const languageFeeds = feedExamples.feeds[currentLanguage] || feedExamples.feeds.en;
    const categoryNames = feedExamples.categories[currentLanguage] || feedExamples.categories.en;
    
    let feedsHTML = '';
    
    // Генерируем HTML для каждой категории
    Object.keys(languageFeeds).forEach(categoryKey => {
        const categoryFeeds = languageFeeds[categoryKey];
        const categoryName = categoryNames[categoryKey] || categoryKey;
        
        if (categoryFeeds && categoryFeeds.length > 0) {
            feedsHTML += `
                <div class="feed-category">
                    <div class="category-header">
                        <div class="category-title">
                            ${getCategoryIcon(categoryKey)} ${categoryName}
                        </div>
                        <button class="select-all-btn" onclick="selectAllInCategory('${categoryKey}')" data-i18n="select_all">${t.select_all}</button>
                    </div>
                    <div class="feed-list" data-category="${categoryKey}">
                        ${categoryFeeds.map(feed => `
                            <div class="feed-recommendation" data-url="${feed.url}" data-name="${feed.name}" data-category="${categoryName}" onclick="toggleFeedSelection(this)">
                                <div class="feed-name">${feed.name}</div>
                                <div class="feed-description">${feed.description}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    });
    
    recommendedFeeds.innerHTML = feedsHTML;
    modal.classList.add('visible');
    updateAddButton();
}

// Получить иконку для категории
function getCategoryIcon(category) {
    const icons = {
        news: '📰',
        tech: '💻',
        science: '🔬',
        sports: '⚽',
        business: '💼',
        entertainment: '🎬'
    };
    return icons[category] || '📄';
}

// Переключить выбор ленты
function toggleFeedSelection(element) {
    const url = element.dataset.url;
    const name = element.dataset.name;
    const category = element.dataset.category;
    
    if (selectedFeeds.has(url)) {
        selectedFeeds.delete(url);
        element.classList.remove('selected');
    } else {
        selectedFeeds.add(url);
        element.classList.add('selected');
        // Сохраняем дополнительную информацию
        element.dataset.selected = 'true';
    }
    
    updateAddButton();
}

// Выбрать все ленты в категории
function selectAllInCategory(categoryKey) {
    const categoryElement = document.querySelector(`[data-category="${categoryKey}"]`);
    const feedElements = categoryElement.querySelectorAll('.feed-recommendation');
    const t = translations[currentLanguage] || translations.ru;
    
    // Проверяем, все ли уже выбраны
    const allSelected = Array.from(feedElements).every(el => el.classList.contains('selected'));
    
    feedElements.forEach(element => {
        const url = element.dataset.url;
        if (allSelected) {
            // Снимаем выбор со всех
            selectedFeeds.delete(url);
            element.classList.remove('selected');
        } else {
            // Выбираем все
            selectedFeeds.add(url);
            element.classList.add('selected');
        }
    });
    
    // Обновляем текст кнопки
    const selectBtn = categoryElement.parentElement.querySelector('.select-all-btn');
    selectBtn.textContent = allSelected ? t.select_all : '✓ ' + t.select_all;
    
    updateAddButton();
}

// Обновить кнопку добавления
function updateAddButton() {
    const addButton = document.querySelector('.welcome-btn.primary');
    const t = translations[currentLanguage] || translations.ru;
    const count = selectedFeeds.size;
    
    if (count > 0) {
        addButton.textContent = `${t.add_selected} (${count})`;
        addButton.disabled = false;
    } else {
        addButton.textContent = t.add_selected;
        addButton.disabled = true;
    }
}

// Добавить выбранные ленты
function addSelectedFeeds() {
    const t = translations[currentLanguage] || translations.ru;
    let addedCount = 0;
    
    selectedFeeds.forEach(url => {
        if (!feeds.includes(url)) {
            const feedElement = document.querySelector(`[data-url="${url}"]`);
            const name = feedElement.dataset.name;
            const category = feedElement.dataset.category;
            
            feeds.push(url);
            feedNames[url] = name;
            feedCategories[url] = category;
            
            // Добавляем категорию если её нет
            if (!categories.includes(category)) {
                categories.push(category);
            }
            
            addedCount++;
        }
    });
    
    // Сохраняем в localStorage
    localStorage.setItem("rssFeeds", JSON.stringify(feeds));
    localStorage.setItem("feedNames", JSON.stringify(feedNames));
    localStorage.setItem("feedCategories", JSON.stringify(feedCategories));
    localStorage.setItem("categories", JSON.stringify(categories));
    
    // Показываем уведомление
    if (addedCount > 0) {
        showNotification(`${addedCount} ${t.feeds_added_success}`);
    }
    
    // Закрываем модальное окно и обновляем интерфейс
    closeWelcomeModal();
    updateCategorySelect();
    updateTabs();
    if (feeds.length > 0) {
        switchFeed(0);
    }
}

// Закрыть модальное окно приветствия
function closeWelcomeModal() {
    const modal = document.getElementById('welcomeModal');
    modal.classList.remove('visible');
    setTimeout(() => {
        modal.style.display = 'none';
        selectedFeeds.clear();
    }, 300);
    
    // Если нет лент, показываем placeholder
    if (feeds.length === 0) {
        showPlaceholder();
    }
}

// Показать уведомление
function showNotification(message) {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--green-accent);
        color: white;
        padding: 15px 20px;
        border-radius: var(--border-radius-small);
        box-shadow: var(--shadow);
        z-index: 5000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Анимация появления
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Удаление через 3 секунды
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Обработчик клика вне модального окна
document.addEventListener('click', (e) => {
    const welcomeModal = document.getElementById('welcomeModal');
    if (e.target === welcomeModal) {
        closeWelcomeModal();
    }
});

// Инициализация выполняется в DOMContentLoaded
