import coast from "./radar-coast.json";
import counties from "./radar-counties.json";
import aviation from "./radar-aviation.json";

// 直播／社群用的圖卡（2026-11-29，使用者：「多做一些圖卡，並下載起來」「這是網站一部份應該寫在網站內」）。
// 純 SVG（Server Component 就能畫），/radar/cards 頁每張旁邊有「下載 PNG」（CardDownload 把 SVG 畫成 PNG）。
// 統計數字用 /radar 頁已經公開的那批（今天、一天的節奏、常見機型、累計）；圖上的飛機位置是**示意**，不是真實航班。
// 配色跟直播畫面（RadarLiveScreen）一致；不標接收器、不畫距離圈。

export type CardStats = {
  today: { unique: number; peak: number; airlines: { name: string; n: number }[] };
  hours: (number | null)[];
  types: { name: string; n: number }[];
  total: { unique: number; peak: number; days: number };
};

const C = { bg: "#0b1620", land: "#122334", line: "#2d5a8e", text: "#e8f0f8", muted: "#8aa0b5", acc: "#6fa0d8" };
const SERIF = "'Noto Serif JP','Noto Serif TC','Yu Mincho','PMingLiU',serif";
const SANS = "'Noto Sans TC','Microsoft JhengHei',sans-serif";
const MONO = "'Geist Mono','Consolas','Courier New',monospace";
const PLANE = "M0,-1 L0.14,-0.35 L1,0.15 L1,0.38 L0.14,0.12 L0.1,0.72 L0.38,0.92 L0.38,1 L0,0.9 L-0.38,1 L-0.38,0.92 L-0.1,0.72 L-0.14,0.12 L-1,0.38 L-1,0.15 L-0.14,-0.35 Z";
const nf = (n: number) => n.toLocaleString("en-US");

type Proj = (lat: number, lon: number) => [number, number];
const mkProj = (o: { lat0: number; lon0: number; ppd: number; cx: number; cy: number }): Proj => (lat, lon) => [
  o.cx + (lon - o.lon0) * o.ppd * Math.cos((o.lat0 * Math.PI) / 180),
  o.cy - (lat - o.lat0) * o.ppd,
];
const pts = (P: Proj, ring: number[][]) => ring.map(([lo, la]) => P(la, lo).map((v) => v.toFixed(1)).join(",")).join("L");

// 示意用的飛機（不是真實航班）：[緯度, 經度, 航向, 尾跡長度]
const DECOR: [number, number, number, number][] = [
  [22.2, 119.9, 40, 90], [23.35, 119.7, 150, 110], [23.0, 121.7, 250, 100], [22.0, 121.3, 330, 80], [23.5, 121.0, 200, 90], [22.55, 119.4, 75, 70], [22.9, 120.1, 20, 60],
];

function MapLayer({ P, scale = 1, sweep = true }: { P: Proj; scale?: number; sweep?: boolean }) {
  const land = (coast as number[][][]).map((r) => "M" + pts(P, r) + "Z").join("");
  const cty = (counties.lines as number[][][]).map((l) => "M" + pts(P, l)).join("");
  const [sx, sy] = P(22.627, 120.301); // 掃描線圓心＝高雄市區
  const khh = aviation.airports.find((a) => a.id === "RCKH");
  let rw: [number, number, number, number] | null = null;
  if (khh) {
    const [la1, lo1, la2, lo2] = khh.rwy[0] as number[];
    const [x1, y1] = P(la1, lo1);
    const [x2, y2] = P(la2, lo2);
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    rw = [mx + (x1 - mx) * 2.6, my + (y1 - my) * 2.6, mx + (x2 - mx) * 2.6, my + (y2 - my) * 2.6];
  }
  return (
    <>
      <path d={land} fill={C.land} stroke={C.line} strokeWidth={2.5 * scale} strokeLinejoin="round" />
      <path d={cty} fill="none" stroke="rgba(138,160,181,.35)" strokeWidth={1.6 * scale} strokeDasharray={`${8 * scale} ${6 * scale}`} />
      {rw && <line x1={rw[0]} y1={rw[1]} x2={rw[2]} y2={rw[3]} stroke={C.text} strokeWidth={6 * scale} />}
      {sweep && (
        <>
          <defs>
            <linearGradient id="sweepGrad" gradientUnits="userSpaceOnUse" x1={sx} y1={sy} x2={sx + 900 * scale} y2={sy - 380 * scale}>
              <stop offset="0" stopColor={C.acc} stopOpacity=".3" />
              <stop offset="1" stopColor={C.acc} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`M${sx},${sy} L${sx + 1400 * scale},${sy - 380 * scale} L${sx + 1400 * scale},${sy - 760 * scale} Z`} fill="url(#sweepGrad)" />
        </>
      )}
    </>
  );
}

function Plane({ P, d, k = 1 }: { P: Proj; d: [number, number, number, number]; k?: number }) {
  const [x, y] = P(d[0], d[1]);
  const a = (d[2] * Math.PI) / 180;
  return (
    <>
      <line x1={x - Math.sin(a) * d[3] * k} y1={y + Math.cos(a) * d[3] * k} x2={x} y2={y} stroke="rgba(111,160,216,.6)" strokeWidth={3 * k} strokeLinecap="round" />
      <g transform={`translate(${x},${y}) rotate(${d[2]}) scale(${22 * k})`}>
        <path d={PLANE} fill={C.text} />
      </g>
    </>
  );
}

function Grid({ w, h, step }: { w: number; h: number; step: number }) {
  let d = "";
  for (let x = 0; x <= w; x += step) d += `M${x},0V${h}`;
  for (let y = 0; y <= h; y += step) d += `M0,${y}H${w}`;
  return <path d={d} stroke="rgba(138,160,181,.07)" strokeWidth={2} fill="none" />;
}

type T = { x: number; y: number; size: number; fill?: string; family?: string; weight?: number | string; anchor?: "start" | "middle" | "end"; spacing?: number; children: React.ReactNode };
function Txt({ x, y, size, fill = C.text, family = SANS, weight = 300, anchor = "start", spacing = 0, children }: T) {
  return (
    <text x={x} y={y} fontSize={size} fill={fill} fontFamily={family} fontWeight={weight} textAnchor={anchor} letterSpacing={spacing}>
      {children}
    </text>
  );
}

function Frame({ id, w, h, children }: { id: string; w: number; h: number; children: React.ReactNode }) {
  return (
    <svg id={id} xmlns="http://www.w3.org/2000/svg" width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <rect width={w} height={h} fill={C.bg} />
      {children}
    </svg>
  );
}

const Badge = ({ x, y, size }: { x: number; y: number; size: number }) => (
  <>
    <rect x={x} y={y} width={size * 9.6} height={size * 1.9} rx={4} fill={C.line} />
    <Txt x={x + size * 4.8} y={y + size * 1.35} size={size} fill="#fff" family={MONO} weight={500} anchor="middle" spacing={size * 0.2}>
      ● LIVE 24H
    </Txt>
  </>
);

function Head({ zh, en }: { zh: string; en: string }) {
  return (
    <>
      <Txt x={90} y={150} size={64} family={SERIF} spacing={4}>{zh}</Txt>
      <Txt x={90} y={196} size={24} fill={C.muted} family={MONO} spacing={7}>{en}</Txt>
    </>
  );
}
function Foot({ w, h }: { w: number; h: number }) {
  return (
    <>
      <Txt x={90} y={h - 78} size={26} fill={C.muted}>自己架的 ADS-B 接收器 · 高雄</Txt>
      <Txt x={90} y={h - 44} size={26} fill={C.muted}>統計來自 kbs0830.com</Txt>
      <Txt x={w - 90} y={h - 44} size={40} family={SERIF} anchor="end" spacing={2}>kbs0830.com/radar</Txt>
    </>
  );
}
function Bars({ rows, y0, rowH, maxW }: { rows: { name: string; n: number }[]; y0: number; rowH: number; maxW: number }) {
  const top = Math.max(1, rows[0]?.n ?? 1);
  return (
    <>
      {rows.map((r, i) => (
        <g key={r.name}>
          <Txt x={90} y={y0 + i * rowH} size={34} weight={400}>{r.name}</Txt>
          <Txt x={990} y={y0 + i * rowH} size={34} fill={C.muted} family={MONO} anchor="end">{nf(r.n)}</Txt>
          <rect x={90} y={y0 + i * rowH + 14} width={Math.max(8, (r.n / top) * maxW)} height={16} rx={2} fill={C.acc} opacity={1 - i * 0.15} />
        </g>
      ))}
    </>
  );
}

/** 卡片清單：id、檔名、尺寸、畫法 */
export const CARDS: { id: string; file: string; title: string; w: number; h: number; draw: (s: CardStats) => React.ReactNode }[] = [
  {
    id: "thumb", file: "01-直播縮圖-1280x720", title: "直播縮圖 1280×720", w: 1280, h: 720,
    draw: () => {
      const P = mkProj({ lat0: 22.75, lon0: 120.55, ppd: 720 / 1.5, cx: 1280 * 0.66, cy: 360 });
      return (
        <>
          <Grid w={1280} h={720} step={80} />
          <MapLayer P={P} scale={0.7} />
          {DECOR.map((d, i) => <Plane key={i} P={P} d={d} k={0.8} />)}
          <defs>
            <linearGradient id="thumbFade" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor={C.bg} stopOpacity=".95" />
              <stop offset=".55" stopColor={C.bg} stopOpacity=".6" />
              <stop offset="1" stopColor={C.bg} stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect width={1280} height={720} fill="url(#thumbFade)" />
          <Badge x={70} y={90} size={30} />
          <Txt x={70} y={345} size={150} family={SERIF} weight={600}>高雄上空</Txt>
          <Txt x={70} y={510} size={150} family={SERIF} weight={600} fill={C.acc}>現在幾架？</Txt>
          <Txt x={74} y={620} size={30} fill={C.muted} family={MONO} spacing={8}>KAOHSIUNG LIVE FLIGHT RADAR</Txt>
          <Txt x={74} y={668} size={28} fill={C.muted}>自己架的接收器 · 即時飛機雷達</Txt>
        </>
      );
    },
  },
  {
    id: "square", file: "02-方形貼文-1080x1080", title: "方形貼文 1080×1080", w: 1080, h: 1080,
    draw: () => {
      const P = mkProj({ lat0: 22.75, lon0: 120.65, ppd: 1080 / 1.9, cx: 540, cy: 570 });
      return (
        <>
          <Grid w={1080} h={1080} step={90} />
          <MapLayer P={P} scale={0.8} />
          {DECOR.map((d, i) => <Plane key={i} P={P} d={d} k={0.9} />)}
          <Txt x={540} y={150} size={80} family={SERIF} anchor="middle" spacing={5}>高雄上空 · 即時飛機雷達</Txt>
          <Txt x={540} y={205} size={26} fill={C.muted} family={MONO} anchor="middle" spacing={8}>KAOHSIUNG ADS-B LIVE RADAR</Txt>
          <Txt x={540} y={960} size={34} fill={C.muted} anchor="middle">自己架的接收器　·　24 小時直播</Txt>
          <Txt x={540} y={1025} size={46} family={SERIF} anchor="middle" spacing={3}>kbs0830.com/radar</Txt>
        </>
      );
    },
  },
  {
    id: "story", file: "03-直式限動-1080x1920", title: "直式限動 1080×1920", w: 1080, h: 1920,
    draw: () => {
      const P = mkProj({ lat0: 22.75, lon0: 120.7, ppd: 1920 / 3.0, cx: 540, cy: 960 });
      return (
        <>
          <Grid w={1080} h={1920} step={90} />
          <MapLayer P={P} scale={1.1} />
          {DECOR.map((d, i) => <Plane key={i} P={P} d={d} k={1.3} />)}
          <defs>
            <linearGradient id="stTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.bg} /><stop offset="1" stopColor={C.bg} stopOpacity="0" /></linearGradient>
            <linearGradient id="stBot" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor={C.bg} /><stop offset="1" stopColor={C.bg} stopOpacity="0" /></linearGradient>
          </defs>
          <rect width={1080} height={560} fill="url(#stTop)" />
          <rect y={1360} width={1080} height={560} fill="url(#stBot)" />
          <Badge x={70} y={150} size={34} />
          <Txt x={70} y={400} size={120} family={SERIF} weight={600}>高雄上空</Txt>
          <Txt x={70} y={540} size={120} family={SERIF} weight={600} fill={C.acc}>現在幾架？</Txt>
          <Txt x={70} y={1690} size={30} fill={C.muted} family={MONO} spacing={7}>KAOHSIUNG LIVE FLIGHT RADAR</Txt>
          <Txt x={70} y={1750} size={38} fill={C.muted}>自己架的接收器 · 24 小時即時直播</Txt>
          <Txt x={70} y={1835} size={54} family={SERIF} spacing={3}>kbs0830.com/radar</Txt>
        </>
      );
    },
  },
  {
    id: "today", file: "04-今天與累計-1080x1080", title: "今天與累計 1080×1080", w: 1080, h: 1080,
    draw: (s) => (
      <>
        <Grid w={1080} h={1080} step={90} />
        <Head zh="頭上飛過的飛機" en="TODAY & SINCE START" />
        <Txt x={90} y={410} size={190} family={SERIF}>{nf(s.today.unique)}</Txt>
        <Txt x={90} y={475} size={38} fill={C.muted}>{`架次　·　今天　·　同時最多 ${s.today.peak} 架`}</Txt>
        <Txt x={90} y={565} size={24} fill={C.muted} family={MONO} spacing={5}>AIRLINES TODAY · 今天的航空公司</Txt>
        <Bars rows={s.today.airlines.slice(0, 3)} y0={625} rowH={108} maxW={780} />
        <Txt x={90} y={920} size={30} fill={C.muted}>{`累計記錄 ${s.total.days} 天、${nf(s.total.unique)} 架次，同時最多 ${s.total.peak} 架`}</Txt>
        <Foot w={1080} h={1080} />
      </>
    ),
  },
  {
    id: "rhythm", file: "05-一天的節奏-1080x1080", title: "一天的節奏 1080×1080", w: 1080, h: 1080,
    draw: (s) => {
      const vals = s.hours.map((v) => v ?? 0);
      const max = Math.max(...vals, 1);
      const top = vals.indexOf(Math.max(...vals));
      const bw = (1080 - 180) / 24;
      return (
        <>
          <Grid w={1080} h={1080} step={90} />
          <Head zh="一天的節奏" en="DAILY RHYTHM · 每小時平均" />
          {vals.map((v, i) => {
            const bh = (v / max) * 430;
            return <rect key={i} x={90 + i * bw + 3} y={640 - bh} width={bw - 6} height={bh} rx={2} fill={i === top ? C.text : C.acc} opacity={i === top ? 1 : 0.8} />;
          })}
          <line x1={90} x2={990} y1={640} y2={640} stroke="rgba(138,160,181,.4)" />
          {[0, 6, 12, 18, 23].map((i) => (
            <Txt key={i} x={90 + i * bw + bw / 2} y={684} size={24} fill={C.muted} family={MONO} anchor="middle">{i}</Txt>
          ))}
          <Txt x={90} y={790} size={44}>{`${top} 點最忙，平均最多同時 ${max} 架`}</Txt>
          <Txt x={90} y={845} size={28} fill={C.muted}>夜間機場有宵禁，凌晨的飛機本來就少</Txt>
          <Foot w={1080} h={1080} />
        </>
      );
    },
  },
  {
    id: "types", file: "06-常見機型-1080x1080", title: "常見機型 1080×1080", w: 1080, h: 1080,
    draw: (s) => (
      <>
        <Grid w={1080} h={1080} step={90} />
        <Head zh="頭上常見的機型" en="COMMON AIRCRAFT TYPES" />
        <Bars rows={s.types.slice(0, 4)} y0={300} rowH={130} maxW={780} />
        <Txt x={90} y={880} size={30} fill={C.muted}>{`累計記錄 ${s.total.days} 天、${nf(s.total.unique)} 架次，同時最多 ${s.total.peak} 架`}</Txt>
        <Foot w={1080} h={1080} />
      </>
    ),
  },
  {
    id: "avatar", file: "07-頻道頭像-800x800", title: "頻道頭像 800×800", w: 800, h: 800,
    draw: () => (
      <>
        {[90, 170, 250, 330].map((r) => <circle key={r} cx={400} cy={400} r={r} fill="none" stroke="rgba(138,160,181,.25)" strokeWidth={3} />)}
        <defs>
          <linearGradient id="avSweep" gradientUnits="userSpaceOnUse" x1={400} y1={400} x2={760} y2={250}>
            <stop offset="0" stopColor={C.acc} stopOpacity=".5" />
            <stop offset="1" stopColor={C.acc} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M400,400 L780,360 A380,380 0 0 0 700,165 Z" fill="url(#avSweep)" />
        <line x1={60} x2={740} y1={400} y2={400} stroke="rgba(138,160,181,.2)" strokeWidth={2} />
        <line x1={400} x2={400} y1={60} y2={740} stroke="rgba(138,160,181,.2)" strokeWidth={2} />
        <g transform="translate(400,400) rotate(35) scale(95)"><path d={PLANE} fill={C.text} /></g>
      </>
    ),
  },
  {
    id: "waiting", file: "08-直播準備中-1920x1080", title: "直播準備中 1920×1080（OBS 等待畫面）", w: 1920, h: 1080,
    draw: () => {
      const P = mkProj({ lat0: 22.75, lon0: 120.55, ppd: 1080 / 1.6, cx: 960, cy: 540 });
      return (
        <>
          <Grid w={1920} h={1080} step={120} />
          <MapLayer P={P} sweep={false} />
          <rect width={1920} height={1080} fill={C.bg} opacity={0.72} />
          <Txt x={960} y={480} size={104} family={SERIF} anchor="middle" spacing={6}>直播準備中 · Starting soon</Txt>
          <Txt x={960} y={575} size={42} fill={C.muted} anchor="middle">高雄上空即時飛機雷達　·　稍後回來 · Back shortly</Txt>
          <Txt x={960} y={680} size={52} family={SERIF} anchor="middle" spacing={3}>kbs0830.com/radar</Txt>
        </>
      );
    },
  },
];

export function CardSvg({ card, stats }: { card: (typeof CARDS)[number]; stats: CardStats }) {
  return (
    <Frame id={`card-${card.id}`} w={card.w} h={card.h}>
      {card.draw(stats)}
    </Frame>
  );
}
