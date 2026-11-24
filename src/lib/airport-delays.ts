import type { Flight } from "./airport-board";

// 小港機場延誤統計（決策表 J3，2026-11-25）。官方網站只給「今天」的看板，不留歷史——
// 網站每 20 分鐘把小港的看板記一次（lib/airport-delay-recorder.ts，instrumentation.ts 啟動），
// 同一班同一天只留最後看到的狀態，累積起來就是「哪班最常延誤、平均晚幾分鐘」。只有這個網站有的資料。
// 檔案：data/airport-delays.json（不進 git）；留 120 天。

export interface DelayEntry {
  code: string;
  dir: Flight["dir"];
  place: string;
  sched: string; // HH:MM 表定
  changed: string | null; // HH:MM 預計／實際（跟表定一樣就是 null）
  kind: Flight["kind"];
}

export interface DelayStore {
  since: string; // YYYY-MM-DD（台灣日期）
  days: Record<string, Record<string, DelayEntry>>; // 日期 → 「代碼|方向|表定」→ 最後看到的狀態
}

const KEEP_DAYS = 120;
export const twDate = (ms: number) => new Date(ms + 8 * 3600_000).toISOString().slice(0, 10);

/** 晚了幾分鐘（提早是負的）；跨午夜的（23:50 → 00:20）算 30 分 */
export function delayMinutes(sched: string, changed: string | null): number | null {
  if (!changed) return 0;
  const toMin = (hm: string) => Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3, 5));
  if (!/^\d{2}:\d{2}$/.test(sched) || !/^\d{2}:\d{2}$/.test(changed)) return null;
  let d = toMin(changed) - toMin(sched);
  if (d < -720) d += 1440;
  if (d > 720) d -= 1440;
  return d;
}

/** 把這一次的看板併進紀錄（回傳新的，不改傳進來的那份） */
export function recordBoard(prev: DelayStore | null, flights: Flight[], now: number): DelayStore {
  const store: DelayStore = prev?.days ? JSON.parse(JSON.stringify(prev)) : { since: twDate(now), days: {} };
  const date = twDate(now);
  const day = (store.days[date] ??= {});
  for (const f of flights) {
    day[`${f.code}|${f.dir}|${f.sched}`] = { code: f.code, dir: f.dir, place: f.place, sched: f.sched, changed: f.changed, kind: f.kind };
  }
  const cutoff = twDate(now - KEEP_DAYS * 86400_000);
  for (const d of Object.keys(store.days)) if (d < cutoff) delete store.days[d];
  return store;
}

export interface DelaySummary {
  days: number; // 有紀錄的天數（近 30 天內）
  flights: number;
  onTimePct: number | null; // 晚 15 分鐘以內算準時（國際慣例），取消不算準時
  cancelled: number;
  worst: { code: string; dir: Flight["dir"]; place: string; n: number; avgDelay: number; lateCount: number }[];
}

/** 近 30 天：整體準點率＋平均延誤最多的航班（至少飛過 5 次才排） */
export function summarizeDelays(store: DelayStore | null, now: number, top = 8): DelaySummary {
  const since = twDate(now - 30 * 86400_000);
  const days = Object.entries(store?.days ?? {}).filter(([d]) => d > since);
  let flights = 0;
  let onTime = 0;
  let cancelled = 0;
  const per = new Map<string, { code: string; dir: Flight["dir"]; place: string; n: number; sum: number; late: number }>();
  for (const [, entries] of days) {
    for (const e of Object.values(entries)) {
      if (e.kind === "scheduled" || e.kind === "active") continue; // 還沒飛走，不知道最後晚多少
      flights++;
      if (e.kind === "cancelled") {
        cancelled++;
        continue;
      }
      const d = delayMinutes(e.sched, e.changed);
      if (d === null) continue;
      if (d <= 15) onTime++;
      const key = `${e.code}|${e.dir}`;
      const p = per.get(key) ?? { code: e.code, dir: e.dir, place: e.place, n: 0, sum: 0, late: 0 };
      p.n++;
      p.sum += Math.max(0, d);
      if (d > 15) p.late++;
      per.set(key, p);
    }
  }
  const worst = [...per.values()]
    .filter((p) => p.n >= 5)
    .map((p) => ({ code: p.code, dir: p.dir, place: p.place, n: p.n, avgDelay: Math.round(p.sum / p.n), lateCount: p.late }))
    .filter((p) => p.avgDelay > 0)
    .sort((a, b) => b.avgDelay - a.avgDelay || a.code.localeCompare(b.code))
    .slice(0, top);
  return { days: days.length, flights, onTimePct: flights ? Math.round((onTime / flights) * 1000) / 10 : null, cancelled, worst };
}
