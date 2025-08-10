const CACHE_NAME = 'koshien-app-v1.0.2';  // バージョンアップ
const urlsToCache = [
  '/koshien_app/',           // 絶対パスに変更
  '/koshien_app/index.html',
  '/koshien_app/manifest.json',
  '/koshien_app/icon-192.png',
  '/koshien_app/icon-512.png'
];

// Service Workerのインストール
self.addEventListener('install', event => {
  console.log('Service Worker: インストール中...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: ファイルをキャッシュ中...');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.log('Service Worker: キャッシュに失敗:', error);
      })
  );
});

// Service Workerの有効化
self.addEventListener('activate', event => {
  console.log('Service Worker: 有効化中...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // 古いキャッシュを削除
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: 古いキャッシュを削除:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// ネットワークリクエストの処理
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // キャッシュにあればそれを返す
        if (response) {
          return response;
        }

        // キャッシュになければネットワークから取得
        return fetch(event.request)
          .then(response => {
            // レスポンスが正常でない場合はそのまま返す
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // レスポンスをコピーしてキャッシュに保存
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // ネットワークエラーの場合、オフライン用のレスポンスを返す
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// バックグラウンド同期（将来の機能拡張用）
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: バックグラウンド同期実行');
    // ここで保存されていないデータを同期する処理を追加可能
  }
});

// プッシュ通知（将来の機能拡張用）
self.addEventListener('push', event => {
  console.log('Service Worker: プッシュ通知受信');
  
  const options = {
    body: event.data ? event.data.text() : '甲子園アプリからお知らせがあります',
    icon: '/icon-192.png',
    badge: '/icon-72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'アプリを開く',
        icon: '/icon-192.png'
      },
      {
        action: 'close',
        title: '閉じる'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('叶夢〜甲子園への道のり〜', options)
  );
});

// 通知クリック時の処理
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: 通知がクリックされました');
  event.notification.close();

  if (event.action === 'explore') {
    // アプリを開く
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
