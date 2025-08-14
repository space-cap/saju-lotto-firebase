const CACHE_NAME = 'saju-lotto-v1';
const STATIC_CACHE_NAME = 'saju-lotto-static-v1';
const DYNAMIC_CACHE_NAME = 'saju-lotto-dynamic-v1';

const STATIC_FILES = [
  '/',
  '/index.html',
  '/script.js',
  '/saju-engine.js',
  '/firebase-config.js',
  '/auth-handler.js',
  '/style.css',
  '/manifest.json',
  '/offline.html'
];

const DYNAMIC_CACHE_LIMIT = 15;

self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then(cache => {
      console.log('Service Worker: Pre-caching static files');
      return cache.addAll(STATIC_FILES);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  if (url.origin === location.origin) {
    event.respondWith(cacheFirst(request));
  } else if (url.origin === 'https://firebaseapp.com' || 
             url.origin === 'https://googleapis.com' ||
             url.origin === 'https://fonts.googleapis.com' ||
             url.origin === 'https://fonts.gstatic.com') {
    event.respondWith(networkFirst(request));
  }
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  return cached || fetch(request);
}

async function networkFirst(request) {
  const dynamicCache = await caches.open(DYNAMIC_CACHE_NAME);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.status === 200) {
      const responseClone = networkResponse.clone();
      await limitCacheSize(DYNAMIC_CACHE_NAME, DYNAMIC_CACHE_LIMIT);
      dynamicCache.put(request, responseClone);
    }
    return networkResponse;
  } catch (err) {
    const cached = await dynamicCache.match(request);
    return cached || new Response('오프라인 상태입니다.', {
      status: 408,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

async function limitCacheSize(cacheName, size) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > size) {
    await cache.delete(keys[0]);
    limitCacheSize(cacheName, size);
  }
}

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_SAJU_DATA') {
    const data = event.data.payload;
    caches.open(DYNAMIC_CACHE_NAME).then(cache => {
      const response = new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' }
      });
      cache.put('/saju-data-cache', response);
    });
  }
  
  if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    Promise.all([
      caches.open(STATIC_CACHE_NAME),
      caches.open(DYNAMIC_CACHE_NAME)
    ]).then(([staticCache, dynamicCache]) => {
      return Promise.all([
        staticCache.keys(),
        dynamicCache.keys()
      ]);
    }).then(([staticKeys, dynamicKeys]) => {
      event.ports[0].postMessage({
        static: staticKeys.length,
        dynamic: dynamicKeys.length
      });
    });
  }
});

self.addEventListener('push', event => {
  console.log('Push message received:', event);
  
  let notificationData = {};
  
  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (e) {
      notificationData = {
        title: '사주로또',
        body: event.data.text() || '새로운 알림이 있습니다.',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png'
      };
    }
  }

  const notificationOptions = {
    title: notificationData.title || '사주로또',
    body: notificationData.body || '새로운 알림이 있습니다.',
    icon: notificationData.icon || '/icons/icon-192x192.png',
    badge: notificationData.badge || '/icons/icon-72x72.png',
    tag: notificationData.tag || 'saju-notification',
    data: notificationData.data || {},
    requireInteraction: notificationData.requireInteraction || false,
    actions: notificationData.actions || [
      {
        action: 'open',
        title: '앱 열기',
        icon: '/icons/icon-72x72.png'
      },
      {
        action: 'close',
        title: '닫기'
      }
    ],
    vibrate: [200, 100, 200],
    silent: false
  };

  event.waitUntil(
    self.registration.showNotification(notificationOptions.title, notificationOptions)
  );
});

self.addEventListener('notificationclick', event => {
  console.log('Notification click received:', event);
  
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data;
  
  if (action === 'close') {
    return;
  }
  
  let urlToOpen = '/';
  
  if (data && data.url) {
    urlToOpen = data.url;
  } else if (action === 'open' || !action) {
    urlToOpen = '/';
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

self.addEventListener('notificationclose', event => {
  console.log('Notification closed:', event);
  
  const data = event.notification.data;
  if (data && data.analytics) {
    fetch('/api/analytics', {
      method: 'POST',
      body: JSON.stringify({
        type: 'notification_closed',
        data: data.analytics
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    }).catch(err => console.log('Analytics error:', err));
  }
});

self.addEventListener('sync', event => {
  console.log('Background sync:', event);
  
  if (event.tag === 'saju-sync') {
    event.waitUntil(syncSajuData());
  }
  
  if (event.tag === 'fortune-update') {
    event.waitUntil(updateFortuneData());
  }
});

async function syncSajuData() {
  try {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const response = await cache.match('/saju-data-cache');
    
    if (response) {
      const data = await response.json();
      
      const syncResponse = await fetch('/api/sync-saju', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (syncResponse.ok) {
        await cache.delete('/saju-data-cache');
        console.log('Saju data synced successfully');
      }
    }
  } catch (error) {
    console.error('Sync failed:', error);
    throw error;
  }
}

async function updateFortuneData() {
  try {
    const response = await fetch('/api/daily-fortune');
    if (response.ok) {
      const fortuneData = await response.json();
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put('/daily-fortune-cache', new Response(JSON.stringify(fortuneData)));
      
      self.registration.showNotification('운세 업데이트', {
        body: '오늘의 새로운 운세가 업데이트되었습니다.',
        icon: '/icons/icon-192x192.png',
        tag: 'fortune-update',
        data: { url: '/?action=fortune' }
      });
    }
  } catch (error) {
    console.error('Fortune update failed:', error);
  }
}

function generateSajuOffline(birthData) {
  const { year, month, day, hour, isLunar } = birthData;
  
  const heavenlyStems = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
  const earthlyBranches = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
  
  const yearStem = heavenlyStems[(year - 4) % 10];
  const yearBranch = earthlyBranches[(year - 4) % 12];
  
  const monthStem = heavenlyStems[(month - 1) % 10];
  const monthBranch = earthlyBranches[(month - 1) % 12];
  
  const dayStem = heavenlyStems[(day - 1) % 10];
  const dayBranch = earthlyBranches[(day - 1) % 12];
  
  const hourStem = heavenlyStems[(hour) % 10];
  const hourBranch = earthlyBranches[(Math.floor(hour / 2)) % 12];
  
  const pillars = {
    year: { stem: yearStem, branch: yearBranch },
    month: { stem: monthStem, branch: monthBranch },
    day: { stem: dayStem, branch: dayBranch },
    hour: { stem: hourStem, branch: hourBranch }
  };
  
  const numbers = [];
  const stemValues = heavenlyStems.indexOf(dayStem) + 1;
  const branchValues = earthlyBranches.indexOf(dayBranch) + 1;
  
  for (let i = 0; i < 6; i++) {
    const base = (stemValues + branchValues + i * 7) % 45 + 1;
    numbers.push(base);
  }
  
  return {
    pillars,
    numbers: numbers.sort((a, b) => a - b),
    explanation: `${dayStem}${dayBranch}일주를 기반으로 생성된 오프라인 번호입니다.`,
    isOffline: true
  };
}

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'GENERATE_OFFLINE_SAJU') {
    const result = generateSajuOffline(event.data.birthData);
    event.ports[0].postMessage(result);
  }
});