// 캐시 이름을 정의합니다. 앱 버전이 바뀔 때마다 이 값을 변경해주면 좋습니다.
const CACHE_NAME = 'ANIMA-story-cache-v1';
// 캐싱할 파일 목록을 정의합니다. 앱의 핵심 애셋(HTML, CSS, JS, 주요 이미지 등)을 포함합니다.
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  // 빌드 후 생성되는 정적(static) 파일 경로들을 필요에 따라 추가할 수 있습니다.
  // 예: '/static/js/bundle.js', '/static/css/main.css'
  // CRA(Create React App)에서는 빌드 시 파일명에 해시가 붙으므로,
  // 이 목록을 동적으로 관리하는 것이 더 효과적입니다.
  // 이 기본 예제에서는 설치 시점에 주요 파일만 캐싱합니다.
];

// 1. 서비스 워커 설치 (Install) 이벤트
// 앱이 처음 로드될 때 한 번 실행됩니다.
self.addEventListener('install', (event) => {
  // 설치 작업이 끝날 때까지 서비스 워커를 활성 상태로 만들지 않습니다.
  event.waitUntil(
    // 지정된 이름으로 캐시 저장소를 엽니다.
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('캐시 저장소 열림');
        // 정의된 파일 목록을 캐시에 추가합니다.
        return cache.addAll(urlsToCache);
      })
  );
});

// 2. 서비스 워커 활성화 (Activate) 이벤트
// 서비스 워커가 설치되고 이전 버전의 서비스 워커가 제어권을 놓았을 때 실행됩니다.
// 오래된 캐시를 정리하는 데 유용합니다.
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // 허용 목록에 없는 이전 버전의 캐시는 삭제합니다.
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log(`오래된 캐시 삭제: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 3. Fetch 이벤트
// 앱에서 발생하는 모든 네트워크 요청(fetch)을 가로챕니다.
// 이를 통해 캐시된 응답을 반환하거나 네트워크에 요청을 보낼 수 있습니다.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    // 먼저 캐시에서 요청과 일치하는 응답이 있는지 확인합니다.
    caches.match(event.request)
      .then((response) => {
        // 캐시에 응답이 있으면 캐시된 응답을 반환합니다.
        if (response) {
          return response;
        }
        // 캐시에 응답이 없으면 네트워크를 통해 요청을 보냅니다.
        return fetch(event.request);
      }
    )
  );
});
