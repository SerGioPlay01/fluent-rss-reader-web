// Service Worker для кэширования RSS Reader
const CACHE_NAME = 'fluent-rss-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/manifest.json'
];

// Установка Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Кэш открыт');
                return cache.addAll(urlsToCache);
            })
    );
});

// Обработка запросов
self.addEventListener('fetch', event => {
    // Кэшируем только GET запросы к нашему домену
    if (event.request.method === 'GET' && event.request.url.startsWith(self.location.origin)) {
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    // Возвращаем кэшированную версию или загружаем из сети
                    return response || fetch(event.request);
                })
        );
    }
});

// Обновление кэша
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Удаляем старый кэш:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});