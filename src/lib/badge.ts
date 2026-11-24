// shields.io 風格的小徽章 SVG（TODO B15，2026-11-24）：/api/badge/uptime 給 GitHub README 放「uptime 99.8%」。
// 字寬用 Verdana 11px 的粗估（英數大約 6.5px），不用載字型；顏色照網站：正常用強調色，低於 99% 用 --warn。

const charWidth = (c: string) => (/[il.:|!' ]/.test(c) ? 3.5 : /[mwMW%]/.test(c) ? 9.5 : /[A-Z0-9]/.test(c) ? 7.5 : 6.5);
const textWidth = (s: string) => Math.ceil([...s].reduce((w, c) => w + charWidth(c), 0));
const esc = (s: string) => s.replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c]!);

export function badgeSvg(label: string, message: string, color: string): string {
  const lw = textWidth(label) + 12;
  const mw = textWidth(message) + 12;
  const w = lw + mw;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="20" role="img" aria-label="${esc(label)}: ${esc(message)}">
<title>${esc(label)}: ${esc(message)}</title>
<clipPath id="r"><rect width="${w}" height="20" rx="3"/></clipPath>
<g clip-path="url(#r)"><rect width="${lw}" height="20" fill="#555"/><rect x="${lw}" width="${mw}" height="20" fill="${color}"/></g>
<g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
<text x="${lw / 2}" y="14">${esc(label)}</text><text x="${lw + mw / 2}" y="14">${esc(message)}</text>
</g></svg>`;
}

/** 可用率 → 徽章文字跟顏色（null＝還沒有紀錄） */
export function uptimeBadge(ratio: number | null): { message: string; color: string } {
  if (ratio === null) return { message: "no data", color: "#6b6b6b" };
  const pct = ratio * 100;
  const message = `${pct >= 99.995 ? "100" : pct.toFixed(pct >= 99 ? 2 : 1)}%`;
  return { message, color: pct >= 99 ? "#2d5a8e" : "#b45309" };
}
