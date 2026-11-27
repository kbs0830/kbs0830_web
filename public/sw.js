// Service Worker：讀過的文章沒網路也打得開（TODO B10，2026-11-27）。
// 原則：**有網路時一律拿最新的**（network-first），只有連不上才用上次讀過的那份；所以部署新版、改文章都不會被舊快取卡住。
//   - /blog、/blog/<文章>：network-first（5 秒沒回就當作離線），成功的回應存起來；連不上 → 上次存的 → 沒讀過就給 /offline.html
//   - /_next/static/*（有 hash 的 JS、CSS、字型）：cache-first，內容不會變（改了檔名就是新檔）
//   - 其他頁面：只在連不上時給 /offline.html，不存
//   - 不碰：非 GET、別的網域、/api、/admin、/login、/go、/cdn-cgi、/sw.js 自己
// 版本：改了這支的邏輯就把 CACHE 的 v 加一，activate 時會刪掉舊的。頁面快取最多留 60 份。
const CACHE = "kbs-offline-v1";
const PAGE_LIMIT = 60;
const NETWORK_TIMEOUT_MS = 5000;
const SKIP = /^\/(api|admin|login|go|cdn-cgi)(\/|$)|^\/sw\.js$/;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.add("/offline.html")).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("kbs-offline-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const isBlog = (path) => path === "/blog" || path.startsWith("/blog/");

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

async function trimPages(cache) {
  const keys = (await cache.keys()).filter((r) => new URL(r.url).pathname !== "/offline.html" && !new URL(r.url).pathname.startsWith("/_next/"));
  for (const k of keys.slice(0, Math.max(0, keys.length - PAGE_LIMIT))) await cache.delete(k);
}

async function offlinePage() {
  return (await caches.match("/offline.html")) || new Response("離線中", { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } });
}

async function networkFirstPage(request, store) {
  const cache = await caches.open(CACHE);
  try {
    const res = await withTimeout(fetch(request), NETWORK_TIMEOUT_MS);
    // 只存正常的回應（維修頁 503、404 都不存），文章頁不會因為維修被洗掉
    if (store && res.ok && res.type === "basic") {
      await cache.put(request, res.clone());
      await trimPages(cache);
    }
    return res;
  } catch {
    return (await cache.match(request)) || (await offlinePage());
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || SKIP.test(url.pathname)) return;

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then(async (res) => {
            if (res.ok) (await caches.open(CACHE)).put(req, res.clone());
            return res;
          }),
      ),
    );
    return;
  }

  if (req.mode === "navigate") {
    event.respondWith(networkFirstPage(req, isBlog(url.pathname)));
  }
});
