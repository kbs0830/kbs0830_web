// 外部 API 的伺服器端快取（TODO D 系列，2026-11-22）：天氣、匯率、空氣品質、機場航班共用。
// 做法照 Cloudflare 流量那套：伺服器去抓、存在記憶體，訪客的瀏覽器不連第三方（不用改 CSP、不把訪客 IP 給別人）。
//   - 過期才重抓；同一時間只抓一次（很多人同時打開頁面也只有一個請求出去）
//   - 抓失敗就繼續給上一次成功的資料（跟日圓匯率作品的 LKG 回退同一個想法），完全沒有過就回 null，畫面不顯示那塊
//   - 失敗後 failRetryMs 內不重試，不要對壞掉的服務一直打
// 存在 module 層級：scripts/server.js 是長駐的 process，部署重啟才清空（重啟後第一個請求重抓）。

interface Entry<T> {
  value: T | null;
  at: number; // 上次成功的時間
  failedAt: number;
  pending: Promise<T | null> | null;
}

const entries = new Map<string, Entry<unknown>>();

export interface Cached<T> {
  value: T;
  /** 這份資料是什麼時候抓的（ms） */
  at: number;
  /** 最近一次重抓失敗、現在給的是舊資料 */
  stale: boolean;
}

export async function cached<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
  { failRetryMs = 60_000, now = Date.now() }: { failRetryMs?: number; now?: number } = {},
): Promise<Cached<T> | null> {
  let e = entries.get(key) as Entry<T> | undefined;
  if (!e) {
    e = { value: null, at: 0, failedAt: 0, pending: null };
    entries.set(key, e as Entry<unknown>);
  }
  const fresh = e.value !== null && now - e.at < ttlMs;
  const coolingDown = now - e.failedAt < failRetryMs;
  if (!fresh && !coolingDown) {
    const entry = e;
    entry.pending ??= loader()
      .then((v) => {
        entry.value = v;
        entry.at = Date.now();
        entry.failedAt = 0;
        return v;
      })
      .catch((err) => {
        entry.failedAt = Date.now();
        console.warn(`[live-cache] ${key} 抓不到：${err instanceof Error ? err.message : err}`);
        return null;
      })
      .finally(() => {
        entry.pending = null;
      });
    await entry.pending;
  }
  if (e.value === null) return null;
  return { value: e.value, at: e.at, stale: e.failedAt > e.at };
}

/** 抓 JSON／文字的共用設定：逾時 10 秒、帶一般瀏覽器 UA（台銀的 CSV 沒帶 UA 會被擋成驗證頁） */
export const FETCH_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export async function fetchText(url: string, timeoutMs = 10_000): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": FETCH_UA }, signal: AbortSignal.timeout(timeoutMs), cache: "no-store" });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

export async function fetchJson<T = unknown>(url: string, timeoutMs = 10_000): Promise<T> {
  return JSON.parse(await fetchText(url, timeoutMs)) as T;
}
