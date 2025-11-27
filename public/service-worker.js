// Nome do cache principal, altere este valor (ex: v1, v2) sempre que fizer alterações
// nos arquivos estáticos para forçar a atualização do Service Worker.
const CACHE_NAME = 'consulta-pdf-pwa-cache-v1';

// Lista de arquivos essenciais para o funcionamento offline
const urlsToCache = [
    '/', // Garante que a raiz seja cacheada (index.html)
    '/index.html',
    '/manifest.json',
    // URLs dos PDFs serão abertas dinamicamente e não são cacheadas aqui,
    // mas o layout e a lógica básica estarão disponíveis.
    // Adicionamos as URLs dos ícones aqui para garantir o funcionamento offline:
    '/assets/icons/icon-192x192.png',
    '/assets/icons/icon-512x512.png',
];

/**
 * Instalação do Service Worker
 * Abre um cache e armazena todos os arquivos estáticos definidos em urlsToCache.
 */
self.addEventListener('install', (event) => {
    // Permite que o Service Worker seja ativado imediatamente após a instalação.
    self.skipWaiting();
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Cache aberto: Adicionando todos os arquivos da lista.');
                return cache.addAll(urlsToCache);
            })
            .catch((error) => {
                console.error('[Service Worker] Falha ao adicionar recursos ao cache:', error);
            })
    );
});

/**
 * Ativação do Service Worker
 * Limpa caches antigos, garantindo que apenas a versão mais recente permaneça.
 */
self.addEventListener('activate', (event) => {
    event.waitUntil(
        // Pega todas as chaves de cache e exclui aquelas que não correspondem ao CACHE_NAME atual.
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Excluindo cache antigo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

/**
 * Interceptação de Requisições (Fetch)
 * Implementa a estratégia "Cache, then Network Fallback" (Cache com Recurso de Rede).
 *
 * 1. Tenta servir o recurso a partir do cache.
 * 2. Se falhar, tenta buscar o recurso na rede.
 */
self.addEventListener('fetch', (event) => {
    // Evita interceptar requisições não HTTP/HTTPS (como chrome-extension://)
    if (event.request.url.startsWith('http')) {
        event.respondWith(
            caches.match(event.request)
                .then((response) => {
                    // Se o recurso estiver no cache, retorna-o
                    if (response) {
                        return response;
                    }
                    
                    // Se não estiver no cache, busca na rede
                    return fetch(event.request).catch((error) => {
                        console.log('[Service Worker] Falha ao buscar recurso na rede:', event.request.url, error);
                        // Aqui você pode retornar uma página de "offline" personalizada se desejar.
                        // Exemplo: return caches.match('/offline.html');
                    });
                })
        );
    }
});
