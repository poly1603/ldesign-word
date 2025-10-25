/**
 * Service Worker
 * 提供离线缓存和资源管理
 */

const CACHE_NAME = 'word-viewer-cache-v1';
const CACHE_URLS = [
  '/',
  '/index.html',
  '/dist/word-viewer.js',
  '/dist/word-viewer.css',
];

// 安装事件
self.addEventListener('install', (event: any) => {
  console.log('[ServiceWorker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Caching app shell');
      return cache.addAll(CACHE_URLS);
    })
  );
  
  // 跳过等待，立即激活
  (self as any).skipWaiting();
});

// 激活事件
self.addEventListener('activate', (event: any) => {
  console.log('[ServiceWorker] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // 立即控制所有客户端
  return (self as any).clients.claim();
});

// Fetch 事件 - 缓存优先策略
self.addEventListener('fetch', (event: any) => {
  const { request } = event;
  
  // 仅缓存 GET 请求
  if (request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // 如果缓存中有，返回缓存
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // 否则从网络获取
      return fetch(request).then((response) => {
        // 检查是否是有效响应
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        // 克隆响应
        const responseToCache = response.clone();
        
        // 缓存响应
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });
        
        return response;
      });
    })
  );
});

// 消息事件
self.addEventListener('message', (event: any) => {
  const { data } = event;
  
  if (data.action === 'skipWaiting') {
    (self as any).skipWaiting();
  }
  
  if (data.action === 'clearCache') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => {
      event.ports[0]?.postMessage({ success: true });
    });
  }
});

export {};
