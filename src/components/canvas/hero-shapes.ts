// HeroSceneGPU 的「形狀」：每顆粒子的家（Float32Array，每 3 個數字一顆）。雙擊時把家換成下一個形狀，GPU 那邊的彈簧會把粒子拉過去。
// 每顆粒子在每個形狀上的位置是隨機抽的：數量依效能只用前面 N 顆時，形狀還是完整的（只是比較稀）。
import { AIRPORTS, routes } from "@/lib/flights";

export type ShapeName = "stars" | "name" | "routes" | "icon" | "cities";

const jitter = (s: number) => (Math.random() - 0.5) * s;

/** 一段文字畫在 canvas 上，取有顏色的像素當點 */
function textPoints(text: string, font: string): [number, number][] {
  const W = 1200;
  const H = 260;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `300 190px ${font}`;
  ctx.fillText(text, W / 2, H / 2);
  const data = ctx.getImageData(0, 0, W, H).data;
  const pts: [number, number][] = [];
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) if (data[(y * W + x) * 4 + 3] > 128) pts.push([x / W - 0.5, 0.5 - y / H]);
  return pts;
}

export function heroShapes(n: number, serifFont: string): Record<ShapeName, Float32Array> {
  const make = (fn: (i: number) => [number, number, number]) => {
    const a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) a.set(fn(i), i * 3);
    return a;
  };

  // 星空：跟 WebGL 版一樣的範圍（寬一點，邊緣也有）
  const stars = make(() => [jitter(15), jitter(10), jitter(6) - 2]);

  // 名字：放在後面（z=-3）、放大，像背景的浮水印，不跟 Hero 的標題疊在同一層
  const glyphs = textPoints("PINGWEI LI", serifFont);
  const name = make(() => {
    const [x, y] = glyphs.length ? glyphs[Math.floor(Math.random() * glyphs.length)] : [jitter(1), jitter(0.2)];
    return [x * 15, y * 3.3 + 0.2, -3 + jitter(0.25)];
  });

  // 航線圖：飛過的航線（經緯度直接當平面座標），機場附近多放一點
  const lonToX = (lon: number) => ((lon - 122) / 24) * 6;
  const latToY = (lat: number) => ((lat - 28) / 16) * 3.4;
  const segs = routes()
    .filter((r) => AIRPORTS[r.a].lon > 95 && AIRPORTS[r.b].lon > 95 && AIRPORTS[r.a].lon < 150 && AIRPORTS[r.b].lon < 150) // 美國那條畫不下
    .map((r) => [AIRPORTS[r.a], AIRPORTS[r.b], r.count] as const);
  const total = segs.reduce((s, [a, b, c]) => s + Math.hypot(a.lon - b.lon, a.lat - b.lat) * Math.sqrt(c), 0);
  const routesShape = make(() => {
    if (Math.random() < 0.22) {
      // 機場：一小團
      const [a] = segs[Math.floor(Math.random() * segs.length)];
      return [lonToX(a.lon) + jitter(0.12), latToY(a.lat) + jitter(0.12), -1 + jitter(0.1)];
    }
    let pick = Math.random() * total;
    for (const [a, b, c] of segs) {
      pick -= Math.hypot(a.lon - b.lon, a.lat - b.lat) * Math.sqrt(c);
      if (pick <= 0) {
        const t = Math.random();
        const lift = Math.sin(Math.PI * t) * 0.25; // 微微拱起來
        return [lonToX(a.lon + (b.lon - a.lon) * t) + jitter(0.03), latToY(a.lat + (b.lat - a.lat) * t) + lift + jitter(0.03), -1 + jitter(0.1)];
      }
    }
    return [0, 0, -1];
  });

  // 網站圖示：終端機視窗（圓角框＋標題列＋右上角的點），跟分頁圖示同一個形狀
  const icon = make(() => {
    const w = 4.2;
    const h = 3;
    const k = Math.random();
    if (k < 0.12) {
      // 右上角的指示燈
      const a = Math.random() * Math.PI * 2;
      const rr = Math.sqrt(Math.random()) * 0.28;
      return [w / 2 - 0.55 + Math.cos(a) * rr, h / 2 - 0.42 + Math.sin(a) * rr, -1];
    }
    if (k < 0.24) return [jitter(w), h / 2 - 0.85 + jitter(0.02), -1]; // 標題列的線
    if (k < 0.34) {
      // 提示字元 >_：三段直線
      const seg = (x1: number, y1: number, x2: number, y2: number): [number, number, number] => {
        const t = Math.random();
        return [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, -1];
      };
      const which = Math.random();
      if (which < 0.33) return seg(-1.5, 0.15, -1.15, -0.1);
      if (which < 0.66) return seg(-1.15, -0.1, -1.5, -0.35);
      return seg(-0.95, -0.42, -0.35, -0.42);
    }
    // 外框
    const per = 2 * (w + h);
    let d = Math.random() * per;
    if (d < w) return [-w / 2 + d, h / 2, -1];
    d -= w;
    if (d < h) return [w / 2, h / 2 - d, -1];
    d -= h;
    if (d < w) return [w / 2 - d, -h / 2, -1];
    d -= w;
    return [-w / 2, -h / 2 + d, -1];
  });

  // 高雄 ⇄ 福岡（決策表 B14，2026-11-25）：兩個城市的光點＋中間一條拱起來的航線＋城市名，呼應首頁的兩地時鐘
  const KHH: [number, number] = [-2.7, -0.75];
  const FUK: [number, number] = [2.7, 0.75];
  const khhLabel = textPoints("高雄", serifFont);
  const fukLabel = textPoints("福岡", serifFont);
  const label = (pts: [number, number][], [cx, cy]: [number, number], dy: number): [number, number, number] => {
    const [x, y] = pts.length ? pts[Math.floor(Math.random() * pts.length)] : [jitter(0.3), jitter(0.1)];
    return [cx + x * 5.2, cy + dy + y * 1.15, -1 + jitter(0.08)];
  };
  const cities = make(() => {
    const k = Math.random();
    if (k < 0.4) {
      // 航線：拱起來的弧，中間最高
      const t = Math.random();
      const lift = Math.sin(Math.PI * t) * 1.1;
      return [KHH[0] + (FUK[0] - KHH[0]) * t + jitter(0.03), KHH[1] + (FUK[1] - KHH[1]) * t + lift + jitter(0.03), -1 + jitter(0.06)];
    }
    if (k < 0.62) {
      // 兩個城市：中心一團＋外面一圈細環
      const [cx, cy] = Math.random() < 0.5 ? KHH : FUK;
      const a = Math.random() * Math.PI * 2;
      const rr = Math.random() < 0.55 ? Math.sqrt(Math.random()) * 0.12 : 0.32 + jitter(0.03);
      return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, -1 + jitter(0.06)];
    }
    // 城市名：高雄在點的下面、福岡在點的上面（不壓到弧線）
    return Math.random() < 0.5 ? label(khhLabel, KHH, -0.75) : label(fukLabel, FUK, 0.75);
  });

  return { stars, name, routes: routesShape, icon, cities };
}
