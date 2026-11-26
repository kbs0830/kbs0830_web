// 404／維修頁的背景：幾條很細的波浪線慢慢飄過（TODO L4，2026-11-26）。
// 不是真的 shader：純 SVG＋CSS transform（只動合成層、60fps、零 JS），風格跟首頁「稀疏細線」一致。
// 每條線是兩個週期的正弦波，整條往左移半個寬度（＝一個週期）就跟起點一模一樣，所以可以無縫一直循環；各條速度、振幅、位置不同。
// 中間用 mask 淡掉，不蓋到文字；reduced-motion 時停住；顏色只用強調色、很淡。

const W = 2000; // 兩個週期，每個週期 1000
const LINES = [
  { y: 22, amp: 5, phase: 0.0, seconds: 90, opacity: 0.22 },
  { y: 38, amp: 8, phase: 0.8, seconds: 70, opacity: 0.16 },
  { y: 54, amp: 6, phase: 1.9, seconds: 110, opacity: 0.2 },
  { y: 70, amp: 9, phase: 2.7, seconds: 80, opacity: 0.14 },
  { y: 86, amp: 5, phase: 4.1, seconds: 100, opacity: 0.18 },
];

/** 兩個完整週期的正弦路徑：x 0～2000，起點跟 x=1000 的高度相同 */
export function wavePath(y: number, amp: number, phase: number): string {
  const pts: string[] = [];
  for (let x = 0; x <= W; x += 25) {
    const dy = amp * Math.sin((x / 1000) * 2 * Math.PI + phase);
    pts.push(`${x === 0 ? "M" : "L"}${x},${(y + dy).toFixed(2)}`);
  }
  return pts.join(" ");
}

export default function FlowLines() {
  return (
    <div
      aria-hidden
      className="flow-lines fixed inset-0 pointer-events-none overflow-hidden print:hidden"
      style={{ maskImage: "radial-gradient(ellipse 60% 55% at 50% 50%, transparent 30%, #000 100%)" }}
    >
      {LINES.map((l, i) => (
        <svg
          key={i}
          className="flow-line absolute left-0 top-0 h-full"
          style={{ width: "200%", animationDuration: `${l.seconds}s` }}
          viewBox={`0 0 ${W} 100`}
          preserveAspectRatio="none"
        >
          <path d={wavePath(l.y, l.amp, l.phase)} fill="none" style={{ stroke: "var(--accent)" }} strokeWidth={1} vectorEffect="non-scaling-stroke" opacity={l.opacity} />
        </svg>
      ))}
    </div>
  );
}
