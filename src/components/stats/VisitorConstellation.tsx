import { SKY_H, SKY_W, buildConstellation } from "@/lib/stats/constellation";
import { nf, regionName } from "@/lib/format";

// 訪客星座（lib/stats/constellation.ts）：Server Component、純 SVG。滑鼠移到星星上看國家跟次數（<title>）。
// 最多人的前 5 國標名字。星星用強調色；深色主題底色本來就暗，像夜空
// 背景的小星星（固定位置，只是氣氛）
const DUST = Array.from({ length: 48 }, (_, i) => ({ x: (i * 137.5) % SKY_W, y: (i * 89.3 + (i % 7) * 31) % SKY_H, r: i % 5 === 0 ? 0.9 : 0.5 }));

export default function VisitorConstellation({ countries }: { countries: [string, number][] }) {
  const { stars, lines } = buildConstellation(countries);
  const top = new Set(countries.slice(0, 5).map(([c]) => c));
  return (
    <figure className="mb-6">
      <svg
        viewBox={`0 0 ${SKY_W} ${SKY_H}`}
        role="img"
        aria-label={`訪客星座：${stars.length} 個國家連成的星座`}
        className="w-full h-auto rounded-sm bg-(--surface) border border-(--border)"
      >
        {DUST.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={d.r} className="fill-(--muted)" opacity="0.25" />
        ))}
        {lines.map(([a, b], i) => (
          <line key={i} x1={stars[a].x} y1={stars[a].y} x2={stars[b].x} y2={stars[b].y} className="stroke-(--accent)" strokeWidth="0.6" opacity="0.35" />
        ))}
        {stars.map((s) => (
          <g key={s.code}>
            <title>{`${regionName(s.code)}：${nf.format(s.count)} 次`}</title>
            <circle cx={s.x} cy={s.y} r={s.r * 2.6} className="fill-(--accent)" opacity={s.glow * 0.12} />
            <circle cx={s.x} cy={s.y} r={s.r} className="fill-(--accent)" opacity={s.glow} />
            {top.has(s.code) && (
              <text x={s.x} y={s.y - s.r - 6} textAnchor="middle" className="fill-(--muted)" fontSize="10">
                {regionName(s.code)}
              </text>
            )}
          </g>
        ))}
      </svg>
      <figcaption className="mt-2 text-xs text-(--muted) font-light">
        訪客星座：一個國家一顆星，越多人來越大越亮，用最短的線連成一個星座。國家的位置是固定的，新的國家加入時星座會長大。
      </figcaption>
    </figure>
  );
}
