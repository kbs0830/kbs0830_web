import type { ContribDay } from "@/lib/live/github-contrib";

// 自己畫的 GitHub 貢獻熱力圖（TODO D1，2026-11-28）：SVG，顏色用全站的 --accent 混 --border（深淺色自動跟著走）、沒有白底卡。
// 桌機畫一整年，手機畫最近 20 週（兩張 SVG 用 CSS 切換，都是 server 端產生，沒有 JS）。每格 <title> 是游標移上去的「N 次貢獻」。
// 資料由呼叫端取（lib/live/github-contrib.ts）；抓不到時呼叫端放備案圖。

const CELL = 10;
const GAP = 3;
const LEVEL_MIX = [0, 28, 52, 76, 100]; // 等級 0 用 --border 的灰，1～4 是 --accent 逐漸變濃

function weeksOf(days: ContribDay[]) {
  // 第一格補到星期日開頭（GitHub 的欄是日～六）
  const first = new Date(days[0].date + "T00:00:00Z").getUTCDay();
  const cells: (ContribDay | null)[] = [...Array(first).fill(null), ...days];
  const weeks: (ContribDay | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

function Chart({ weeks, label, className }: { weeks: (ContribDay | null)[][]; label: string; className: string }) {
  const top = 14; // 上面放月份
  const w = weeks.length * (CELL + GAP) - GAP;
  const h = top + 7 * (CELL + GAP) - GAP;
  // 每欄第一天的月份跟上一欄不同才標月份（頭尾太擠的不標）。先算好再畫，render 裡不改變數
  const months = weeks.map((wk) => wk.find(Boolean)?.date.slice(5, 7));
  const labelAt = months.map((m, x) => !!m && x > 0 && x < weeks.length - 2 && m !== months[x - 1]);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label} className={`${className} h-auto w-full`} style={{ maxWidth: w * 1.3 }}>
      {weeks.map((wk, x) => {
        const month = months[x];
        const showMonth = labelAt[x];
        return (
          <g key={x} transform={`translate(${x * (CELL + GAP)} 0)`}>
            {showMonth && (
              <text y={9} fontSize={9} className="fill-(--muted) font-mono">
                {Number(month)}月
              </text>
            )}
            {wk.map((d, y) =>
              d ? (
                <rect key={y} y={top + y * (CELL + GAP)} width={CELL} height={CELL} rx={2} fill={`color-mix(in srgb, var(--accent) ${LEVEL_MIX[d.level]}%, var(--border))`}>
                  <title>{d.count > 0 ? `${d.date}：${d.count} 次貢獻` : `${d.date}：沒有貢獻`}</title>
                </rect>
              ) : null,
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default function ContribHeatmap({ user, days }: { user: string; days: ContribDay[] }) {
  const weeks = weeksOf(days);
  const total = days.reduce((n, d) => n + d.count, 0);
  const label = `${user} 在 GitHub 過去一年的貢獻熱力圖，共 ${total} 次`;
  return (
    <div>
      <Chart weeks={weeks} label={label} className="hidden sm:block" />
      <Chart weeks={weeks.slice(-20)} label={`${user} 最近 20 週的 GitHub 貢獻熱力圖`} className="sm:hidden" />
      <p className="text-[11px] text-(--muted) font-light mt-3 font-mono">
        過去一年 {total} 次貢獻<span className="sm:hidden"> · 手機顯示最近 20 週</span>
      </p>
    </div>
  );
}
