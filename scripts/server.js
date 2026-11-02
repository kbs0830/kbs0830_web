// 自訂 production server：包一層 request/error log，寫進 logs/server.log。
// 用這個取代 `next start` 直接當 Task Scheduler 的 Action，
// 這樣才有實際的 server 端 log 可以查（之前完全沒有 —— server 掛了/回應異常都只能用 curl 反推）。
//
// 注意：這個檔案本身就是 Task Scheduler 直接追蹤的那個 node.exe process，
// 不要把它包成再啟動另一個子行程的 wrapper，否則 stop/restart 會殺不乾淨
// （這正是 2026-07 全白頁面事件的根因，細節見 CLAUDE.md）。

const path = require("path");
const fs = require("fs");
const http = require("http");
const next = require("next");

const projectDir = path.join(__dirname, "..");
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
      });
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
