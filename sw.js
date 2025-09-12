const CACHE_NAME = 'fluent-rss-v2.0.0';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/translations.js',
    '/manifest.json',
    '/favicon/favicon-32x32.png',
    '/favicon/favicon-16x16.png',
    '/favicon/apple-icon-180x180.png',
    '/favicon/android-icon-192x192.png'
];

// Установка Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Активация Service Worker
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Обработка запросов
self.addEventListener('fetch', event => {
    // Пропускаем запросы к внешним API
    if (event.request.url.includes('allorigins.win') || 
        event.request.url.includes('api.') ||
        event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Возвращаем кешированную версию или загружаем из сети
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});

// Обработка push-уведомлений (для будущих обновлений)
self.addEventListener('push', event => {
    const options = {
        body: event.data ? event.data.text() : 'Новые статьи доступны!',
        icon: '/favicon/android-icon-192x192.png',
        badge: '/favicon/android-icon-96x96.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        }
    };

    event.waitUntil(
        self.registration.showNotification('Fluent RSS Reader', options)
    );
});

// Обработка клика по уведомлению
self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/')
    );
});