// 統計頁共用的小圖表（Server Component、純 SVG／CSS、零 JS）：/stats 訪客分析、/radar 自家雷達
// 2026-11-21 從 stats/page.tsx 抽出來（/radar 要用同一套樣式）

import type { ReactNode } from "react";
import { nf } from "@/lib/format";
import Hint from "@/components/ui/Hint";


/** height：給定高度（例 "h-40"）時圖表不再跟著寬度等比放大，寬版面裡才不會變成一大片（雷達站作品頁的小圖，TODO M14） */
export function BarChart({ bars, caption, label, height }: { bars: { key: string; value: number; title: string }[]; caption: ReactNode; label: string; height?: string }) {
  const max = Math.max(1, ...bars.map((b) => b.value));
  const W = 600;
  const H = 140;
  const gap = bars.length > 24 ? 4 : 6;
  const bw = (W - gap * (bars.length - 1)) / bars.length;
  return (
    <figure>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className={`w-full ${height ?? "h-auto"}`}
        preserveAspectRatio={height ? "none" : undefined}
        role="img"
        aria-label={label}
      >
        {bars.map((b, i) => {
          const h = Math.max(b.value > 0 ? 2 : 0, (b.value / max) * (H - 4));
          return (
            <rect key={b.key} x={i * (bw + gap)} y={H - h} width={bw} height={h} rx={1} style={{ fill: "var(--accent)" }} opacity={0.85}>
              <title>{b.title}</title>
            </rect>
          );
        })}
        <line x1={0} x2={W} y1={H - 0.5} y2={H - 0.5} style={{ stroke: "var(--border)" }} vectorEffect="non-scaling-stroke" />
      </svg>
      <figcaption className="flex justify-between text-[11px] text-(--muted) font-mono mt-2">{caption}</figcaption>
    </figure>
  );
}

export function Share({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <li className="grid grid-cols-[minmax(0,7rem)_1fr_4.5rem] items-center gap-3 py-2">
      <span className="text-[15px] sm:text-sm font-light text-(--text) truncate">{label}</span>
      <span className="h-1.5 bg-(--surface) rounded-full overflow-hidden">
        <span className="block h-full bg-(--accent) rounded-full" style={{ width: `${pct}%` }} />
      </span>
      <span className="text-xs text-(--muted) font-mono text-right">
        {nf.format(value)} <span>{pct.toFixed(0)}%</span>
      </span>
    </li>
  );
}

export function ShareList({ entries, total }: { entries: [string, number][]; total: number }) {
  return (
    <ul className="border-y border-(--border) divide-y divide-(--border)">
      {entries.map(([k, v]) => (
        <Share key={k} label={k} value={v} total={total} />
      ))}
    </ul>
  );
}

/** items：[數字, 標籤, 說明?]——有說明的話標籤旁邊多一個「?」（Hint，TODO O2）；idPrefix 讓同一頁兩組 Tiles 的泡泡 id 不撞 */
export function Tiles({ items, idPrefix = "tile" }: { items: [string, string, ReactNode?][]; idPrefix?: string }) {
  return (
    <dl className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-(--border) border border-(--border) rounded-sm overflow-hidden mb-12">
      {items.map(([value, label, hint], i) => (
        <div key={label} className="bg-(--bg) px-4 py-4 flex flex-col-reverse">
          <dt className="text-[11px] text-(--muted) font-mono tracking-wide">
            {label}
            {hint ? (
              <Hint id={`${idPrefix}-${i}`} label={label}>
                {hint}
              </Hint>
            ) : null}
          </dt>
          <dd className="text-xl font-light text-(--text) font-mono mb-1">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
