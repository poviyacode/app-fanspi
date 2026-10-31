// service-worker.js

// Nombre de la caché
const CACHE_NAME = 'app-cache-v1';

// Archivos a cachear (opcional)
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/main.js',
  '/assets/icons/call-icon.png', // Icono para las notificaciones
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalado');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Cachéando assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activado');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Eliminando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Manejo de solicitudes de red
self.addEventListener('fetch', (event) => {
  console.log('[Service Worker] Capturando solicitud:', event.request.url);
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});

// Manejo de eventos push
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push recibido:', event.data);

  const data = event.data.json();
  const title = data.title || 'Notificación';
  const options = {
    body: data.body || 'Sin detalles',
    icon: data.icon || '/assets/icons/call-icon.png',
    badge: data.badge || '/assets/icons/badge.png',
    data: data.data || {},
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Manejo de clics en notificaciones
self.addEventListener('notificationclick', function (event) {
  const notification = event.notification;
  // Recuperamos la URL que guardamos en el objeto data desde NestJS
  const urlToOpen = notification.data && notification.data.url ? notification.data.url : '/';

  event.waitUntil(
    // Buscamos si el usuario ya tiene la página abierta
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (windowClients) {
      // Si está abierta, la enfocamos y navegamos a la URL objetivo
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if ('focus' in client) {
          client.focus();
          return client.navigate(urlToOpen);
        }
      }
      // Si la app no está abierta en ninguna pestaña, abrimos una nueva
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );

  // Cerramos la tarjeta de notificación del sistema operativo
  notification.close();
});