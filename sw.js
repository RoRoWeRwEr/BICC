// Service Worker حقيقي لأداة "مرجع بطاقات الائتمان السعودية".
// يخزّن قشرة التطبيق (index.html نفسه — كل شي مضمّن بداخله، لا ملفات خارجية أخرى)
// في Cache Storage عند أول تحميل، ليعمل التطبيق فعليًا بلا إنترنت بعد ذلك.
//
// ملاحظات نشر مهمة:
// 1) يجب رفع هذا الملف بجانب index.html بنفس المجلد بالضبط على GitHub — التسجيل
//    بالصفحة يستخدم مسارًا نسبيًا ('./sw.js')، فلازم يكون بنفس مسار index.html.
// 2) لا يعمل من فتح index.html مباشرة بصيغة file:// — قيد أمني بكل المتصفحات:
//    الـService Worker يحتاج أصل https:// أو http://localhost فقط.
// 3) زد رقم CACHE_NAME يدويًا (v1 → v2 ...) مع كل تحديث فعلي تنشره — هذا ينظّف
//    النسخة القديمة من الكاش تلقائيًا عبر حدث activate أدناه.

const CACHE_NAME = 'bicc-shell-v1';
const SHELL_URLS = ['./', './index.html'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_URLS))
      .catch((e) => console.error('[SW] install caching failed:', e))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// شبكة أولاً مع تحديث الكاش من كل استجابة ناجحة — يضمن عدم تجميد المستخدم على بيانات
// قديمة أبدًا طالما هو متصل، ويستخدم الكاش فقط كنسخة احتياطية عند انقطاع الاتصال فعليًا.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME)
          .then((cache) => cache.put(event.request, clone))
          .catch(() => {});
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => cached || caches.match('./index.html'))
      )
  );
});
