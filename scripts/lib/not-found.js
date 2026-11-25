// 404 統計（決策表 C3，2026-11-25）：哪些網址被打了但不存在——壞掉的站外連結、改過的舊網址、打錯字。
// 日報／週報／月報（src/lib/stats/reports.ts）列前幾名。
//
// 只存「台灣日期 → 路徑 → 次數」，不存 IP、UA、query string。保留 35 天。
// 掃描器（找 .php、.env、wp-admin 這類漏洞的機器人）每天幾百次，跟這個網站無關：只記總數，不記路徑。
// 不算：沒經過 Cloudflare（本機、健檢）、自己的工具（WindowsPowerShell／kbs0830-）、非 GET／HEAD。

const fs = require("node:fs");
const path = require("node:path");
const { twDate } = require("./tw-time");

const KEEP_DAYS = 35;
const MAX_PATHS_PER_DAY = 100;
const SCANNER =
  /\.(?:php\d?|aspx?|jsp|cgi|env|git|sql|bak|old|zip|tar|gz|rar|7z|ini|yml|yaml|xml\.bak|log|swp)(?:$|[/.])|\/(?:wp-|wordpress|xmlrpc|phpmyadmin|pma|cgi-bin|vendor\/|\.git|\.env|\.aws|\.ssh|\.vscode|\.idea|actuator|boaform|owa\/|admin(?:istrator)?(?:\/|$)|manager\/|console\/|hnap1|solr\/|druid\/|telescope|debug\/|_ignition|server-status|config\.json|sftp-config)/i;

/** @param {{ method?: string, url?: string, headers: Record<string, string | string[] | undefined> }} req */
function shouldRecord(req, status) {
  if (status !== 404) return false;
  if (req.method !== "GET" && req.method !== "HEAD") return false;
  const h = req.headers;
  if (!h["cf-ipcountry"]) return false;
  const ua = String(h["user-agent"] || "");
  return !(ua.includes("WindowsPowerShell") || ua.includes("kbs0830-"));
}

/** 路徑整理：去掉 query、太長截斷；舊版 build 的 chunk 合成一類。回 null＝掃描器 */
function normalizePath(url) {
  let p = String(url || "/").split(/[?#]/)[0] || "/";
  try {
    p = decodeURIComponent(p);
  } catch {}
  if (SCANNER.test(p)) return null;
  if (p.startsWith("/_next/")) return "/_next/…（舊版的檔案）";
  return p.length > 120 ? p.slice(0, 120) + "…" : p;
}

/** 純函式：把一次 404 加進統計 */
function addNotFound(stats, url, now) {
  const s = stats && stats.days ? stats : { days: {}, scanners: {} };
  if (!s.scanners) s.scanners = {};
  const date = twDate(now.getTime());
  const p = normalizePath(url);
  if (p === null) {
    s.scanners[date] = (s.scanners[date] || 0) + 1;
  } else {
    const day = (s.days[date] = s.days[date] || {});
    const key = day[p] === undefined && Object.keys(day).length >= MAX_PATHS_PER_DAY ? "(其他)" : p;
    day[key] = (day[key] || 0) + 1;
  }
  const cutoff = twDate(now.getTime() - KEEP_DAYS * 86400_000);
  for (const k of Object.keys(s.days)) if (k < cutoff) delete s.days[k];
  for (const k of Object.keys(s.scanners)) if (k < cutoff) delete s.scanners[k];
  return s;
}

// 同步 read-modify-write：單一 process、中間沒有 await，理由同 raw-traffic.js
function recordNotFound(file, req, status, now = new Date()) {
  if (!file || !shouldRecord(req, status)) return false;
  let stats = null;
  try {
    stats = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {}
  const next = addNotFound(stats, req.url, now);
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(next));
  } catch {}
  return true;
}

module.exports = { shouldRecord, normalizePath, addNotFound, recordNotFound };
