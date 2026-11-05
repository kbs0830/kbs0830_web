import { AIRPORTS, routes } from "@/lib/flights";

// /flights 的航線圖：Server Component、build 時算好的靜態 SVG，零 JS。
// 跟 Hero 同一個語言——沒有底圖，只有機場的點跟航線的細弧線。範圍是東亞～東南亞（等距圓柱投影）；
// 美國那幾班太遠，畫進來整張圖會縮成一團，所以不畫，在下方文字註明。
// 弧線第一次出現時用 CSS 畫出來（globals.css 的 .route-draw，reduced-motion 直接顯示）。

const BOUNDS = { west: 98, east: 146, north: 46, south: 11 };
const SCALE = 12; // px／緯度
const COS = Math.cos((28 * Math.PI) / 180); // 中間緯度的經度縮放，地圖才不會左右被拉寬
const W = Math.round((BOUNDS.east - BOUNDS.west) * SCALE * COS);
const H = (BOUNDS.north - BOUNDS.south) * SCALE;

const project = (code: string) => {
  const a = AIRPORTS[code];
  return { x: (a.lon - BOUNDS.west) * SCALE * COS, y: (BOUNDS.north - a.lat) * SCALE };
};
const inMap = (code: string) => {
  const a = AIRPORTS[code];
  return a.lon >= BOUNDS.west && a.lon <= BOUNDS.east && a.lat >= BOUNDS.south && a.lat <= BOUNDS.north;
};

// 機場擠在一起的地方（台灣、東京、大阪）只標一個城市名，其餘只畫點；位置手動微調避免重疊
const LABELS: Record<string, { text: string; dx: number; dy: number; anchor?: "start" | "end" | "middle" }> = {
  KHH: { text: "高雄", dx: 7, dy: 10 },
  TPE: { text: "台北", dx: 8, dy: -3 },
  MZG: { text: "澎湖", dx: -7, dy: 4, anchor: "end" },
  KNH: { text: "金門", dx: -7, dy: -2, anchor: "end" },
  FUK: { text: "福岡", dx: -7, dy: 10, anchor: "end" },
  ICN: { text: "首爾", dx: -7, dy: 0, anchor: "end" },
  NRT: { text: "東京", dx: 8, dy: 4 },
  KIX: { text: "大阪", dx: -2, dy: 15, anchor: "middle" },
  NGO: { text: "名古屋", dx: 0, dy: -9, anchor: "middle" },
  OKA: { text: "沖繩", dx: 8, dy: 4 },
  ISG: { text: "石垣", dx: 0, dy: 15, anchor: "middle" },
  CTS: { text: "札幌", dx: -7, dy: 6, anchor: "end" },
  AKJ: { text: "旭川", dx: 8, dy: 0 },
  AXT: { text: "秋田", dx: -7, dy: 4, anchor: "end" },
  HKG: { text: "香港", dx: 0, dy: 15, anchor: "middle" },
  HAN: { text: "河內", dx: 0, dy: 15, anchor: "middle" },
  BKK: { text: "曼谷", dx: 8, dy: 4 },
};

export default function RouteMap() {
  const shown = routes().filter((r) => inMap(r.a) && inMap(r.b));
  const airports = [...new Set(shown.flatMap((r) => [r.a, r.b]))];
  const maxCount = Math.max(...shown.map((r) => r.count));

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="東亞航線圖：從高雄、台北出發，飛往日本、韓國、香港、越南、泰國各機場的航線"
      className="w-full h-auto"
    >
      {shown.map((r, i) => {
        const p = project(r.a), q = project(r.b);
        // 弧線：控制點往兩點連線的垂直方向推出去，距離越長弧度越大
        const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
        const dx = q.x - p.x, dy = q.y - p.y;
        const len = Math.hypot(dx, dy);
        const bend = Math.min(0.18 * len, 40);
        const cx = mx - (dy / len) * bend, cy = my + (dx / len) * bend;
        return (
          <path
            key={`${r.a}-${r.b}`}
            d={`M${p.x.toFixed(1)},${p.y.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${q.x.toFixed(1)},${q.y.toFixed(1)}`}
            pathLength={1}
            className="route-draw fill-none stroke-(--accent)"
            strokeWidth={0.6 + (r.count / maxCount) * 1.2}
            strokeOpacity={0.25 + (r.count / maxCount) * 0.5}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <title>{`${AIRPORTS[r.a].name} ↔ ${AIRPORTS[r.b].name}：${r.count} 次`}</title>
          </path>
        );
      })}
      {airports.map((code) => {
        const { x, y } = project(code);
        const label = LABELS[code];
        return (
          <g key={code}>
            {code === "KHH" && <circle cx={x} cy={y} r={5.5} className="fill-none stroke-(--accent)" strokeOpacity={0.5} />}
            <circle cx={x} cy={y} r={code === "KHH" ? 2.6 : 2} className="fill-(--accent)" />
            {label && (
              <text
                x={x + label.dx}
                y={y + label.dy}
                textAnchor={label.anchor ?? "start"}
                className="fill-(--muted) font-mono"
                fontSize={10}
              >
                {label.text}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
