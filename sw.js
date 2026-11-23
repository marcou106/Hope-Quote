// Service worker — «посредник» между страницей и интернетом.
// Он работает отдельно от страницы (в своём потоке) и перехватывает все её запросы.
// Здесь нет document и window: этот код не видит страницу, только запросы.

// Имя кэша. Меняй версию при каждом релизе — тогда старый кэш удалится (см. activate).
const CACHE_NAME = "hope-quote-v1.0.0";

// Файлы, без которых приложение не запустится офлайн.
// Пути относительные: считаются от места, где лежит sw.js.
const APP_FILES = [
  "./",
  "index.html",
  "style.css",
  "app.js",
  "quotes.json",
  "manifest.json",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png",
];

// 1) install — срабатывает один раз, когда браузер видит новую версию sw.js.
// addEventListener похож на подписку на событие в C#: worker.Install += handler;
self.addEventListener("install", (event) => {
  // waitUntil = «не считай установку законченной, пока этот Promise не выполнится».
  // Promise в JS ≈ Task в C#: обещание результата в будущем.
  // cache: "reload" — скачать с сервера заново, а не брать старую копию
  // из обычного кэша браузера (иначе в наш кэш может попасть устаревший файл).
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        cache.addAll(APP_FILES.map((url) => new Request(url, { cache: "reload" })))
      )
  );
  // Не ждать, пока закроются старые вкладки, — сразу стать активным.
  self.skipWaiting();
});

// 2) activate — новая версия вступила в силу. Удаляем кэши старых версий.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME) // как список-фильтр в Python: [n for n in names if n != CACHE_NAME]
          .map((name) => caches.delete(name))
      )
    )
  );
  // Сразу начать управлять уже открытыми страницами.
  self.clients.claim();
});

// 3) fetch — срабатывает на КАЖДЫЙ запрос страницы (html, css, json, картинки).
// Стратегия «сначала сеть»: есть интернет — берём свежий файл и обновляем кэш;
// нет интернета — отдаём сохранённую копию.
self.addEventListener("fetch", (event) => {
  // Трогаем только обычные GET-запросы к нашему же сайту.
  if (event.request.method !== "GET") return;
  if (new URL(event.request.url).origin !== self.location.origin) return;

  // respondWith = «ответ на этот запрос дам я».
  // cache: "no-cache" — спросить сервер «файл изменился?». Если нет, ответ крошечный (304),
  // если да — придёт новый. Так правки на GitHub видны сразу, без ожидания 10 минут.
  event.respondWith(
    fetch(event.request.url, { cache: "no-cache" })
      .then((response) => {
        // Ответ можно прочитать только один раз, поэтому кладём в кэш его копию (clone).
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      // catch — как except в Python: сюда попадаем, если сети нет.
      .catch(() => caches.match(event.request))
  );
});
