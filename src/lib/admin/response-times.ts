import "server-only";
import { dataFile, readJsonFile } from "@/lib/data-file";
import { mergeCells, percentile } from "../../../scripts/lib/response-times.js";
import type { Deploy } from "@/lib/ops/status";

// 後台維運頁的「是不是越來越慢」兩張趨勢圖的資料（TODO W4，2026-11-29）。
// 回應時間：scripts/lib/response-times.js 記的每小時直方圖（data/response-times.json），這裡併成每天一點。
// 部署時間：deploy.log 解析出來的成功部署，每天取中位數。

type Cell = { n: number; sum: number; max: number; h: number[] };
type Hours = Record<string, { page: Cell; api: Cell }>;
const DAY = 86400_000;

/** 台灣日期（YYYY-MM-DD）→ 當天中午（UTC ms），給圖的 X 軸 */
const dayMs = (d: string) => Date.parse(`${d}T12:00:00+08:00`);

/** 每天一點：頁面請求的 p50／p95（毫秒）。不到 20 筆的日子不畫（樣本太少會亂跳）。最近 days 天 */
export function responseSeries(days = 30): { p50: [number, number | null][]; p95: [number, number | null][]; samples: number } {
  const file = readJsonFile<{ hours?: Hours }>(dataFile("RESPONSE_TIMES_FILE", "response-times.json"));
  const byDay = new Map<string, Cell[]>();
  for (const [key, v] of Object.entries(file?.hours ?? {})) {
    const d = key.slice(0, 10);
    byDay.set(d, [...(byDay.get(d) ?? []), v.page]);
  }
  const since = Date.now() - days * DAY;
  const p50: [number, number | null][] = [];
  const p95: [number, number | null][] = [];
  let samples = 0;
  for (const d of [...byDay.keys()].sort()) {
    if (dayMs(d) < since) continue;
    const cell = mergeCells(byDay.get(d)!);
    samples += cell.n;
    if (cell.n < 20) continue;
    p50.push([dayMs(d), percentile(cell, 0.5)]);
    p95.push([dayMs(d), percentile(cell, 0.95)]);
  }
  return { p50, p95, samples };
}

/** 每天一點：成功部署花的秒數中位數。最近 days 天 */
export function deploySeries(deploys: Deploy[], days = 30): [number, number | null][] {
  const byDay = new Map<string, number[]>();
  for (const d of deploys) {
    if (d.result !== "ok" || d.seconds === undefined) continue;
    const day = new Date(Date.parse(d.start) + 8 * 3600_000).toISOString().slice(0, 10);
    byDay.set(day, [...(byDay.get(day) ?? []), d.seconds]);
  }
  const since = Date.now() - days * DAY;
  return [...byDay.keys()]
    .sort()
    .filter((d) => dayMs(d) >= since)
    .map((d) => {
      const s = byDay.get(d)!.toSorted((a, b) => a - b);
      return [dayMs(d), s[Math.floor(s.length / 2)]] as [number, number | null];
    });
}
