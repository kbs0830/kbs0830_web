// Cloudflare 的流量數字（2026-11-06，使用者看 dashboard：「我的造訪資料沒那麼少啊」）。
//
// Footer 自己算的「造訪」只算執行 JS 的真人瀏覽器、只有首頁會回報；Cloudflare 看得到每一個經過 edge 的請求
// （含快取直接回應、根本沒到主機的那 45%），數字跟 dashboard 一致。用 GraphQL Analytics API 的
// httpRequests1dGroups（免費方案可查），一天一筆：uniques（當天不重複 IP）、pageViews、requests。
//
// - 金鑰：.env.local 的 CLOUDFLARE_ANALYTICS_TOKEN，只有「區域 → 分析 → 讀取」（kbs0830.com），讀 DNS 會被拒。
//   沒設就整段不顯示，不影響其他功能
// - 每天的數字存在 data/cloudflare-daily.json（server.js 設 CLOUDFLARE_STATS_FILE），合併不覆蓋：
//   Cloudflare 只保留一段時間的資料，存在本機的「累計」才不會哪天變少
// - 一小時最多更新一次，而且是在背景更新：回應直接用檔案裡現有的數字，不等 Cloudflare
// - 「訪客」是每天不重複 IP 加總（跟 dashboard 的 30 天視圖同一種算法），同一個人隔天再來會算兩次
import fs from "fs";
import path from "path";

export const CLOUDFLARE_ZONE_ID = "bedff9fea6cd187647a5f2dbd02ae833"; // kbs0830.com，不是機密
const REFRESH_MS = 60 * 60 * 1000;
const DAY_MS = 864e5;

export type DailyRow = { date: string; uniques: number; pageViews: number; requests: number };
type StoredStats = { updatedAt: string; days: Record<string, Omit<DailyRow, "date">> };
type Totals = { uniques: number; pageViews: number; requests: number };
export type CloudflareSummary = { since: string; last30: Totals; total: Totals };

const statsFile = () =>
  process.env.CLOUDFLARE_STATS_FILE ||
  path.join(/* turbopackIgnore: true */ process.cwd(), "data", "cloudflare-daily.json");

function readStored(): StoredStats | null {
  try {
    return JSON.parse(fs.readFileSync(statsFile(), "utf8"));
  } catch {
    return null;
  }
}

/** 新抓到的那幾天覆蓋舊的（當天還沒過完，數字會一直長），其他天保留 */
export function mergeDays(stored: StoredStats["days"], rows: DailyRow[]): StoredStats["days"] {
  const days = { ...stored };
  for (const { date, ...rest } of rows) days[date] = rest;
  return days;
}

export function summarize(days: StoredStats["days"], today = new Date()): CloudflareSummary | null {
  const dates = Object.keys(days).sort();
  if (dates.length === 0) return null;
  // Cloudflare 的 date 是 UTC 日期
  const cutoff = new Date(today.getTime() - 29 * DAY_MS).toISOString().slice(0, 10);
  const add = (acc: Totals, d: string) => ({
    uniques: acc.uniques + days[d].uniques,
    pageViews: acc.pageViews + days[d].pageViews,
    requests: acc.requests + days[d].requests,
  });
  const zero = { uniques: 0, pageViews: 0, requests: 0 };
  return {
    since: dates[0],
    last30: dates.filter((d) => d >= cutoff).reduce(add, zero),
    total: dates.reduce(add, zero),
  };
}

export function readCloudflareSummary(): CloudflareSummary | null {
  const stored = readStored();
  return stored ? summarize(stored.days) : null;
}

const QUERY = `query($z:String!,$s:Date!,$u:Date!){viewer{zones(filter:{zoneTag:$z}){
  httpRequests1dGroups(limit:400,filter:{date_geq:$s,date_leq:$u},orderBy:[date_ASC]){
    dimensions{date} sum{requests pageViews} uniq{uniques}}}}}`;

type GqlRow = { dimensions: { date: string }; sum: { requests: number; pageViews: number }; uniq: { uniques: number } };

async function fetchDays(token: string, since: string, until: string): Promise<DailyRow[]> {
  const res = await fetch("https://api.cloudflare.com/client/v4/graphql", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: QUERY, variables: { z: CLOUDFLARE_ZONE_ID, s: since, u: until } }),
    signal: AbortSignal.timeout(15_000),
  });
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  const rows: GqlRow[] = json.data?.viewer?.zones?.[0]?.httpRequests1dGroups ?? [];
  return rows.map((r) => ({
    date: r.dimensions.date,
    uniques: r.uniq.uniques,
    pageViews: r.sum.pageViews,
    requests: r.sum.requests,
  }));
}

let inFlight: Promise<void> | null = null;
// 失敗後 10 分鐘內不重試：金鑰失效時才不會變成「每個訪客都觸發一次 Cloudflare API」
let lastAttempt = 0;
const RETRY_MS = 10 * 60 * 1000;

/** 超過一小時沒更新就去 Cloudflare 抓（第一次抓一年，之後只抓最近 3 天），同時間只會有一個請求 */
export function refreshCloudflareIfStale(now = new Date()): Promise<void> {
  const token = process.env.CLOUDFLARE_ANALYTICS_TOKEN;
  if (!token || inFlight) return inFlight ?? Promise.resolve();
  const stored = readStored();
  if (stored && now.getTime() - Date.parse(stored.updatedAt) < REFRESH_MS) return Promise.resolve();
  if (now.getTime() - lastAttempt < RETRY_MS) return Promise.resolve();
  lastAttempt = now.getTime();

  const lookback = stored ? 2 : 364;
  const since = new Date(now.getTime() - lookback * DAY_MS).toISOString().slice(0, 10);
  const until = now.toISOString().slice(0, 10);
  inFlight = fetchDays(token, since, until)
    .then((rows) => {
      const next: StoredStats = { updatedAt: now.toISOString(), days: mergeDays(stored?.days ?? {}, rows) };
      fs.mkdirSync(path.dirname(statsFile()), { recursive: true });
      fs.writeFileSync(statsFile(), JSON.stringify(next));
    })
    .catch(() => {
      // 網路／權限問題：沿用舊數字，下一個請求再試
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}
