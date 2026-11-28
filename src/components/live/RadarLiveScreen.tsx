"use client";

import { useEffect, useRef, useState } from "react";
import coast from "./radar-coast.json";
import aviation from "./radar-aviation.json";
import counties from "./radar-counties.json";

// /radar/live：給 OBS「瀏覽器來源」直播用的全螢幕雷達動畫（2026-11-27，使用者要直播到 YouTube，說明欄導流到網站）。
// 資料：/api/radar/live 每 15 秒一次，只有「1 分鐘前」的位置取樣；這裡用取樣之間的內插＋速度／航向外推，
// 把 30 秒一筆的資料播成連續的動畫（播放時間＝現在 − 延遲 − 10 秒緩衝，後面沒有取樣的部分用速度外推）。
//
// ⚠️ 隱私（使用者 2026-11-27 同意「粗略位置公開」；2026-11-29 改成延遲 1 分鐘，並要求畫出機場與飛航設施、直播地點寫「高雄機場周圍」）：
//   - 地圖固定在高雄周邊，不以接收器為圓心；不畫距離圈、不標接收器、不寫涵蓋範圍
//   - 掃描線的圓心放在高雄市區（不是接收器）
//   - 機場、跑道、導航台是公開的航空資料（OurAirports，公有領域），畫出來；文字不寫行政區、不寫接收器離機場多近

type Row = [id: string, lat: number, lon: number, alt: number | null, speed: number | null, track: number | null];
type Info = { f: string; al: string | null; an: string | null; ty: string | null; tn: string | null };
type Frame = {
  now: number;
  delayMs: number;
  samples: { t: number; ok: boolean; p: Row[] }[];
  info: Record<string, Info>;
  online: boolean;
  today?: { unique: number; peak: number; airlines: { code: string; name: string; n: number }[] };
  week?: { unique: number; uptime: number | null };
  lastAircraftAt?: number | null;
};
type Shown = { id: string; alt: number | null; info: Info };

// 地圖範圍：高雄周邊（緯度跨約 1.6 度），中心點偏左，右邊留給資訊欄
const LAT0 = 22.75;
const LON0 = 120.55;
const LAT_SPAN = 1.6;
const CITY = { lat: 22.627, lon: 120.301 }; // 高雄市區（掃描線的圓心）
const CITIES: { n: string; lat: number; lon: number }[] = [{ n: "高雄 Kaohsiung", lat: 22.627, lon: 120.301 }]; // 其他城市旁邊已經有機場代碼，不重複標
const TRAIL_MS = 5 * 60_000;
const BUFFER_MS = 10_000; // 播放時間再往前一點；取樣最多比播放時間早 30 秒，這段用速度外推
const POLL_MS = 15_000;
const KT_TO_DEG = 1 / 3600 / 60; // 1 節 = 1 海里/小時；1 度緯度 = 60 海里 → 每秒幾度（緯度方向）

const C = {
  bg: "#0b1620",
  land: "#122334",
  line: "rgba(45,90,142,0.9)",
  grid: "rgba(138,160,181,0.07)",
  plane: "#e8f0f8",
  trail: "111,160,216",
  text: "#e8f0f8",
  muted: "#8aa0b5",
};

const twTime = new Intl.DateTimeFormat("zh-TW", { timeZone: "Asia/Taipei", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
const twHM = new Intl.DateTimeFormat("zh-TW", { timeZone: "Asia/Taipei", hour: "2-digit", minute: "2-digit", hour12: false });

/** 飛機剪影（朝上，單位約 ±1） */
const PLANE = "M0,-1 L0.14,-0.35 L1,0.15 L1,0.38 L0.14,0.12 L0.1,0.72 L0.38,0.92 L0.38,1 L0,0.9 L-0.38,1 L-0.38,0.92 L-0.1,0.72 L-0.14,0.12 L-1,0.38 L-1,0.15 L-0.14,-0.35 Z";

export default function RadarLiveScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<Frame | null>(null);
  const offsetRef = useRef(0); // 伺服器時間 − 這台時間
  const [frame, setFrame] = useState<Frame | null>(null);
  const [failed, setFailed] = useState(false);
  const [shown, setShown] = useState<Shown[]>([]);
  const [clock, setClock] = useState<string>("");

  // 抓資料
  useEffect(() => {
    let alive = true;
    let ctrl: AbortController | null = null;
    const load = async () => {
      if (document.hidden) return;
      ctrl?.abort();
      ctrl = new AbortController();
      try {
        const res = await fetch("/api/radar/live", { signal: ctrl.signal, cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const f: Frame = await res.json();
        if (!alive) return;
        offsetRef.current = f.now - Date.now();
        frameRef.current = f;
        setFrame(f);
        setFailed(false);
      } catch {
        if (alive && !ctrl?.signal.aborted) setFailed(true);
      }
    };
    load();
    const timer = setInterval(load, POLL_MS);
    return () => {
      alive = false;
      clearInterval(timer);
      ctrl?.abort();
    };
  }, []);

  // 畫面
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let land: Path2D | null = null;
    let lastPublish = 0;
    // canvas 的 font 不認 CSS 變數，要先讀出實際字型名稱
    const mono = getComputedStyle(canvas).getPropertyValue("--font-mono").trim() || "monospace";

    const proj = (lat: number, lon: number): [number, number] => {
      const ppd = h / LAT_SPAN;
      return [w * 0.4 + (lon - LON0) * ppd * Math.cos((LAT0 * Math.PI) / 180), h * 0.5 - (lat - LAT0) * ppd];
    };
    const buildLand = () => {
      const p = new Path2D();
      for (const ring of coast as number[][][]) {
        ring.forEach(([lon, lat], i) => {
          const [x, y] = proj(lat, lon);
          if (i === 0) p.moveTo(x, y);
          else p.lineTo(x, y);
        });
        p.closePath();
      }
      land = p;
    };
    const ro = new ResizeObserver(() => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width;
      h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      buildLand();
    });
    ro.observe(canvas);

    const draw = (tick: number) => {
      raf = requestAnimationFrame(draw);
      if (!w || !land) return;
      const k = h / 1080; // 文字、圖示大小跟著畫面高度
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // 經緯線（每 0.5 度，很淡）
      ctx.strokeStyle = C.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let lon = 118.5; lon <= 122.5; lon += 0.5) {
        const [x] = proj(LAT0, lon);
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      for (let lat = 21.5; lat <= 24; lat += 0.5) {
        const [, y] = proj(lat, LON0);
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();

      // 陸地
      ctx.fillStyle = C.land;
      ctx.fill(land);
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1.2 * k;
      ctx.lineJoin = "round";
      ctx.stroke(land);

      // 掃描線（圓心放高雄市區；很淡、12 秒一圈）
      const [sx, sy] = proj(CITY.lat, CITY.lon);
      if (typeof ctx.createConicGradient === "function") {
        const a = ((tick / 12000) % 1) * Math.PI * 2;
        const g = ctx.createConicGradient(a - Math.PI * 0.5, sx, sy);
        g.addColorStop(0, "rgba(45,90,142,0)");
        g.addColorStop(0.92, "rgba(45,90,142,0)");
        g.addColorStop(1, "rgba(111,160,216,0.16)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }

      // 縣市界線（只畫縣市之間的內部界線，海岸線已經有了；虛線、很淡）＋縣市名
      ctx.strokeStyle = "rgba(138,160,181,0.38)";
      ctx.lineWidth = 1.4 * k;
      ctx.setLineDash([7 * k, 5 * k]);
      ctx.beginPath();
      for (const line of counties.lines as number[][][]) {
        line.forEach(([lon, lat], i) => {
          const [x, y] = proj(lat, lon);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(138,160,181,0.5)";
      ctx.font = `${18 * k}px ${mono}`;
      for (const c of counties.labels) {
        const [x, y] = proj(c.la, c.lo);
        ctx.fillText(c.n, x - 27 * k, y);
      }

      // 飛航設施：機場跑道、導航台（VOR／TACAN 六角形，NDB 空心圓）。公開的航空資料，離線底圖
      ctx.lineCap = "round";
      for (const ap of aviation.airports) {
        const khh = ap.id === "RCKH";
        ctx.strokeStyle = khh ? "rgba(232,240,248,0.95)" : "rgba(138,160,181,0.8)";
        ctx.lineWidth = (khh ? 4 : 2.5) * k;
        for (const [la1, lo1, la2, lo2] of ap.rwy) {
          const [x1, y1] = proj(la1, lo1);
          const [x2, y2] = proj(la2, lo2);
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
        const [ax, ay] = proj(ap.la, ap.lo);
        ctx.fillStyle = khh ? C.text : "rgba(138,160,181,0.85)";
        ctx.font = `${khh ? "600 " : ""}${(khh ? 17 : 14) * k}px ${mono}`;
        ctx.fillText(khh ? "高雄機場 RCKH" : ap.id, ax + 12 * k, ay + (khh ? 22 : 16) * k);
      }
      ctx.lineWidth = 1.6 * k;
      ctx.strokeStyle = "rgba(111,160,216,0.75)";
      ctx.fillStyle = "rgba(111,160,216,0.7)";
      ctx.font = `${12 * k}px ${mono}`;
      for (const n of aviation.navaids) {
        const [nx, ny] = proj(n.la, n.lo);
        const r = 5.5 * k;
        ctx.beginPath();
        if (n.t === "N") {
          ctx.setLineDash([2 * k, 2 * k]);
          ctx.arc(nx, ny, r, 0, Math.PI * 2);
        } else {
          ctx.setLineDash([]);
          for (let i = 0; i < 6; i++) ctx.lineTo(nx + r * Math.cos((i * Math.PI) / 3), ny + r * Math.sin((i * Math.PI) / 3));
          ctx.closePath();
        }
        ctx.stroke();
        ctx.setLineDash([]);
        if (n.t === "V") ctx.fillText(n.id, nx + 9 * k, ny - 7 * k); // NDB 太密，只畫圖示
      }

      // 城市名
      ctx.font = `${17 * k}px ${mono}`;
      ctx.textBaseline = "middle";
      for (const c of CITIES) {
        const [x, y] = proj(c.lat, c.lon);
        ctx.fillStyle = "rgba(138,160,181,0.55)";
        ctx.beginPath();
        ctx.arc(x, y, 2.2 * k, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText(c.n, x + 10 * k, y);
      }

      // 飛機
      const f = frameRef.current;
      const now = Date.now() + offsetRef.current;
      const P = now - (f?.delayMs ?? 60_000) - BUFFER_MS;
      const list: Shown[] = [];
      if (f && f.samples.length) {
        const ids = new Set<string>();
        for (const s of f.samples) for (const r of s.p) ids.add(r[0]);
        for (const id of ids) {
          // 這架在每個取樣的位置（沒有就跳過那一筆）
          const pts: { t: number; lat: number; lon: number; row: Row }[] = [];
          for (const s of f.samples) {
            const r = s.p.find((x) => x[0] === id);
            if (r) pts.push({ t: s.t, lat: r[1], lon: r[2], row: r });
          }
          let i = -1;
          for (let j = 0; j < pts.length; j++) if (pts[j].t <= P) i = j;
          if (i < 0) continue; // 播放時間還沒輪到它
          const a = pts[i];
          const b = pts[i + 1];
          let lat: number;
          let lon: number;
          if (b && b.t - a.t < 90_000) {
            const u = Math.min(1, Math.max(0, (P - a.t) / (b.t - a.t)));
            lat = a.lat + (b.lat - a.lat) * u;
            lon = a.lon + (b.lon - a.lon) * u;
          } else {
            // 後面沒有取樣：用速度＋航向外推，最多 75 秒（之後當作飛走了）
            const dt = (P - a.t) / 1000;
            if (dt > 75) continue;
            const [, , , , sp, tr] = a.row;
            const kt = sp ?? 0;
            const rad = (((tr ?? 0) * Math.PI) / 180);
            lat = a.lat + Math.cos(rad) * kt * KT_TO_DEG * dt;
            lon = a.lon + (Math.sin(rad) * kt * KT_TO_DEG * dt) / Math.cos((a.lat * Math.PI) / 180);
          }
          const track = a.row[5] ?? (b ? (Math.atan2((b.lon - a.lon) * Math.cos((a.lat * Math.PI) / 180), b.lat - a.lat) * 180) / Math.PI : 0);
          const info = f.info[id];
          list.push({ id, alt: a.row[3], info });

          // 尾跡（5 分鐘，越舊越淡）
          const trail = pts.filter((q) => q.t <= P && q.t >= P - TRAIL_MS);
          const xy = trail.map((q) => proj(q.lat, q.lon));
          const [px, py] = proj(lat, lon);
          xy.push([px, py]);
          for (let j = 1; j < xy.length; j++) {
            const age = (P - trail[Math.min(j, trail.length - 1)].t) / TRAIL_MS;
            ctx.strokeStyle = `rgba(${C.trail},${(0.65 * (1 - Math.min(1, age))).toFixed(3)})`;
            ctx.lineWidth = 1.6 * k;
            ctx.beginPath();
            ctx.moveTo(xy[j - 1][0], xy[j - 1][1]);
            ctx.lineTo(xy[j][0], xy[j][1]);
            ctx.stroke();
          }

          if (px < -40 || px > w + 40 || py < -40 || py > h + 40) continue;
          const onGround = a.row[3] === 0;
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate((track * Math.PI) / 180);
          ctx.scale(13 * k, 13 * k);
          ctx.fillStyle = onGround ? "rgba(232,240,248,0.5)" : C.plane;
          ctx.fill(new Path2D(PLANE));
          ctx.restore();

          if (info?.f) {
            ctx.fillStyle = C.text;
            ctx.font = `600 ${19 * k}px ${mono}`;
            ctx.fillText(info.f, px + 18 * k, py - 9 * k);
            ctx.fillStyle = C.muted;
            ctx.font = `${16 * k}px ${mono}`;
            const alt = a.row[3] == null ? "" : onGround ? "地面" : `${Math.round(a.row[3] / 100) * 100} ft`;
            ctx.fillText([alt, info.tn].filter(Boolean).join(" · "), px + 18 * k, py + 11 * k);
          }
        }
      }

      // 資訊欄的內容一秒更新一次就好（不要每個畫格都叫 React 重畫）
      if (tick - lastPublish > 1000) {
        lastPublish = tick;
        list.sort((x, y) => (y.alt ?? -1) - (x.alt ?? -1));
        setShown(list);
        setClock(twTime.format(P));
      }
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  const offline = failed || (frame !== null && !frame.online);
  const quiet = frame !== null && !offline && shown.length === 0;
  const named = shown.filter((s) => s.info?.f);

  return (
    <div className="fixed inset-0 z-[200] overflow-hidden" style={{ background: C.bg, color: C.text, fontSize: "calc(100svh / 54)", fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <canvas ref={canvasRef} className="absolute inset-0 size-full" aria-hidden />

      {/* 左上：標題 */}
      <div className="absolute left-[2.4em] top-[2em]">
        <h1 className="font-serif font-light tracking-[0.08em]" style={{ fontSize: "2.6em", lineHeight: 1.15 }}>
          高雄上空 · 即時飛機雷達
        </h1>
        <p className="mt-[0.5em] font-mono tracking-[0.18em]" style={{ color: C.muted, fontSize: "0.95em" }}>
          KAOHSIUNG ADS-B LIVE RADAR
        </p>
        <p className="mt-[0.35em] font-light" style={{ color: C.muted, fontSize: "0.9em" }}>
          自己架的接收器（樹莓派＋SDR）· Self-built receiver
        </p>
      </div>

      {/* 右：統計與航班 */}
      <aside
        className="absolute right-[2em] top-[2em] bottom-[7.4em] flex w-[24em] flex-col rounded-sm border p-[1.6em]"
        style={{ background: "rgba(14,26,38,0.72)", borderColor: "rgba(255,255,255,0.08)" }}
      >
        <p className="font-mono tracking-[0.18em]" style={{ color: C.muted, fontSize: "0.85em" }}>
          空中 · IN THE AIR
        </p>
        <p className="mt-[0.2em] font-serif font-light leading-none" style={{ fontSize: "5.6em" }}>
          {offline ? "–" : shown.length}
          <span className="ml-[0.2em] font-sans font-light" style={{ color: C.muted, fontSize: "0.3em" }}>
            架 · aircraft
          </span>
        </p>

        <div className="mt-[1.4em] grid grid-cols-2 gap-[1em]">
          <div>
            <p className="font-serif font-light" style={{ fontSize: "2em" }}>{frame?.today?.unique ?? "–"}</p>
            <p style={{ color: C.muted, fontSize: "0.8em" }}>今天收到 · Today</p>
          </div>
          <div>
            <p className="font-serif font-light" style={{ fontSize: "2em" }}>{frame?.today?.peak ?? "–"}</p>
            <p style={{ color: C.muted, fontSize: "0.8em" }}>最多同時 · Peak</p>
          </div>
        </div>

        <p className="mt-[1.6em] border-t pt-[1em] font-mono tracking-[0.18em]" style={{ color: C.muted, fontSize: "0.85em", borderColor: "rgba(255,255,255,0.08)" }}>
          航班 · FLIGHTS
        </p>
        <ul className="mt-[0.6em] min-h-0 flex-1 space-y-[0.7em] overflow-hidden">
          {named.slice(0, 9).map((s) => (
            <li key={s.id} className="flex items-baseline justify-between gap-[1em]">
              <span className="min-w-0">
                <span className="font-mono font-semibold" style={{ fontSize: "1.1em" }}>{s.info.f}</span>
                <span className="ml-[0.6em] truncate font-light" style={{ color: C.muted, fontSize: "0.85em" }}>{s.info.an ?? s.info.al ?? ""}</span>
              </span>
              <span className="shrink-0 font-mono" style={{ color: C.muted, fontSize: "0.85em" }}>
                {s.alt == null ? "" : s.alt === 0 ? "地面" : `${(Math.round(s.alt / 100) * 100).toLocaleString("en-US")} ft`}
              </span>
            </li>
          ))}
        </ul>
        {frame?.today?.airlines?.length ? (
          <p className="mt-[0.8em] border-t pt-[0.8em] font-light leading-snug" style={{ color: C.muted, fontSize: "0.8em", borderColor: "rgba(255,255,255,0.08)" }}>
            今天：{frame.today.airlines.slice(0, 4).map((a) => `${a.name} ${a.n}`).join("　")}
          </p>
        ) : null}
      </aside>

      {/* 中央訊息：離線／安靜 */}
      {(offline || quiet) && (
        <div className="absolute left-[40%] top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <p className="font-serif font-light tracking-[0.1em]" style={{ fontSize: "2.4em" }}>
            {offline ? "接收器暫時離線 · Receiver offline" : "空域安靜中 · Quiet skies"}
          </p>
          <p className="mt-[0.6em] font-light" style={{ color: C.muted, fontSize: "1em" }}>
            {offline
              ? "會自動重新連線 · Reconnecting automatically"
              : frame?.lastAircraftAt
                ? `上一架 ${twHM.format(frame.lastAircraftAt)}（台灣時間）· 夜間機場有宵禁，飛機本來就少`
                : "夜間機場有宵禁，飛機本來就少"}
          </p>
        </div>
      )}

      {/* 左下：延遲說明＋資料時間 */}
      <div className="absolute bottom-[2em] left-[2.4em] font-mono" style={{ color: C.muted, fontSize: "0.95em" }}>
        <p>
          <span className="mr-[0.6em] inline-block size-[0.55em] rounded-full align-middle" style={{ background: offline ? "#8a6d3b" : "#6fa0d8" }} />
          畫面延遲約 1 分鐘 · Delayed ~1 min
        </p>
        <p className="mt-[0.3em]">資料時間 {clock || "--:--:--"}（台灣 UTC+8）</p>
        <p className="mt-[0.3em]" style={{ fontSize: "0.85em" }}>
          ━ 跑道 Runway　⬡ 導航台 VOR/TACAN　◌ NDB　┄ 縣市界
        </p>
      </div>

      {/* 右下：導流 */}
      <div className="absolute bottom-[2em] right-[2em] text-right">
        <p className="font-serif font-light tracking-[0.08em]" style={{ fontSize: "1.9em" }}>kbs0830.com/radar</p>
        <p className="mt-[0.2em] font-light" style={{ color: C.muted, fontSize: "0.85em" }}>
          完整統計與怎麼架的，在說明欄連結 · Details in the description
        </p>
      </div>
    </div>
  );
}
