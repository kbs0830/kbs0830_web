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
  })
  .catch((err) => {
    log(`FATAL startup error: ${err && err.stack ? err.stack : err}`);
    process.exit(1);
  });

process.on("uncaughtException", (err) => log(`UNCAUGHT EXCEPTION: ${err && err.stack ? err.stack : err}`));
process.on("unhandledRejection", (err) => log(`UNHANDLED REJECTION: ${err}`));
process.on("SIGTERM", () => { log("received SIGTERM, shutting down"); process.exit(0); });
process.on("SIGINT", () => { log("received SIGINT, shutting down"); process.exit(0); });
