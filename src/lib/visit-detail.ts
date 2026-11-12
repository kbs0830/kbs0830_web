// 訪客分析的明細彙總（2026-11-09，使用者：「幫我做一個訪客分析的頁面」）。
//
// 資料來源：layout 的 VisitBeacon（瀏覽器真的執行 JS 才會送）→ POST /api/visitor-stats。
// 只存「分類 → 次數」，不存 IP、完整 UA、完整網址、query string、cookie：
//   - 頁面：只留路徑，而且只收看起來像本站路由的（英數字、-、/），其他一律算「(其他)」
//   - 來源：只留網域（從哪個網站點進來），站內換頁不算來源
//   - 裝置／瀏覽器／作業系統：從 UA 粗分成幾類，UA 本身不存
//   - 新訪客／新工作階段：瀏覽器端用 localStorage／sessionStorage 記「來過沒」，伺服器只收到 true/false
// 檔案：data/visits-detail.json（VISITS_DETAIL_FILE，scripts/server.js 設）。寫入跟 visitor-stats 一樣同步 read-modify-write。
import fs from "fs";
import path from "path";

export type VisitInput = { path?: unknown; ref?: unknown; newSession?: unknown; newVisitor?: unknown };

export type DayCounts = { views: number; sessions: number; newVisitors: number };

export type VisitDetail = {
  since: string;
  days: Record<string, DayCounts>;
  hours: number[]; // 台灣時間 0～23 點的瀏覽次數
  pages: Record<string, number>;
  referrers: Record<string, number>; // 工作階段的來源網域；直接進入不記（總工作階段 − 有來源的）
  devices: Record<string, number>; // 以工作階段計
  browsers: Record<string, number>;
  os: Record<string, number>;
};

const KEEP_DAYS = 120;
const MAX_PAGES = 200;
const MAX_REFERRERS = 100;

export const detailFile = () =>
  process.env.VISITS_DETAIL_FILE || path.join(/* turbopackIgnore: true */ process.cwd(), "data", "visits-detail.json");

/** 台灣時間的日期（YYYY-MM-DD）跟小時 */
export function taipeiTime(now: Date): { date: string; hour: number } {
  const t = new Date(now.getTime() + 8 * 3600_000);
  return { date: t.toISOString().slice(0, 10), hour: t.getUTCHours() };
}

/** 只收像本站路由的路徑；其餘（掃描器亂打、怪字元）算「(其他)」 */
export function normalizePath(p: unknown): string {
  if (typeof p !== "string") return "(其他)";
  const clean = p.split("?")[0].split("#")[0].toLowerCase();
  if (clean.length > 80 || !/^\/[a-z0-9\-/.]*$/.test(clean) || clean.includes("..")) return "(其他)";
  return clean.length > 1 ? clean.replace(/\/+$/, "") : clean;
}

/** 來源只留網域；自己的網域、空的、怪的都回 null */
export function referrerHost(ref: unknown): string | null {
  if (typeof ref !== "string" || !ref) return null;
  try {
    const host = new URL(ref).hostname.toLowerCase().replace(/^www\./, "");
    if (!/^[a-z0-9.-]{1,80}$/.test(host) || host === "kbs0830.com") return null;
    return host;
  } catch {
    return null;
  }
}

/** UA 粗分：裝置、瀏覽器、作業系統（順序有意義：Edge／Samsung 的 UA 也含 Chrome，iPad 新版 UA 會偽裝成 Mac） */
export function classifyUA(ua: string): { device: string; browser: string; os: string } {
  const s = ua || "";
  const os = /iPhone|iPad|iPod/.test(s)
    ? "iOS"
    : /Android/.test(s)
      ? "Android"
      : /Windows/.test(s)
        ? "Windows"
        : /Mac OS X|Macintosh/.test(s)
          ? "macOS"
          : /Linux|CrOS/.test(s)
            ? "Linux"
            : "其他";
  const device = /iPad|Tablet/.test(s) || (/Android/.test(s) && !/Mobile/.test(s))
    ? "平板"
    : /Mobile|iPhone|iPod/.test(s)
      ? "手機"
      : "桌機";
  const browser = /Edg\//.test(s)
    ? "Edge"
    : /SamsungBrowser/.test(s)
      ? "Samsung"
      : /Firefox\/|FxiOS/.test(s)
        ? "Firefox"
        : /Line\//.test(s)
          ? "LINE"
          : /FBAN|FBAV|Instagram/.test(s)
            ? "FB／IG"
            : /Chrome\/|CriOS/.test(s)
              ? "Chrome"
              : /Safari\//.test(s)
                ? "Safari"
                : "其他";
  return { device, browser, os };
}

export function emptyDetail(now: Date): VisitDetail {
  return { since: taipeiTime(now).date, days: {}, hours: Array(24).fill(0), pages: {}, referrers: {}, devices: {}, browsers: {}, os: {} };
}

export function readDetail(): VisitDetail | null {
  try {
    return JSON.parse(fs.readFileSync(detailFile(), "utf8"));
  } catch {
    return null;
  }
}

const bump = (map: Record<string, number>, key: string, max: number) => {
  if (map[key] === undefined && Object.keys(map).length >= max) key = "(其他)";
  map[key] = (map[key] ?? 0) + 1;
};

/** 把一次造訪加進彙總（純函式，方便測試） */
export function addVisit(detail: VisitDetail, input: VisitInput, ua: string, now: Date): VisitDetail {
  const d = structuredClone(detail);
  const { date, hour } = taipeiTime(now);
  const day = (d.days[date] ??= { views: 0, sessions: 0, newVisitors: 0 });
  day.views++;
  d.hours[hour] = (d.hours[hour] ?? 0) + 1;
  bump(d.pages, normalizePath(input.path), MAX_PAGES);

  // 工作階段層級的東西只在每個工作階段的第一頁記一次
  if (input.newSession === true) {
    day.sessions++;
    if (input.newVisitor === true) day.newVisitors++;
    const host = referrerHost(input.ref);
    if (host) bump(d.referrers, host, MAX_REFERRERS);
    const c = classifyUA(ua);
    bump(d.devices, c.device, 10);
    bump(d.browsers, c.browser, 20);
    bump(d.os, c.os, 20);
  }

  // 只留最近 KEEP_DAYS 天的每日數字（其他分類是累計）
  const dates = Object.keys(d.days).sort();
  for (const old of dates.slice(0, Math.max(0, dates.length - KEEP_DAYS))) delete d.days[old];
  return d;
}

/** 寫檔（同步：理由見 /api/visitor-stats 的 POST 註解） */
export function recordVisit(input: VisitInput, ua: string, now = new Date()): void {
  const next = addVisit(readDetail() ?? emptyDetail(now), input, ua, now);
  try {
    fs.mkdirSync(path.dirname(detailFile()), { recursive: true });
    fs.writeFileSync(detailFile(), JSON.stringify(next));
  } catch {
    // 寫不進去不影響回應
  }
}

/** 最近 n 天（台灣日期）每天的數字，沒資料補 0 */
export function lastDays(detail: VisitDetail, n: number, now = new Date()): ({ date: string } & DayCounts)[] {
  return Array.from({ length: n }, (_, i) => {
    const date = taipeiTime(new Date(now.getTime() - (n - 1 - i) * 864e5)).date;
    return { date, ...(detail.days[date] ?? { views: 0, sessions: 0, newVisitors: 0 }) };
  });
}
