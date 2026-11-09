import { CITIES, hotelCountByCity } from "@/lib/hotels";

// /hotels 的城市地圖：跟 /flights 的 RouteMap 同一個語言（Server Component、靜態 SVG、沒有底圖、零 JS）。
// 只標城市、不標飯店實際位置（使用者選的）。點的面積跟住過的間數成正比。
// 兩張圖：東亞全圖（台灣併成一個點，不然全擠在一起）＋台灣放大圖。美國那間太遠不畫，頁面上用文字註明。
// 靠得太近的城市（東京／橫濱／成田、大阪／京都、台北／新北）併成一個點，避免重疊。

type Area = { label: string; cities: string[]; dx: number; dy: number; anchor?: "start" | "end" | "middle" };

const ASIA: Area[] = [
  { label: "台灣", cities: Object.keys(CITIES).filter((k) => CITIES[k].country === "台灣"), dx: 12, dy: 4 },
  { label: "東京", cities: ["tokyo", "yokohama", "narita"], dx: 10, dy: 4 },
  { label: "關西", cities: ["osaka", "kyoto"], dx: 0, dy: 18, anchor: "middle" },
  { label: "名古屋", cities: ["nagoya"], dx: 0, dy: -9, anchor: "middle" },
  { label: "福岡", cities: ["fukuoka"], dx: -8, dy: 10, anchor: "end" },
  { label: "札幌", cities: ["sapporo"], dx: -8, dy: 4, anchor: "end" },
  { label: "秋田", cities: ["akita"], dx: -8, dy: 4, anchor: "end" },
  { label: "那霸", cities: ["naha"], dx: 8, dy: 4 },
  { label: "首爾", cities: ["seoul"], dx: -9, dy: 0, anchor: "end" },
  { label: "香港", cities: ["hongkong"], dx: 0, dy: 16, anchor: "middle" },
  { label: "河內", cities: ["hanoi"], dx: 0, dy: 16, anchor: "middle" },
  { label: "曼谷", cities: ["bangkok"], dx: 10, dy: 4 },
];

const TAIWAN: Area[] = [
  { label: "台北・新北", cities: ["taipei", "newtaipei"], dx: 0, dy: -11, anchor: "middle" },
  { label: "桃園", cities: ["taoyuan"], dx: -10, dy: -4, anchor: "end" },
  { label: "台中", cities: ["taichung"], dx: -10, dy: 4, anchor: "end" },
  { label: "南投", cities: ["nantou"], dx: 8, dy: 4 },
  { label: "嘉義", cities: ["chiayi"], dx: 0, dy: 13, anchor: "middle" },
  { label: "阿里山", cities: ["alishan"], dx: 8, dy: 4 },
  { label: "台南", cities: ["tainan"], dx: -10, dy: 4, anchor: "end" },
  { label: "高雄", cities: ["kaohsiung"], dx: -11, dy: 6, anchor: "end" },
  { label: "墾丁", cities: ["kenting"], dx: 9, dy: 6 },
  { label: "台東", cities: ["taitung"], dx: 9, dy: 4 },
  { label: "花蓮", cities: ["hualien"], dx: 9, dy: 4 },
  { label: "澎湖", cities: ["penghu"], dx: -8, dy: 3, anchor: "end" },
  { label: "金門", cities: ["kinmen"], dx: 0, dy: 15, anchor: "middle" },
];

export const MAP_AREAS = { ASIA, TAIWAN }; // hotels.test.ts 用來確認每個城市都畫得到

// fontSize／rMax 依兩張圖實際顯示的大小調過：台灣圖的 viewBox 比較小、放大比較多，字要小一點兩張看起來才一樣大
type Bounds = { west: number; east: number; north: number; south: number; scale: number; fontSize: number; rMax: number };
const ASIA_BOUNDS: Bounds = { west: 98, east: 146, north: 46, south: 11, scale: 12, fontSize: 10, rMax: 9 };
const TW_BOUNDS: Bounds = { west: 117.9, east: 122.3, north: 25.6, south: 21.6, scale: 70, fontSize: 7, rMax: 6.5 };

function Panel({ areas, bounds, label }: { areas: Area[]; bounds: Bounds; label: string }) {
  const counts = hotelCountByCity();
  const cos = Math.cos((((bounds.north + bounds.south) / 2) * Math.PI) / 180);
  const w = Math.round((bounds.east - bounds.west) * bounds.scale * cos);
  const h = Math.round((bounds.north - bounds.south) * bounds.scale);
  const dots = areas
    .map((a) => {
      const n = a.cities.reduce((s, c) => s + (counts[c] ?? 0), 0);
      // 點的位置：該區各城市依間數加權的中心
      const lat = a.cities.reduce((s, c) => s + CITIES[c].lat * (counts[c] ?? 0), 0) / n;
      const lon = a.cities.reduce((s, c) => s + CITIES[c].lon * (counts[c] ?? 0), 0) / n;
      return { ...a, n, x: (lon - bounds.west) * bounds.scale * cos, y: (bounds.north - lat) * bounds.scale };
    })
    .filter((d) => d.n > 0);
  const max = Math.max(...dots.map((d) => d.n));

  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label} className="w-full h-auto">
      {dots.map((d) => {
        const r = 2.5 + Math.sqrt(d.n / max) * bounds.rMax;
        return (
          <g key={d.label}>
            <circle cx={d.x} cy={d.y} r={r} className="fill-(--accent)" fillOpacity={0.18} />
            <circle cx={d.x} cy={d.y} r={bounds.fontSize / 5} className="fill-(--accent)" />
            <text
              x={d.x + d.dx + Math.sign(d.dx) * (r - 2.5)}
              y={d.y + d.dy + (d.dx === 0 ? Math.sign(d.dy) * (r - 2.5) : 0)}
              textAnchor={d.anchor ?? "start"}
              className="fill-(--muted) font-mono"
              fontSize={bounds.fontSize}
            >
              {d.label} {d.n}
            </text>
            <title>{`${d.label}：${d.n} 間`}</title>
          </g>
        );
      })}
    </svg>
  );
}

export default function HotelMap() {
  return (
    <div className="grid md:grid-cols-[3fr_2fr] gap-4 items-center">
      <Panel areas={ASIA} bounds={ASIA_BOUNDS} label="東亞住宿城市圖：台灣、日本、韓國、香港、越南、泰國住過的城市，點越大住過越多間" />
      <Panel areas={TAIWAN} bounds={TW_BOUNDS} label="台灣住宿城市圖：台灣各縣市住過的飯店間數" />
    </div>
  );
}
