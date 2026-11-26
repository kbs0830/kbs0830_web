// 外部連結檢查（TODO C8，2026-11-26）：從自己網站的 sitemap 逐頁抓 HTML，收集指到別的網站的連結，逐一確認還活著。
// 作品的 GitHub 連結、文章引用的網址壞掉就能發現。CommonJS，scripts/link-check.js 跟單元測試共用；這支不碰檔案。
//
// 判定：2xx／3xx＝活著；404、410、5xx、連不上（DNS、逾時、憑證）＝壞了；401／403／429／999 這種「擋機器人」的回應不算壞（很多大站都擋，誤報太多）。
// 先 HEAD，被拒（405／501）或失敗再改 GET。

const BLOCKED = new Set([401, 403, 429, 999]);

/** 從 HTML 取出外部連結（http／https、host 跟 siteHost 不同）。去掉 #fragment、重複；只看 <a href> */
function extractExternalLinks(html, siteHost) {
  const out = new Set();
  for (const m of html.matchAll(/<a\b[^>]*?\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
    const raw = (m[1] ?? m[2] ?? "").replace(/&amp;/g, "&").trim();
    if (!/^https?:\/\//i.test(raw)) continue;
    let u;
    try {
      u = new URL(raw);
    } catch {
      continue;
    }
    const h = u.hostname.replace(/^www\./, "");
    if (h === siteHost.replace(/^www\./, "")) continue;
    u.hash = "";
    out.add(u.toString());
  }
  return [...out];
}

/** @returns {Promise<{ ok: boolean, status?: number, note?: string }>} */
async function checkUrl(url, fetcher = fetch, timeoutMs = 10_000) {
  const attempt = async (method) => {
    const res = await fetcher(url, {
      method,
      redirect: "follow",
      headers: { "user-agent": "Mozilla/5.0 (compatible; kbs0830-link-check)" },
      signal: AbortSignal.timeout(timeoutMs),
    });
    return res.status;
  };
  try {
    let status = await attempt("HEAD");
    if (status >= 400) status = await attempt("GET"); // HEAD 被拒（405／501）或有些站 HEAD 亂回，改 GET 再確認一次
    if (status < 400) return { ok: true, status };
    if (BLOCKED.has(status)) return { ok: true, status, note: "對方擋機器人，不算壞" };
    return { ok: false, status };
  } catch (e) {
    return { ok: false, note: e && e.name === "TimeoutError" ? "逾時" : String((e && e.cause && e.cause.code) || (e && e.message) || e) };
  }
}

/** 同時最多 limit 個 */
async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await fn(items[i], i);
      }
    }),
  );
  return results;
}

/**
 * 檢查整個網站。base：本機網址（例 http://localhost:3000，sitemap 裡的網址會換成這個）。
 * @returns {Promise<{ pages: number, links: number, broken: { url: string, status?: number, note?: string, pages: string[] }[] }>}
 */
async function checkSite({ base, siteUrl, fetcher = fetch, concurrency = 5 }) {
  const siteHost = new URL(siteUrl).hostname;
  const sitemap = await (await fetcher(`${base}/sitemap.xml`, { signal: AbortSignal.timeout(20_000) })).text();
  const pages = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(siteUrl, base));
  /** @type {Map<string, string[]>} 外部連結 → 出現在哪些頁面（站內路徑） */
  const found = new Map();
  await mapLimit(pages, concurrency, async (page) => {
    try {
      const html = await (await fetcher(page, { signal: AbortSignal.timeout(30_000) })).text();
      for (const link of extractExternalLinks(html, siteHost)) {
        found.set(link, [...(found.get(link) ?? []), page.replace(base, "") || "/"]);
      }
    } catch {
      // 這頁抓不到（網站自己的問題由 watchdog 管），略過
    }
  });
  const links = [...found.keys()];
  const results = await mapLimit(links, concurrency, (url) => checkUrl(url, fetcher));
  const broken = links
    .map((url, i) => ({ url, ok: results[i].ok, status: results[i].status, note: results[i].note, pages: found.get(url) }))
    .filter((r) => !r.ok)
    .map((r) => ({ url: r.url, status: r.status, note: r.note, pages: r.pages }));
  return { pages: pages.length, links: links.length, broken };
}

module.exports = { extractExternalLinks, checkUrl, mapLimit, checkSite, BLOCKED };
