// Google Search Console 週報資料（TODO C4，2026-11-17）。weekly-report.ps1 呼叫，stdout 印一行 JSON。
//
// 抓兩種東西：
//   1. 搜尋成效（Search Analytics API）：最近 7 天的點擊／曝光／平均排名，跟再前 7 天比；前 5 個搜尋字詞、前 5 個頁面
//      Search Console 的資料晚 2～3 天，所以區間是「3 天前往回 7 天」
//   2. 索引狀態（URL Inspection API）：sitemap 裡每個網址逐一查「有沒有被 Google 收錄」
//      ⚠️ API 沒有「已建立索引總數」這個數字（後台的「網頁索引」報表沒開放），只能一頁一頁查；
//      配額每天 2000 次／每分鐘 600 次，sitemap 29 個網址一週查一次綽綽有餘
//
// 認證：Google Cloud 服務帳號的 JSON 金鑰。路徑寫在 .env.local 的 GSC_KEY_FILE（建議放 C:\Users\user\.kbs0830-gsc-key.json，
// 不放 repo 裡）。token 只要 webmasters.readonly，就算 Search Console 給的是「完整」權限，這把金鑰也改不了任何設定。
// 沒設 GSC_KEY_FILE → 印 {"skipped": …}，週報照寄、不顯示這段。
// 為什麼用 Node 不用 PowerShell：JWT 要用 RSA 私鑰簽章，Windows PowerShell 5.1（.NET Framework）讀不了 PEM 格式的私鑰。
//
// 搜尋字詞只寄進 otemon 的週報信，不存檔（可能有人搜本名，那是給自己看的）。
// 手動跑：node scripts\lib\search-console.js

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const REPO = path.resolve(__dirname, "..", "..");
const SITE = "https://kbs0830.com";
const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
// 只有重新提交 sitemap 用（部署後，deploy.ps1 → `node search-console.js --submit-sitemap`）；週報、月報還是唯讀
const WRITE_SCOPE = "https://www.googleapis.com/auth/webmasters";
const TOKEN_URI = "https://oauth2.googleapis.com/token";
// 自己的工具 UA 帶 kbs0830-：raw-traffic.js 不會把抓 sitemap 這次算進「未過濾流量」
const UA = "kbs0830-weekly-report";

// URL Inspection 回的 coverageState 是英文，常見的翻成後台看到的中文
const COVERAGE_ZH = {
  "Submitted and indexed": "已提交並建立索引",
  "Indexed, not submitted in sitemap": "已建立索引（不在 sitemap）",
  "Crawled - currently not indexed": "已檢索 - 尚未建立索引",
  "Discovered - currently not indexed": "已找到 - 尚未建立索引",
  "URL is unknown to Google": "Google 還不知道這個網址",
  "Page with redirect": "頁面會重新導向",
  "Not found (404)": "找不到（404）",
  "Server error (5xx)": "伺服器錯誤（5xx）",
  "Duplicate, Google chose different canonical than user": "重複網頁，Google 選了別的標準網址",
  "Excluded by ‘noindex’ tag": "被 noindex 排除",
};

function readEnv(file) {
  const env = {};
  if (!fs.existsSync(file)) return env;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, "$2");
  }
  return env;
}

const b64url = (v) => Buffer.from(v).toString("base64url");

/** 服務帳號換 token 用的 JWT（RS256） */
function signJwt(key, now = Math.floor(Date.now() / 1000), scope = SCOPE) {
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(
    JSON.stringify({ iss: key.client_email, scope, aud: key.token_uri || TOKEN_URI, iat: now, exp: now + 3600 }),
  );
  const sig = crypto.sign("RSA-SHA256", Buffer.from(`${header}.${claim}`), key.private_key);
  return `${header}.${claim}.${b64url(sig)}`;
}

/** Search Console 的資源：網域資源（sc-domain:）優先，其次網址前置字元資源；沒驗證過的不算 */
function pickSite(entries) {
  const ok = (entries || []).filter((e) => e.permissionLevel && e.permissionLevel !== "siteUnverifiedUser");
  const hit =
    ok.find((e) => e.siteUrl === "sc-domain:kbs0830.com") || ok.find((e) => /^https:\/\/kbs0830\.com\/?$/.test(e.siteUrl));
  return hit ? hit.siteUrl : null;
}

/** YYYY-MM-DD（UTC）。Search Console 資料晚 2～3 天：本週＝3 天前往回 7 天，前一週再往前 7 天 */
/** 最近 n 天（Search Console 晚 2～3 天，所以到 3 天前）跟再前 n 天；週報 n=7、月報 n=30（`node search-console.js --days 30`） */
function weekRanges(today = new Date(), n = 7) {
  const day = (offset) => {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - offset));
    return d.toISOString().slice(0, 10);
  };
  return { cur: { startDate: day(n + 2), endDate: day(3) }, prev: { startDate: day(2 * n + 2), endDate: day(n + 3) } };
}

function totals(resp) {
  const r = (resp && resp.rows && resp.rows[0]) || {};
  return { clicks: r.clicks || 0, impressions: r.impressions || 0, ctr: r.ctr || 0, position: r.position || 0 };
}

/** 照曝光排、取前 n 個（API 預設照點擊排；新站點擊幾乎都是 0，照點擊排等於亂排） */
function topRows(resp, n = 5) {
  return ((resp && resp.rows) || [])
    .map((r) => ({ key: r.keys[0], clicks: r.clicks, impressions: r.impressions }))
    .sort((a, b) => b.impressions - a.impressions || b.clicks - a.clicks)
    .slice(0, n);
}

/** 每個網址的檢查結果 → 已收錄幾個、各狀態幾個、沒收錄的是哪些 */
function summarizeInspections(results) {
  const states = {};
  let indexed = 0;
  const notIndexed = [];
  for (const r of results) {
    const s = r.error ? "查詢失敗" : COVERAGE_ZH[r.coverageState] || r.coverageState || "未知";
    states[s] = (states[s] || 0) + 1;
    if (r.verdict === "PASS") indexed++;
    else notIndexed.push(r.url.replace(SITE, "") || "/");
  }
  return { total: results.length, indexed, states, notIndexed };
}

async function run() {
  const env = readEnv(path.join(REPO, ".env.local"));
  const keyFile = process.env.GSC_KEY_FILE || env.GSC_KEY_FILE;
  if (!keyFile) return { skipped: ".env.local 沒有 GSC_KEY_FILE" };
  if (!fs.existsSync(keyFile)) return { error: `找不到金鑰檔 ${keyFile}` };
  const key = JSON.parse(fs.readFileSync(keyFile, "utf8"));

  const tokenRes = await fetch(key.token_uri || TOKEN_URI, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: signJwt(key) }),
    signal: AbortSignal.timeout(15000),
  });
  const tok = await tokenRes.json().catch(() => ({}));
  if (!tokenRes.ok) return { error: `拿不到 token：${tok.error_description || tok.error || tokenRes.status}` };

  const api = async (url, body) => {
    const res = await fetch(url, {
      method: body ? "POST" : "GET",
      headers: { authorization: `Bearer ${tok.access_token}`, "content-type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(30000),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`${res.status} ${(d.error && d.error.message) || ""}`.trim());
    return d;
  };

  const sites = await api("https://www.googleapis.com/webmasters/v3/sites");
  const site = env.GSC_SITE || pickSite(sites.siteEntry);
  if (!site) return { error: `服務帳號 ${key.client_email} 還沒加進 Search Console 的 kbs0830.com（設定 → 使用者和權限）` };

  const q = (range, extra) =>
    api(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`, {
      ...range,
      dataState: "all",
      ...extra,
    });
  const di = process.argv.indexOf("--days");
  const n = di > 0 ? Math.min(90, Math.max(1, Number(process.argv[di + 1]) || 7)) : 7;
  const w = weekRanges(new Date(), n);
  const [cur, prev, queries, pages] = await Promise.all([
    q(w.cur),
    q(w.prev),
    q(w.cur, { dimensions: ["query"], rowLimit: 100 }),
    q(w.cur, { dimensions: ["page"], rowLimit: 100 }),
  ]);

  // sitemap 每個網址查一次索引狀態（6 個一起查，不要一次全部打出去；一次約 3 秒，3 個一起時 29 個網址要 90 秒）
  const xml = await (await fetch(`${SITE}/sitemap.xml`, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(15000) })).text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const results = [];
  for (let i = 0; i < urls.length; i += 6) {
    const batch = urls.slice(i, i + 6).map(async (url) => {
      try {
        const d = await api("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", {
          inspectionUrl: url,
          siteUrl: site,
        });
        const s = (d.inspectionResult && d.inspectionResult.indexStatusResult) || {};
        return { url, verdict: s.verdict, coverageState: s.coverageState };
      } catch (e) {
        return { url, error: e.message };
      }
    });
    results.push(...(await Promise.all(batch)));
  }

  return {
    site,
    analytics: {
      range: `${w.cur.startDate.slice(5).replace("-", "/")}–${w.cur.endDate.slice(5).replace("-", "/")}`,
      cur: totals(cur),
      prev: totals(prev),
      queries: topRows(queries),
      pages: topRows(pages).map((p) => ({ ...p, key: p.key.replace(SITE, "") || "/" })),
    },
    index: summarizeInspections(results),
  };
}

/** 重新提交 sitemap（2026-11-25，TODO I5 那輪）：部署有改到內容就叫 Google 回來讀。
 *  服務帳號在 Search Console 要是「完整」權限（siteFullUser，11/25 確認過已經是）；受限權限會回 403 */
async function submitSitemap() {
  const env = readEnv(path.join(REPO, ".env.local"));
  const keyFile = process.env.GSC_KEY_FILE || env.GSC_KEY_FILE;
  if (!keyFile) return { skipped: ".env.local 沒有 GSC_KEY_FILE" };
  const key = JSON.parse(fs.readFileSync(keyFile, "utf8"));
  const tokenRes = await fetch(key.token_uri || TOKEN_URI, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: signJwt(key, undefined, WRITE_SCOPE) }),
    signal: AbortSignal.timeout(15000),
  });
  const tok = await tokenRes.json().catch(() => ({}));
  if (!tokenRes.ok) return { error: `拿不到 token：${tok.error_description || tok.error || tokenRes.status}` };
  const site = env.GSC_SITE || "sc-domain:kbs0830.com";
  const feed = `${SITE}/sitemap.xml`;
  const res = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/sitemaps/${encodeURIComponent(feed)}`, {
    method: "PUT",
    headers: { authorization: `Bearer ${tok.access_token}` },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    return { error: `${res.status} ${(d.error && d.error.message) || ""}`.trim() };
  }
  return { ok: true, feed };
}

if (require.main === module && process.argv.includes("--submit-sitemap")) {
  submitSitemap()
    .catch((e) => ({ error: e.message }))
    .then((out) => process.stdout.write(JSON.stringify(out)));
} else if (require.main === module) {
  run()
    .catch((e) => ({ error: e.message }))
    .then((out) => process.stdout.write(JSON.stringify(out)));
}

module.exports = { readEnv, signJwt, pickSite, weekRanges, totals, topRows, summarizeInspections };
