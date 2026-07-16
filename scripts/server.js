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

// 訪客來源國家統計：只記國家層級的聚合次數，不記 IP、不記任何個人可識別資訊。
// 資料來源是 Cloudflare Tunnel 轉發過來的請求本來就帶著的 `cf-ipcountry` header
// （Cloudflare edge 加的，不需要額外串任何第三方服務、不需要註冊帳號）。
const dataDir = path.join(projectDir, "data");
const visitorStatsFile = path.join(dataDir, "visitor-stats.json");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

let visitorStats = {};
try {
  visitorStats = JSON.parse(fs.readFileSync(visitorStatsFile, "utf8"));
} catch {
  visitorStats = {};
}

const BOT_UA_PATTERN = /bot|spider|crawl|slurp|facebookexternalhit|preview/i;

function recordVisit(req, res) {
  if (req.method !== "GET") return;
  const url = req.url || "";
  if (url.startsWith("/api/") || url.startsWith("/_next/")) return;
  if (/\.[a-zA-Z0-9]+$/.test(url.split("?")[0])) return; // 排除靜態資源（有副檔名的路徑）
  if (res.statusCode !== 200) return;
  if (BOT_UA_PATTERN.test(req.headers["user-agent"] || "")) return;

  const country = (req.headers["cf-ipcountry"] || "XX").toUpperCase();
  visitorStats[country] = (visitorStats[country] || 0) + 1;
  try {
    fs.writeFileSync(visitorStatsFile, JSON.stringify(visitorStats));
  } catch (err) {
    log(`WARN 寫入 visitor-stats.json 失敗: ${err}`);
  }
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
        recordVisit(req, res);
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
  })
  .catch((err) => {
    log(`FATAL startup error: ${err && err.stack ? err.stack : err}`);
    process.exit(1);
  });

process.on("uncaughtException", (err) => log(`UNCAUGHT EXCEPTION: ${err && err.stack ? err.stack : err}`));
process.on("unhandledRejection", (err) => log(`UNHANDLED REJECTION: ${err}`));
process.on("SIGTERM", () => { log("received SIGTERM, shutting down"); process.exit(0); });
process.on("SIGINT", () => { log("received SIGINT, shutting down"); process.exit(0); });
