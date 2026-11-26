// 後台的 24 小時折線（樹莓派分頁，2026-11-26）：Server Component、純 SVG，不用圖表函式庫。
// points：[epoch ms, 數值或 null]，null 的地方斷開。warn：畫一條虛線門檻（例：溫度 75°C）。
export type SeriesPoint = [number, number | null];

const W = 600;
const H = 120;

export default function SeriesChart({ points, unit, warn, min = 0, max, label }: { points: SeriesPoint[]; unit: string; warn?: number; min?: number; max?: number; label: string }) {
  const vals = points.map((p) => p[1]).filter((v): v is number => v !== null);
  if (vals.length < 2) return <p className="py-6 text-center text-sm font-light text-(--muted)">資料還不夠，每 5 分鐘記一筆。</p>;
  const t0 = points[0][0];
  const t1 = points.at(-1)![0];
  const top = max ?? Math.max(...vals, warn ?? -Infinity) * 1.05;
  const x = (t: number) => (t1 === t0 ? 0 : ((t - t0) / (t1 - t0)) * W);
  const y = (v: number) => H - ((v - min) / (top - min || 1)) * H;
  // null 斷開成好幾段
  const segs: string[] = [];
  let cur: string[] = [];
  for (const [t, v] of points) {
    if (v === null) {
      if (cur.length) segs.push(cur.join(" "));
      cur = [];
    } else cur.push(`${x(t).toFixed(1)},${y(v).toFixed(1)}`);
  }
  if (cur.length) segs.push(cur.join(" "));
  const last = vals.at(-1)!;
  const hi = Math.max(...vals);
  const lo = Math.min(...vals);
  const fmt = (v: number) => `${Number.isInteger(v) ? v : v.toFixed(1)}${unit}`;
  const hours = Math.round((t1 - t0) / 3600_000);
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-28 overflow-visible" role="img" aria-label={`${label}：現在 ${fmt(last)}，最高 ${fmt(hi)}，最低 ${fmt(lo)}`}>
        {warn !== undefined && warn <= top && (
          <line x1={0} x2={W} y1={y(warn)} y2={y(warn)} stroke="var(--warn)" strokeWidth={1} strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
        )}
        {segs.map((s, i) => (
          <polyline key={i} points={s} fill="none" stroke={warn !== undefined && last >= warn ? "var(--warn)" : "var(--accent)"} strokeWidth={1.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        ))}
      </svg>
      <figcaption className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-(--muted)">
        <span>
          現在 <span className="text-(--text)">{fmt(last)}</span>
        </span>
        <span>最高 {fmt(hi)}</span>
        <span>最低 {fmt(lo)}</span>
        {warn !== undefined && <span className="text-(--warn)">--- 告警 {fmt(warn)}</span>}
        <span className="ml-auto">近 {hours || "<1"} 小時</span>
      </figcaption>
    </figure>
  );
}
