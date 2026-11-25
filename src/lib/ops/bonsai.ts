// 盆栽 · 網站是一棵會長的樹（2026-11-25，使用者：「更有創意一點」「有感一點的改動」）。
// 用網站真實的維運資料長出一棵盆栽（純 SVG、伺服器產生、零 JS）：
//   枝＝部署次數、葉的茂密＝文章數、幹的粗細與高度＝運作天數、地上落葉＝近 90 天有中斷的日子、幹上的疤＝事故報告、葉色＝真實季節
// 同樣的資料一定長出同一棵樹（亂數用資料當種子），每多一次部署就多一根枝。

export interface BonsaiInput {
  deploys: number;
  posts: number;
  ageDays: number;
  fallen: number;
  scars: number;
  month: number; // 1～12（台灣）
}

export type Season = "spring" | "summer" | "autumn" | "winter";
export const seasonOf = (month: number): Season =>
  month >= 3 && month <= 5 ? "spring" : month >= 6 && month <= 9 ? "summer" : month >= 10 && month <= 11 ? "autumn" : "winter";

export const SEASON_COLORS: Record<Season, { leaf: string[]; name: string }> = {
  spring: { leaf: ["#8db878", "#a6c98c", "#e6a9bd"], name: "春" },
  summer: { leaf: ["#4f7f4a", "#5f9157", "#3f6e3d"], name: "夏" },
  autumn: { leaf: ["#c4623a", "#d98a45", "#b14b33"], name: "秋" },
  winter: { leaf: ["#8b9a84", "#9eab96", "#7d8a78"], name: "冬" },
};

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type P = [number, number];
const bez = (p0: P, p1: P, p2: P, p3: P, t: number): P => {
  const u = 1 - t;
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ];
};
const r1 = (n: number) => Math.round(n * 10) / 10;

export interface Bonsai {
  season: Season;
  trunk: string; // 填色的多邊形 path
  branches: { d: string; w: number }[];
  pads: { cx: number; cy: number; r: number; fill: string; o: number }[];
  fallen: { x: number; y: number; rot: number; fill: string }[];
  scars: { x1: number; y1: number; x2: number; y2: number }[];
}

export const BONSAI_W = 400;
export const BONSAI_H = 320;
const GROUND = 250; // 盆子上緣

export function growBonsai(input: BonsaiInput): Bonsai {
  const season = seasonOf(input.month);
  const colors = SEASON_COLORS[season].leaf;
  // 種子只看「長出來的東西」，同一天重新整理不會變
  const rand = mulberry32(input.deploys * 7919 + input.posts * 104729 + Math.floor(input.ageDays / 30));

  // 幹：運作越久越高越粗（一年長滿）
  const grow = Math.min(1, input.ageDays / 365);
  const height = 125 + grow * 55;
  const baseW = 15 + grow * 13;
  const lean = (rand() - 0.5) * 60;
  const p0: P = [200, GROUND];
  const p1: P = [200 - lean * 0.9, GROUND - height * 0.35];
  const p2: P = [200 + lean * 1.2, GROUND - height * 0.7];
  const p3: P = [200 + lean * 0.3, GROUND - height];
  const width = (t: number) => baseW * (1 - t) ** 0.8 + 3 * t;
  const left: P[] = [], right: P[] = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const [x, y] = bez(p0, p1, p2, p3, t);
    const [nx, ny] = bez(p0, p1, p2, p3, Math.min(1, t + 0.01));
    const dx = nx - x, dy = ny - y, len = Math.hypot(dx, dy) || 1;
    const w = width(t) / 2;
    left.push([x - (dy / len) * w, y + (dx / len) * w]);
    right.push([x + (dy / len) * w, y - (dx / len) * w]);
  }
  // 根張り：幹的底部往兩邊攤開
  const trunk =
    `M${r1(200 - baseW * 1.4)} ${GROUND} ` +
    left.map(([x, y]) => `L${r1(x)} ${r1(y)}`).join(" ") +
    " " +
    right.toReversed().map(([x, y]) => `L${r1(x)} ${r1(y)}`).join(" ") +
    ` L${r1(200 + baseW * 1.4)} ${GROUND} Z`;

  // 主枝：部署越多主枝越多（3～9 根，對數成長），左右交替往外水平伸出，末端微微上揚——盆栽的樣子
  const deploys = Math.max(0, input.deploys);
  const nMain = Math.max(3, Math.min(9, 3 + Math.floor(Math.log2(deploys + 1))));
  const branches: Bonsai["branches"] = [];
  const ends: { p: P; twigs: number; spread: number }[] = [];
  for (let i = 0; i < nMain; i++) {
    const t = 0.38 + 0.52 * (i / Math.max(1, nMain - 1)) + (rand() - 0.5) * 0.04;
    const [x, y] = bez(p0, p1, p2, p3, t);
    const side = i % 2 === 0 ? -1 : 1;
    const len = (115 - t * 70) * (0.8 + rand() * 0.35);
    const ex = x + side * len;
    const ey = y - 8 - rand() * 16;
    const cx = x + side * len * 0.45, cy = y + 10 + rand() * 8; // 先往下垂再上揚
    branches.push({ d: `M${r1(x)} ${r1(y)} Q${r1(cx)} ${r1(cy)} ${r1(ex)} ${r1(ey)}`, w: r1(Math.max(1.6, width(t) * 0.45)) });
    ends.push({ p: [ex, ey], twigs: 0, spread: len * 0.45 });
  }
  ends.push({ p: p3, twigs: 0, spread: 34 }); // 樹頂
  // 每次部署是一根小枝，平均分到各個葉團
  for (let i = 0; i < Math.min(deploys, 240); i++) ends[i % ends.length].twigs++;

  // 葉團：扁平的雲狀（橫向攤開），小枝越多越大團、文章越多越茂密；冬天稀疏
  const lush = Math.min(1, 0.35 + input.posts / 25) * (input.month === 12 || input.month <= 2 ? 0.6 : 1);
  const pads: Bonsai["pads"] = [];
  for (const e of ends) {
    const blobs = 4 + Math.min(14, Math.round(e.twigs * 0.6 * lush));
    const w = e.spread * (0.7 + Math.min(1, e.twigs / 20) * 0.5);
    for (let k = 0; k < blobs; k++) {
      pads.push({
        cx: r1(e.p[0] + (rand() - 0.5) * w * 1.6),
        cy: r1(e.p[1] - 6 + (rand() - 0.5) * 16),
        r: r1(7 + rand() * 7 + lush * 4),
        fill: colors[Math.floor(rand() * colors.length)],
        o: r1(0.6 + rand() * 0.35),
      });
    }
  }

  // 落葉：有中斷的日子，一天一片，散在盆子旁邊的地上
  const fallen: Bonsai["fallen"] = Array.from({ length: Math.min(24, input.fallen) }, () => {
    const side = rand() < 0.5 ? -1 : 1;
    return { x: r1(200 + side * (75 + rand() * 90)), y: r1(GROUND + 38 + rand() * 10), rot: Math.round(rand() * 180), fill: colors[Math.floor(rand() * colors.length)] };
  });

  // 疤：事故報告一篇一道，刻在幹上
  const scars: Bonsai["scars"] = Array.from({ length: Math.min(10, input.scars) }, (_, i) => {
    const t = 0.12 + (i / Math.max(1, input.scars)) * 0.5;
    const [x, y] = bez(p0, p1, p2, p3, t);
    const w = width(t) * 0.3;
    return { x1: r1(x - w), y1: r1(y - 2), x2: r1(x + w), y2: r1(y + 2) };
  });

  return { season, trunk, branches, pads, fallen, scars };
}
