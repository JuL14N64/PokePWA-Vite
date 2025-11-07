const CACHE_NAME = 'poke-cache-v1';
const POKE_API_CACHE = 'poke-cache'; // Nombre específico para el caché de la API

// Archivos estáticos básicos para el caché de instalación (App Shell)
const urlsToCache = [
  '/',
  '/index.html',
  // Es mejor dejar que Vite/Rollup maneje el caché de assets en el build
  // Por ahora, solo cachamos el shell.
];

// Evento: Instalación (Guardar App Shell)
self.addEventListener('install', event => {
  console.log('Service Worker: Instalando y Cacheando el App Shell');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Evento: Activación
self.addEventListener('activate', event => {
  console.log('Service Worker: Activado');
  // Opcional: Limpiar cachés antiguos
});

// Evento: Fetch (Estrategia Cache-First para la API)
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Cachear solo peticiones de la PokeAPI
  if (url.includes('pokeapi.co')) {
    event.respondWith(
      caches.open(POKE_API_CACHE).then(cache => {
        return fetch(event.request) // Intenta obtener de la red (Network First)
          .then(response => {
            // Guardar en el caché y devolver la respuesta
            cache.put(event.request, response.clone());
            return response;
          })
          .catch(() => {
            // Si falla la red, buscar en el caché (Offline First)
            return caches.match(event.request);
          });
      })
    );
    return;
  }

  // Para otros assets (archivos estáticos de la aplicación - Network First, Falling back to Cache)
  event.respondWith(
    caches.match(event.request).then(response => {
      // Si el asset está en caché, devolverlo
      if (response) {
        return response;
      }
      // Si no, intentar obtenerlo de la red
      return fetch(event.request);
    })
  );
});

// ==========================================================
// Evento: Escuchar mensajes desde React (para mostrar notificación)
// ==========================================================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === "SHOW_NOTIFICATION") {
    
    // Obtener los datos personalizados, si se envían
    const { title, body, icon } = event.data.payload || {};
    
    // Mostrar la notificación usando showNotification
    self.registration.showNotification(title || "Pokédex actualizada", {
      body: body || '¡Atrápalos ya!',
      icon: icon || "/poke-icon-192.png", // Asegúrate de que esta ruta sea correcta
      vibrate: [200, 100, 200], // Vibración (opcional)
      tag: "poke-notify" // Agrupa las notificaciones
    });
  }
});