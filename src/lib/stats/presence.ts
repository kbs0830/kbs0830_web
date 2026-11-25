// 「いま N 人」：現在正在看網站的人數（TODO B4，2026-11-23）。
// 每個分頁 30 秒回報一次（components/live/Presence.tsx），伺服器只在記憶體裡記「分頁代碼 → 最後回報時間」，
// 超過 TTL 沒回報就不算。不寫檔、不存 IP／UA／頁面，重啟就歸零（本來就是「現在」的數字）。
// 分頁代碼是瀏覽器 sessionStorage 裡的隨機字串（關掉分頁就沒了），只用來不重複計算同一個分頁。

export const PRESENCE_TTL_MS = 70_000; // 30 秒回報一次，多留一輪的餘裕
const MAX_ENTRIES = 2000; // 防灌爆記憶體：滿了先清過期的，還是滿就不收新的

const seen = new Map<string, number>();

export const isPresenceId = (id: unknown): id is string => typeof id === "string" && /^[a-z0-9-]{8,40}$/.test(id);

function prune(now: number) {
  for (const [id, at] of seen) if (now - at > PRESENCE_TTL_MS) seen.delete(id);
}

export function touch(id: string, now = Date.now()) {
  if (!seen.has(id) && seen.size >= MAX_ENTRIES) {
    prune(now);
    if (seen.size >= MAX_ENTRIES) return;
  }
  seen.set(id, now);
}

export function leave(id: string) {
  seen.delete(id);
}

export function presenceCount(now = Date.now()): number {
  prune(now);
  return seen.size;
}

/** 測試用 */
export function resetPresence() {
  seen.clear();
}
