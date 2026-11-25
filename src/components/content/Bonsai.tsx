import { BONSAI_H, BONSAI_W, SEASON_COLORS, growBonsai, type BonsaiInput } from "@/lib/ops/bonsai";
import { nf } from "@/lib/format";

// 盆栽（lib/ops/bonsai.ts）：Server Component、純 SVG。盆子用網站的強調色，幹是樹皮色，葉色跟季節
export default function Bonsai({ input }: { input: BonsaiInput }) {
  const b = growBonsai(input);
  const legend: [string, string][] = [
    ["枝", `部署 ${nf.format(input.deploys)} 次（一次一根小枝）`],
    ["葉", `文章 ${input.posts} 篇`],
    ["幹", `運作 ${nf.format(input.ageDays)} 天`],
    ["落葉", `有中斷的日子 ${input.fallen} 天（近 90 天）`],
    ["疤", `事故報告 ${input.scars} 篇`],
  ];
  return (
    <figure className="mb-12">
      <svg viewBox={`0 30 ${BONSAI_W} ${BONSAI_H - 20}`} role="img" aria-label={`這個網站的盆栽：${legend.map(([k, v]) => `${k}＝${v}`).join("、")}`} className="w-full h-auto max-w-md mx-auto block">
        {/* 地面 */}
        <line x1="40" y1="290" x2="360" y2="290" className="stroke-(--border)" strokeWidth="1" />
        {/* 落葉 */}
        {b.fallen.map((l, i) => (
          <ellipse key={i} cx={l.x} cy={l.y} rx="4" ry="2" fill={l.fill} opacity="0.8" transform={`rotate(${l.rot} ${l.x} ${l.y})`} />
        ))}
        {/* 盆 */}
        <path d="M128 250 H272 L262 286 H138 Z" className="fill-(--accent)" opacity="0.9" />
        <rect x="122" y="246" width="156" height="7" rx="2" className="fill-(--accent)" />
        <rect x="146" y="286" width="12" height="4" className="fill-(--accent)" />
        <rect x="242" y="286" width="12" height="4" className="fill-(--accent)" />
        {/* 苔 */}
        <ellipse cx="200" cy="247" rx="66" ry="4" fill="#7d9a6a" opacity="0.7" />
        {/* 枝（在葉子下面） */}
        {b.branches.map((br, i) => (
          <path key={i} d={br.d} fill="none" stroke="#6e5240" strokeWidth={br.w} strokeLinecap="round" />
        ))}
        {/* 幹 */}
        <path d={b.trunk} fill="#6e5240" />
        {b.scars.map((s, i) => (
          <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="#3e2c22" strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
        ))}
        {/* 葉 */}
        {b.pads.map((p, i) => (
          <circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill={p.fill} opacity={p.o} />
        ))}
      </svg>
      <figcaption className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-1.5 text-[12px] font-light text-(--muted)">
        {legend.map(([k, v]) => (
          <span key={k}>
            <span className="font-serif text-(--text) mr-1.5">{k}</span>
            {v}
          </span>
        ))}
        <span>
          <span className="font-serif text-(--text) mr-1.5">葉色</span>
          {SEASON_COLORS[b.season].name}（跟著真實的季節）
        </span>
      </figcaption>
    </figure>
  );
}
