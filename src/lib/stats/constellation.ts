// 訪客星座（2026-11-25，使用者：「更有創意一點」）：每個來過的國家是一顆星，越多人來越大越亮，
// 星星之間用「最小生成樹」連起來（最短的線把全部連成一個星座），國家越多星座越大。
// 位置用國碼雜湊決定：同一個國家永遠在同一個位置，新國家加入時舊的星星不會動。只用國碼＋次數（/stats 本來就公開的資料）。

export interface Star {
  code: string;
  count: number;
  x: number;
  y: number;
  r: number;
  glow: number; // 0～1
}

export const SKY_W = 600;
export const SKY_H = 300;

function hash(s: string, salt: number): number {
  let h = 2166136261 ^ salt;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return ((h >>> 0) % 10000) / 10000;
}

export function buildConstellation(countries: [string, number][]): { stars: Star[]; lines: [number, number][] } {
  const max = Math.max(1, ...countries.map(([, n]) => n));
  const stars: Star[] = countries.map(([code, count]) => {
    const k = Math.log(count + 1) / Math.log(max + 1); // 對數：台灣一枝獨秀也不會把別人壓成看不見
    return {
      code,
      count,
      x: Math.round(30 + hash(code, 1) * (SKY_W - 60)),
      y: Math.round(24 + hash(code, 2) * (SKY_H - 48)),
      r: Math.round((1.4 + k * 3.6) * 10) / 10,
      glow: Math.round((0.35 + k * 0.65) * 100) / 100,
    };
  });
  // Prim 最小生成樹
  const lines: [number, number][] = [];
  if (stars.length > 1) {
    const inTree = new Set([0]);
    while (inTree.size < stars.length) {
      let best: [number, number] | null = null, bestD = Infinity;
      for (const i of inTree)
        for (let j = 0; j < stars.length; j++) {
          if (inTree.has(j)) continue;
          const d = (stars[i].x - stars[j].x) ** 2 + (stars[i].y - stars[j].y) ** 2;
          if (d < bestD) { bestD = d; best = [i, j]; }
        }
      lines.push(best!);
      inTree.add(best![1]);
    }
  }
  return { stars, lines };
}
