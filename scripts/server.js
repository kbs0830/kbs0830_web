// 自訂 production server：包一層 request/error log，寫進 logs/server.log。
// 用這個取代 `next start` 直接當 Task Scheduler 的 Action，
// 這樣才有實際的 server 端 log 可以查（之前完全沒有 —— server 掛了/回應異常都只能用 curl 反推）。
//
// 注意：這個檔案本身就是 Task Scheduler 直接追蹤的那個 node.exe process，
// 不要把它包成再啟動另一個子行程的 wrapper，否則 stop/restart 會殺不乾淨
// （這正是 2026-07 全白頁面事件的根因，細節見 CLAUDE.md）。

// 正式站一律 production：next.config.ts 的 CSP 依 NODE_ENV 決定要不要給 dev 用的 eval／websocket，
// 用 next() 程式化啟動時 Next 不會自己設（`next start` CLI 才會）。要在 require("next") 之前
process.env.NODE_ENV = "production";

const path = require("node:path");
const fs = require("node:fs");
const http = require("node:http");
const next = require("next");
const { recordRawHit } = require("./lib/raw-traffic");
const { recordNotFound } = require("./lib/not-found");
const { createRecorder } = require("./lib/response-times");
const { startRadarPoller } = require("./lib/radar");
const { startRadarHealthPoller } = require("./lib/radar-health");

// projectDir＝正式站資料夾：data/、logs/、node_modules/、.env.local 都在這裡（Task Scheduler 直接跑這支 server.js）。
const projectDir = path.join(__dirname, "..");
const dataDir = path.join(projectDir, "data");

// deploy.ps1 輪流 build 到兩個槽，data/next-dist-dir.txt 記著目前上線的是哪一槽（next.config.ts 讀 NEXT_DIST_DIR）。
// 2026-11-28（TODO C13）起槽放在乾淨副本 .live/ 裡（git worktree，只有已 push 的程式碼）：指標檔寫 ".live/.next-a"
// → 程式（appDir）在 .live，資料、log 還是用這裡的。舊格式 ".next-a" 就是這個資料夾本身（退回舊版時用得到）。
// 手動測試（3200）直接設 NEXT_DIST_DIR，同樣可以寫 ".live/.next-test"；沒有指標檔就是預設的 .next。
const distDirFile = path.join(dataDir, "next-dist-dir.txt");
const slotSpec = process.env.NEXT_DIST_DIR || (fs.existsSync(distDirFile) ? fs.readFileSync(distDirFile, "utf8").trim() : "");
const slotMatch = slotSpec.match(/^(.+)[\\/]([^\\/]+)$/);
const appDir = slotMatch ? path.join(projectDir, slotMatch[1]) : projectDir;
if (slotSpec) process.env.NEXT_DIST_DIR = slotMatch ? slotMatch[2] : slotSpec;

// Task Scheduler 的工作沒有設「開始位置」，process.cwd() 會是 C:\Windows\System32。
// src/lib/content/blog.ts 用 process.cwd() 找 content/blog：已 prerender 的文章沒差，但不存在的
// slug（掃描器亂打的 /blog/.env、/blog/wp-login.php）要即時渲染，readdirSync 找不到資料夾
// → 500 而不是 404（2026-11-05 才發現，Search Console 的 5xx 也有一部分是這個）。
// 切到 appDir：文章、架構圖 SVG、git log（/changelog）都讀乾淨副本裡的
process.chdir(appDir);
const logDir = path.join(projectDir, "logs");

// .env.local 在正式站資料夾（不進 git，.live 裡只有部署時複製的一份）：先載入這裡的，改了金鑰重啟就生效、不用等部署。
// 已經有的環境變數不蓋（Next 自己載入時也不蓋）：手動測試用 RADAR_HOST= 關掉雷達要照樣有效
const envFile = path.join(projectDir, ".env.local");
if (appDir !== projectDir && fs.existsSync(envFile)) {
  for (const [k, v] of Object.entries(require("node:util").parseEnv(fs.readFileSync(envFile, "utf8")))) {
    if (!(k in process.env)) process.env[k] = v;
  }
}
const logFile = path.join(logDir, "server.log");
const MAX_LOG_BYTES = 5 * 1024 * 1024; // 5MB，超過就轉存成 .log.1

if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

// 訪客來源國家統計的資料檔路徑（實際讀寫在 src/app/api/visitor-stats/route.ts，
// 由前端 VisitorStats.tsx 執行 JS 之後主動回報，不是這裡對每個 request 做判斷——
// 2026-07 才發現舊做法只看 User-Agent 有沒有寫 "bot" 完全擋不住偽裝成瀏覽器的掃描器，
// 混進了一筆假的訪客國家）。
// Task Scheduler 啟動這個 process 時沒有設定 working directory（process.cwd() 會是
// C:\Windows\System32 之類的地方，不是專案根目錄），所以把絕對路徑用環境變數傳給
// 那支 API route，不要讓那邊自己用 process.cwd() 猜路徑。
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
// 沒有個別環境變數的資料檔（admin.db 等）：lib/data-file.ts 用 DATA_DIR；草稿（不進 git，.live 裡沒有）用這裡的
process.env.DATA_DIR = process.env.DATA_DIR || dataDir;
process.env.BLOG_DRAFTS_DIR = process.env.BLOG_DRAFTS_DIR || path.join(projectDir, "content", "drafts");
process.env.VISITOR_STATS_FILE = path.join(dataDir, "visitor-stats.json");
process.env.WEB_VITALS_FILE = path.join(dataDir, "web-vitals.json");
// 未過濾流量（含 AI 爬蟲／搜尋引擎／掃描器）：跟上面的「造訪」相反，這份就是要在 server 端對每個
// request 計數，才數得到不執行 JS 的爬蟲。細節見 lib/raw-traffic.js
process.env.RAW_TRAFFIC_FILE = path.join(dataDir, "raw-traffic.json");
// 404 統計（決策表 C3，lib/not-found.js）：週報用。測試時可以從外面指到暫存檔
const notFoundFile = process.env.NOT_FOUND_FILE || path.join(dataDir, "not-found.json");
// Cloudflare 每天的流量數字（src/lib/stats/cloudflare-analytics.ts 一小時抓一次、合併存在這裡）
process.env.CLOUDFLARE_STATS_FILE = path.join(dataDir, "cloudflare-daily.json");
// CSP report-only 的違規回報（src/app/api/csp-report/route.ts）
process.env.CSP_REPORT_FILE = path.join(dataDir, "csp-reports.json");
// 訪客分析明細（src/lib/stats/visit-detail.ts）：頁面、來源、裝置、時段、新訪客
process.env.VISITS_DETAIL_FILE = path.join(dataDir, "visits-detail.json");
// 新功能上線 12 小時（deploy.ps1 寫，分頁圖示櫻花粉）
process.env.FEATURE_RELEASE_FILE = path.join(dataDir, "feature-release.json");
// 自家 FR24 雷達的彙總（lib/radar.js；下面 prepare 之後開始每 5 秒讀，.env.local 要有 RADAR_HOST）
process.env.RADAR_FILE = process.env.RADAR_FILE || path.join(dataDir, "radar.json");
process.env.RADAR_HEALTH_FILE = process.env.RADAR_HEALTH_FILE || path.join(dataDir, "radar-health.json");
// 維運狀態頁 /status（src/lib/ops/status.ts）：watchdog 每 5 分鐘一行的可用率、deploy.log、watchdog.log
process.env.UPTIME_FILE = process.env.UPTIME_FILE || path.join(dataDir, "uptime.log");
process.env.LOGS_DIR = process.env.LOGS_DIR || path.join(projectDir, "logs");

function rotateIfNeeded() {
  try {
    if (fs.statSync(logFile).size > MAX_LOG_BYTES) {
      fs.rmSync(logFile + ".1", { force: true });
      fs.renameSync(logFile, logFile + ".1");
    }
  } catch {
    // 檔案還不存在，略過
  }
}

function log(line) {
  rotateIfNeeded();
  const msg = `[${new Date().toISOString()}] ${line}\n`;
  fs.appendFileSync(logFile, msg);
  process.stdout.write(msg);
}

// 維修模式（2026-11-12）：data/maintenance.flag 存在時，頁面請求回 503＋維修頁（分頁圖示是琥珀色的視窗）。
// 開關：powershell -File scripts\maintenance.ps1 -On "原因"／-Off。檔案內容就是頁面上顯示的說明。
// 只擋「頁面」：/_next/、/api/、/status/、有副檔名的靜態檔照常放行——Cloudflare 快取裡的頁面還會來要 JS／CSS，
// 擋掉的話已經快取的頁面也會壞。watchdog、外部監控看到這頁不會當成網站掛了（見 watchdog.ps1／uptime.yml）。
// MAINTENANCE_FLAG：測試用，指到別的檔案（不然在這台桌機測維修模式會讓正式站真的進入維修）
const maintenanceFlag = process.env.MAINTENANCE_FLAG || path.join(dataDir, "maintenance.flag");
const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
function serveMaintenance(req, res) {
  if (!fs.existsSync(maintenanceFlag)) return false;
  const p = (req.url || "/").split("?")[0];
  if (p.startsWith("/_next/") || p.startsWith("/api/") || p.startsWith("/status/") || /\.[a-z0-9]+$/i.test(p)) return false;
  let reason = "";
  try {
    reason = fs.readFileSync(maintenanceFlag, "utf8").trim();
  } catch {}
  res.writeHead(503, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "Retry-After": "600",
  });
  res.end(`<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<!-- kbs0830-maintenance -->
<title>維修中 · Maintenance — PINGWEI LI</title><meta name="robots" content="noindex">
<link rel="icon" href="/status/maintenance.svg" type="image/svg+xml">
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#fafaf8;color:#1a1a1a;font-family:system-ui,"Noto Sans TC",sans-serif;padding:24px;box-sizing:border-box}
main{max-width:420px;text-align:center}img{width:72px;height:72px}h1{font-weight:300;font-size:28px;margin:24px 0 8px}
p{color:#6b6b6b;line-height:1.8;margin:0 0 6px;font-size:15px}.en{font-size:13px}</style></head>
<body><main><img src="/status/maintenance.svg" alt=""><h1>維修中 · Maintenance</h1>
<p>${escapeHtml(reason || "網站正在維護，很快就回來。")}</p><p class="en">Back soon. Please try again in a few minutes.</p></main></body></html>`);
  return true;
}

// 預熱（2026-11-26）：重啟／部署後第一個請求要載入該頁的程式碼，實測首頁 5 秒、後台 /admin/mail 7 秒，暖機後只要 40～120ms。
// 開機後自己依序打一輪（一次一個，不跟真人搶 CPU）。UA 用 kbs0830- 開頭、也沒有 cf-ipcountry：
// 不會算進未過濾流量（raw-traffic.js）；後台登入紀錄也認這個 UA 略過（lib/admin/login-log.ts）
const WARM_PATHS = [
  "/", "/blog", "/radar", "/status", "/stats", "/resume",
  "/admin", "/admin/ops", "/admin/traffic", "/admin/todo", "/admin/mail", "/admin/reports", "/admin/done",
];
// 2026-11-27（TODO U2）：Cache Components 的 "use cache" 快取在記憶體、每次部署（重啟）就清空，所以上面幾頁打完之後，
// 再讀自己的 sitemap.xml 把其餘的公開頁面也打一輪（約 55 頁），第一個訪客不用等伺服器重算。限速：同時 4 個。
function getPath(port, p) {
  return new Promise((resolve) => {
    const req = http.get({ host: "127.0.0.1", port, path: p, headers: { "user-agent": "kbs0830-warmup" }, timeout: 20000 }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.length < 64 && chunks.push(c)); // 只有 sitemap 要內容；其他頁讀掉丟掉就好
      res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      res.on("error", () => resolve(""));
    });
    req.on("timeout", () => req.destroy());
    req.on("error", () => resolve(""));
  });
}

async function mapPool(items, limit, fn) {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) await fn(items[next++]);
    }),
  );
}

function warmUp(port, log) {
  if (process.env.KBS_NO_WARMUP) return;
  (async () => {
    const t0 = Date.now();
    for (const p of WARM_PATHS) await getPath(port, p);
    const sitemap = await getPath(port, "/sitemap.xml");
    const rest = [...sitemap.matchAll(/<loc>https?:\/\/[^/]+(\/[^<]*)<\/loc>/g)].map((m) => m[1]).filter((p) => !WARM_PATHS.includes(p));
    await mapPool(rest, 4, (p) => getPath(port, p));
    log(`warmup done ${WARM_PATHS.length + rest.length} paths ${Date.now() - t0}ms`);
  })().catch(() => {});
}

const port = Number(process.env.PORT) || 3000;
const app = next({ dev: false, dir: appDir });
const handle = app.getRequestHandler();
// 回應時間趨勢（lib/response-times.js，TODO W4）：記憶體累積、每 5 分鐘寫進 data/response-times.json
process.env.RESPONSE_TIMES_FILE = process.env.RESPONSE_TIMES_FILE || path.join(dataDir, "response-times.json");
const responseTimes = createRecorder(process.env.RESPONSE_TIMES_FILE);
setInterval(() => responseTimes.flush(), 5 * 60_000).unref();
process.on("exit", () => responseTimes.flush());

app
  .prepare()
  .then(() => {
    const server = http.createServer(async (req, res) => {
      const start = Date.now();
      res.on("finish", () => {
        log(`${req.method} ${req.url} ${res.statusCode} ${Date.now() - start}ms`);
        recordRawHit(process.env.RAW_TRAFFIC_FILE, req);
        recordNotFound(notFoundFile, req, res.statusCode);
        responseTimes.record(req, Date.now() - start);
      });
      if (serveMaintenance(req, res)) return;
      try {
        await handle(req, res);
      } catch (err) {
        log(`ERROR ${req.method} ${req.url} ${err && err.stack ? err.stack : err}`);
        res.statusCode = 500;
        res.end("Internal Server Error");
      }
    });

    server.listen(port, () => {
      log(`server ready on http://localhost:${port} (pid ${process.pid})`);
      warmUp(port, log);
    });

    // 自家雷達：.env.local 的 RADAR_HOST（Next 在 prepare 時才把 .env.local 載進 process.env，所以放這裡）。
    // 沒設就不跑；RADAR_FILE 可以從外面指定（本機測試不要寫到正式的 data/radar.json）
    if (process.env.RADAR_HOST) {
      startRadarPoller({ host: process.env.RADAR_HOST, file: process.env.RADAR_FILE, log });
      log(`radar poller started (${process.env.RADAR_FILE})`);
      // 樹莓派本身的健康（溫度、供電、記憶卡），每 15 分鐘 SSH 讀一次，只給後台看（lib/radar-health.js）
      // 順便把樹莓派的系統 log 存一份到 logs/pi/（PI_LOG_DIR 可以改；本機測試不要寫到正式的資料夾）
      const piLogDir = process.env.PI_LOG_DIR || path.join(logDir, "pi");
      const piCursor = process.env.PI_LOG_CURSOR || path.join(dataDir, "pi-journal-cursor.txt");
      if (startRadarHealthPoller({ host: process.env.RADAR_HOST, file: process.env.RADAR_HEALTH_FILE, radarFile: process.env.RADAR_FILE, journalDir: piLogDir, cursorFile: piCursor, log }))
        log(`radar health poller started (${process.env.RADAR_HEALTH_FILE}; log → ${piLogDir})`);
    }

    // 2026-08 發現整站每隔約 3 天會完全沒回應一次（watchdog 自動重啟恢復，見
    // watchdog.log），process 沒有崩潰也沒有任何例外 log，事發前後都很安靜——
    // 懷疑是 Next.js 16.x 已知的幾個 fetch()/stream 相關 memory leak
    // （這個專案唯一的 server-side fetch() 在 /api/spotify/now-playing）。
    // 這段只是低成本的診斷用途：定期把記憶體/uptime 寫進同一份 server.log，
    // 下次再發生時才有實際數據可以比對，而不是像現在這樣事發前一片空白。
    // 不持有任何會累積的狀態，只是讀取 process 內建計數器後寫 log，不會自己
    // 變成新的洩漏來源。
    setInterval(() => {
      const m = process.memoryUsage();
      const mb = (n) => (n / 1048576).toFixed(1);
      log(
        `MEM rss=${mb(m.rss)}MB heapUsed=${mb(m.heapUsed)}MB ` +
          `external=${mb(m.external)}MB arrayBuffers=${mb(m.arrayBuffers)}MB ` +
          `uptime=${(process.uptime() / 3600).toFixed(1)}h`
      );
    }, 30 * 60 * 1000).unref();
  })
  .catch((err) => {
    log(`FATAL startup error: ${err && err.stack ? err.stack : err}`);
    process.exit(1);
  });

process.on("uncaughtException", (err) => log(`UNCAUGHT EXCEPTION: ${err && err.stack ? err.stack : err}`));
process.on("unhandledRejection", (err) => log(`UNHANDLED REJECTION: ${err}`));
process.on("SIGTERM", () => { log("received SIGTERM, shutting down"); process.exit(0); });
process.on("SIGINT", () => { log("received SIGINT, shutting down"); process.exit(0); });
