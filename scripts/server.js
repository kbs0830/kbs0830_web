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

const path = require("path");
const fs = require("fs");
const http = require("http");
const next = require("next");
const { recordRawHit } = require("./lib/raw-traffic");

const projectDir = path.join(__dirname, "..");
// Task Scheduler 的工作沒有設「開始位置」，process.cwd() 會是 C:\Windows\System32。
// src/lib/blog.ts 用 process.cwd() 找 content/blog：已 prerender 的文章沒差，但不存在的
// slug（掃描器亂打的 /blog/.env、/blog/wp-login.php）要即時渲染，readdirSync 找不到資料夾
// → 500 而不是 404（2026-11-05 才發現，Search Console 的 5xx 也有一部分是這個）。
process.chdir(projectDir);
const logDir = path.join(projectDir, "logs");
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
const dataDir = path.join(projectDir, "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
process.env.VISITOR_STATS_FILE = path.join(dataDir, "visitor-stats.json");
process.env.WEB_VITALS_FILE = path.join(dataDir, "web-vitals.json");
// 未過濾流量（含 AI 爬蟲／搜尋引擎／掃描器）：跟上面的「造訪」相反，這份就是要在 server 端對每個
// request 計數，才數得到不執行 JS 的爬蟲。細節見 lib/raw-traffic.js
process.env.RAW_TRAFFIC_FILE = path.join(dataDir, "raw-traffic.json");
// Cloudflare 每天的流量數字（src/lib/cloudflare-analytics.ts 一小時抓一次、合併存在這裡）
process.env.CLOUDFLARE_STATS_FILE = path.join(dataDir, "cloudflare-daily.json");
// CSP report-only 的違規回報（src/app/api/csp-report/route.ts）
process.env.CSP_REPORT_FILE = path.join(dataDir, "csp-reports.json");
// 訪客分析明細（src/lib/visit-detail.ts）：頁面、來源、裝置、時段、新訪客
process.env.VISITS_DETAIL_FILE = path.join(dataDir, "visits-detail.json");

// deploy.ps1 輪流 build 到 .next-a / .next-b，這個檔案記著目前上線的是哪一槽
// （next.config.ts 讀 NEXT_DIST_DIR）。沒有這個檔案就是預設的 .next。
const distDirFile = path.join(dataDir, "next-dist-dir.txt");
if (!process.env.NEXT_DIST_DIR && fs.existsSync(distDirFile)) {
  process.env.NEXT_DIST_DIR = fs.readFileSync(distDirFile, "utf8").trim();
}

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

const port = Number(process.env.PORT) || 3000;
const app = next({ dev: false, dir: projectDir });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    const server = http.createServer(async (req, res) => {
      const start = Date.now();
      res.on("finish", () => {
        log(`${req.method} ${req.url} ${res.statusCode} ${Date.now() - start}ms`);
        recordRawHit(process.env.RAW_TRAFFIC_FILE, req);
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
    });

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
