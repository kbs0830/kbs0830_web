// @ts-check
// 回應時間趨勢（2026-11-29，TODO W4，使用者：「我的網站部署跟查詢越來越久」）。
// server.log 一個檔案只留一天，看不出「是不是越來越慢」。這支把每個請求的耗時記成「每小時一格的直方圖」，
// 留 90 天，後台維運頁（lib/admin/views.ts）畫每天的 p50／p95。
// - 只算真的從 Cloudflare 進來的頁面／API 請求（有 cf-ipcountry）：不算本機測試、watchdog 的 PowerShell、kbs0830- 開頭的自己人工具、
//   預先載入、靜態檔（跟 raw-traffic.js 同一套規則）
// - 只存直方圖（每格 11 個數字），不存網址、IP、UA
// - 記憶體裡累積，每 5 分鐘寫一次檔（Task Scheduler 停站是直接結束 process，所以重啟會少最後幾分鐘，趨勢不受影響）；重啟後從檔案接著累積（一天部署 30～47 次，不能每次歸零）
// - 百分位數是「落在哪個格子」的上界，不是精確值：夠看趨勢

const fs = require("node:fs");
const path = require("node:path");
const { twDate, twHour } = require("./tw-time");

/** 直方圖的格子上界（毫秒），最後一格是「超過 5000」 */
const BOUNDS = [5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000];
const KEEP_HOURS = 90 * 24;
const ASSET_PATTERN = /\.(?:js|mjs|css|map|png|jpe?g|gif|webp|avif|svg|ico|woff2?|ttf|otf|mp4|webm)$/i;

/** @param {{ method?: string, url?: string, headers: Record<string, string | string[] | undefined> }} req @returns {"page" | "api" | null} */
function kindOf(req) {
  const h = req.headers;
  if (req.method !== "GET" && req.method !== "HEAD") return null;
  if (!h["cf-ipcountry"]) return null;
  const ua = String(h["user-agent"] || "");
  if (ua.includes("WindowsPowerShell") || ua.includes("kbs0830-")) return null;
  if (h["next-router-prefetch"] || /prefetch/i.test(String(h["sec-purpose"] || h["purpose"] || ""))) return null;
  const pathname = (req.url || "/").split("?")[0];
  if (pathname.startsWith("/_next/") || ASSET_PATTERN.test(pathname)) return null;
  return pathname.startsWith("/api/") ? "api" : "page";
}

const emptyCell = () => ({ n: 0, sum: 0, max: 0, h: new Array(BOUNDS.length + 1).fill(0) });

/** @param {number} ms */
function bucketOf(ms) {
  const i = BOUNDS.findIndex((b) => ms <= b);
  return i === -1 ? BOUNDS.length : i;
}

/** 直方圖的百分位數（格子上界；落在最後一格就用 max） @param {{ n: number, max: number, h: number[] }} cell @param {number} p 0～1 */
function percentile(cell, p) {
  if (!cell || cell.n === 0) return null;
  const target = Math.ceil(cell.n * p);
  let acc = 0;
  for (let i = 0; i < cell.h.length; i++) {
    acc += cell.h[i];
    if (acc >= target) return i < BOUNDS.length ? Math.min(BOUNDS[i], cell.max) : cell.max;
  }
  return cell.max;
}

/** 把好幾格合成一格 @param {{ n: number, sum: number, max: number, h: number[] }[]} cells */
function mergeCells(cells) {
  const out = emptyCell();
  for (const c of cells) {
    out.n += c.n;
    out.sum += c.sum;
    out.max = Math.max(out.max, c.max);
    c.h.forEach((v, i) => (out.h[i] += v));
  }
  return out;
}

/** @param {string | undefined} file */
function createRecorder(file) {
  /** @type {Record<string, { page: ReturnType<typeof emptyCell>, api: ReturnType<typeof emptyCell> }>} */
  let hours = {};
  let dirty = false;
  try {
    if (file) hours = JSON.parse(fs.readFileSync(file, "utf8")).hours || {};
  } catch {}

  /** @param {{ method?: string, url?: string, headers: Record<string, string | string[] | undefined> }} req @param {number} ms */
  function record(req, ms, now = Date.now()) {
    const kind = kindOf(req);
    if (!kind) return false;
    const key = `${twDate(now)}T${String(twHour(now)).padStart(2, "0")}`;
    const cell = (hours[key] ||= { page: emptyCell(), api: emptyCell() })[kind];
    cell.n += 1;
    cell.sum += ms;
    cell.max = Math.max(cell.max, ms);
    cell.h[bucketOf(ms)] += 1;
    dirty = true;
    return true;
  }

  function flush() {
    if (!file || !dirty) return false;
    const keys = Object.keys(hours).sort();
    for (const old of keys.slice(0, Math.max(0, keys.length - KEEP_HOURS))) delete hours[old];
    try {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(`${file}.tmp`, JSON.stringify({ bounds: BOUNDS, hours }));
      fs.renameSync(`${file}.tmp`, file);
      dirty = false;
      return true;
    } catch {
      return false; // 寫不進去下次再試
    }
  }

  return { record, flush, snapshot: () => hours };
}

module.exports = { BOUNDS, kindOf, bucketOf, percentile, mergeCells, createRecorder };
