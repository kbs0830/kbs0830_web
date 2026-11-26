import "server-only";
import { dataFile, readJsonFile, writeJsonFile } from "@/lib/data-file";
import { twDate } from "../../../scripts/lib/tw-time.js";

// /go/<代號> 的點擊次數（TODO E10，2026-11-26）：每天每個代號一個數字，不存 IP、UA、來源頁、cookie。
// data/go-clicks.json：{ days: { "2026-11-26": { github: 3 } } }，只留近 120 天。同步「讀→改→寫」（見 lib/data-file.ts）。

type Store = { days: Record<string, Record<string, number>> };
const file = () => dataFile("GO_CLICKS_FILE", "go-clicks.json");

export function recordGoClick(code: string, now = Date.now()) {
  const store = readJsonFile<Store>(file()) ?? { days: {} };
  const day = twDate(now);
  store.days[day] = { ...store.days[day], [code]: (store.days[day]?.[code] ?? 0) + 1 };
  const keep = Object.keys(store.days).sort().slice(-120);
  store.days = Object.fromEntries(keep.map((d) => [d, store.days[d]]));
  writeJsonFile(file(), store, { atomic: true });
}

/** from～to（含，台灣日期 YYYY-MM-DD）各代號的總點擊數，由多到少；一次都沒有回 null */
export function readGoClicks(from: string, to: string): [string, number][] | null {
  const days = readJsonFile<Store>(file())?.days ?? {};
  const sum: Record<string, number> = {};
  for (const [d, codes] of Object.entries(days)) {
    if (d < from || d > to) continue;
    for (const [c, n] of Object.entries(codes)) sum[c] = (sum[c] ?? 0) + n;
  }
  const rows = Object.entries(sum).sort((a, b) => b[1] - a[1]);
  return rows.length ? rows : null;
}
