"use client";

import { useEffect, useState } from "react";
import { decodeMetar } from "@/lib/tools/metar";

// 直播畫面「沒有飛機時」中下方輪播的四張卡片（2026-11-29，使用者：「小港起飛，小港降落，現在天氣，近三天的雷達資料，這四個圖卡輪轉」；
// 「天氣跟小港機場時刻表，跟福岡不要有關係」；位置：右欄左邊那塊空地的正中間）。資料來自 /api/radar/idle，每分鐘更新一次；
// 有飛機時 RadarLiveScreen 就不畫這個元件。每 12 秒換一張，淡入。METAR 用 lib/tools/metar.ts 在這裡解碼（跟 /tools/metar 同一份）。

type Row = { t: string; changed: string | null; code: string; place: string; status: string; kind: string; gate: string | null };
type Idle = {
  nowHm: string;
  dep: Row[] | null;
  arr: Row[] | null;
  weather: { temp: number; label: string } | null;
  aqi: { aqi: number; status: string; main: string | null } | null;
  metar: { raw: string; at: number } | null;
  last3: { unique: number; peak: number; days: { date: string; unique: number }[]; airlines: { name: string; n: number }[] } | null;
};

const C = { muted: "#8aa0b5", line: "rgba(255,255,255,0.06)" };
const SLIDE_MS = 12_000;

export default function IdleCarousel() {
  const [data, setData] = useState<Idle | null>(null);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    let alive = true;
    const ctrl = new AbortController();
    const load = async () => {
      try {
        const res = await fetch("/api/radar/idle", { cache: "no-store", signal: ctrl.signal });
        if (res.ok && alive) setData(await res.json());
      } catch {
        // 抓不到就維持上一份
      }
    };
    void load();
    const t = setInterval(load, 60_000);
    return () => {
      alive = false;
      ctrl.abort();
      clearInterval(t);
    };
  }, []);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => i + 1), SLIDE_MS);
    return () => clearInterval(t);
  }, []);

  if (!data) return null;
  // 資料不全的卡片略過（例如時刻表抓不到）
  const slides: { key: string; label: string; sub: string; body: React.ReactNode }[] = [];
  if (data.dep?.length) slides.push({ key: "dep", label: "小港機場 · 起飛 DEPARTURES", sub: `現在 ${data.nowHm} · 台灣時間`, body: <Board rows={data.dep} /> });
  if (data.arr?.length) slides.push({ key: "arr", label: "小港機場 · 降落 ARRIVALS", sub: `現在 ${data.nowHm} · 台灣時間`, body: <Board rows={data.arr} /> });
  // 「現在天氣」這頁只放完整的 METAR 電報原文，下面接白話翻譯（使用者：「那一頁只顯示完整 METAR，下面給翻譯」）
  if (data.metar) slides.push({ key: "wx", label: "高雄機場天氣 · METAR", sub: obsTime(data.metar.raw), body: <Weather metar={data.metar.raw} /> });
  else if (data.weather || data.aqi) slides.push({ key: "wx", label: "高雄現在天氣 · WEATHER NOW", sub: "", body: <WeatherFallback d={data} /> });
  if (data.last3) slides.push({ key: "l3", label: "近三天雷達資料 · LAST 3 DAYS", sub: "自己架的接收器", body: <Last3 d={data.last3} /> });
  if (slides.length === 0) return null;
  const cur = slides[idx % slides.length];

  return (
    <div className="absolute bottom-[7.5em] w-[38em] rounded-sm border px-[1.3em] pt-[1em] pb-[0.9em]" style={{ left: "35em", translate: "-50% 0", background: "rgba(14,26,38,0.78)", borderColor: "rgba(255,255,255,0.08)" }}>
      <div key={cur.key} className="enter-fade" style={{ ["--enter-duration" as string]: "1.2s" }}>
        <div className="flex items-baseline justify-between">
          <span className="font-mono tracking-[0.18em]" style={{ color: C.muted, fontSize: "0.8em" }}>{cur.label}</span>
          <span className="font-mono" style={{ color: C.muted, fontSize: "0.78em" }}>{cur.sub}</span>
        </div>
        <div className="mt-[0.5em]" style={{ fontSize: "0.95em", minHeight: "13.5em" }}>{cur.body}</div>
      </div>
      <div className="mt-[0.5em] flex justify-end gap-[0.45em]" aria-hidden>
        {slides.map((s, i) => (
          <span key={s.key} className="inline-block size-[0.5em] rounded-full" style={{ background: i === idx % slides.length ? "#6fa0d8" : "rgba(138,160,181,0.35)" }} />
        ))}
      </div>
    </div>
  );
}

function Board({ rows }: { rows: Row[] }) {
  return (
    <>
      {rows.map((r) => (
        <div key={`${r.t}-${r.code}`} className="grid items-baseline gap-[0.5em]" style={{ gridTemplateColumns: "4.2em 5.2em 1fr 3.8em 2.4em", padding: "0.28em 0", borderTop: `1px solid ${C.line}` }}>
          <span className="font-mono">{r.t}</span>
          <span className="font-mono font-semibold">{r.code}</span>
          <span className="truncate">{r.place}</span>
          <span style={{ color: r.kind === "delayed" || r.kind === "cancelled" ? "#d9a766" : C.muted }}>{r.status}</span>
          <span className="text-right font-mono" style={{ color: C.muted }}>{r.gate ?? "–"}</span>
        </div>
      ))}
    </>
  );
}

function Big({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <div style={{ color: C.muted, fontSize: "0.8em" }}>{label}</div>
      <div className="font-serif" style={{ fontSize: "2.1em", lineHeight: 1.15 }}>{value}</div>
      {sub && <div style={{ fontSize: "0.9em", color: C.muted }}>{sub}</div>}
    </div>
  );
}

/** 電報裡的觀測時間 → 「觀測 HH:MM · 台灣時間」 */
function obsTime(raw: string) {
  const t = decodeMetar(raw).time;
  return t ? `觀測 ${String((t.hour + 8) % 24).padStart(2, "0")}:${String(t.minute).padStart(2, "0")} · 台灣時間` : "";
}

/** 雲的白話縮短版（拿掉括號裡的細節，畫面放得下）：「少量雲，雲底 2,000 呎」 */
const compactCloud = (zh: string) => zh.replace(/（[^）]*）/g, "");

function Weather({ metar }: { metar: string }) {
  const m = decodeMetar(metar);
  const clouds = m.tokens.filter((t) => t.field === "雲").map((t) => compactCloud(t.zh));
  // 翻譯：照電報順序，每項一行，跟畫面上的原文一一對得上
  const lines = m.summary
    .slice(1) // 第一行是機場與時間，標題已經有
    .map((l) => (l.startsWith("雲：") ? `雲：${clouds.join("、")}` : l.replace("（詳見下表）", "").replace(/（修正海平面氣壓）/, "")))
    .filter(Boolean);
  return (
    <>
      <div className="font-mono" style={{ fontSize: "0.95em", lineHeight: 1.45, overflowWrap: "anywhere" }}>{m.raw}</div>
      <div className="mt-[0.6em] pt-[0.5em]" style={{ borderTop: `1px solid ${C.line}`, fontSize: "0.82em", lineHeight: 1.5 }}>
        {lines.map((l) => (
          <div key={l} className="font-light">{l}</div>
        ))}
      </div>
    </>
  );
}

/** 抓不到 METAR 時的備案：用氣象模型的氣溫與空品 */
function WeatherFallback({ d }: { d: Idle }) {
  return (
    <div className="grid gap-[1em]" style={{ gridTemplateColumns: "1fr 1fr" }}>
      {d.weather && <Big label="天氣" value={`${d.weather.temp}°C`} sub={d.weather.label} />}
      {d.aqi && <Big label="空氣品質 AQI" value={String(d.aqi.aqi)} sub={d.aqi.main ?? d.aqi.status} />}
    </div>
  );
}

function Last3({ d }: { d: NonNullable<Idle["last3"]> }) {
  const max = Math.max(1, ...d.days.map((x) => x.unique));
  return (
    <>
      <div className="grid gap-[1em]" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
        <Big label="這三天收到" value={`${d.unique.toLocaleString("en-US")} 架次`} />
        <Big label="同時最多" value={`${d.peak} 架`} />
        <div>
          <div style={{ color: C.muted, fontSize: "0.8em" }}>航空公司前三</div>
          <div className="mt-[0.2em]" style={{ fontSize: "0.9em", lineHeight: 1.45 }}>
            {d.airlines.map((a) => (
              <div key={a.name} className="flex justify-between gap-[0.6em]">
                <span className="truncate">{a.name}</span>
                <span className="font-mono" style={{ color: C.muted }}>{a.n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-[0.8em] pt-[0.6em]" style={{ borderTop: `1px solid ${C.line}` }}>
        {d.days.map((x) => (
          <div key={x.date} className="grid items-center gap-[0.7em]" style={{ gridTemplateColumns: "3.2em 1fr 3em", padding: "0.18em 0" }}>
            <span className="font-mono" style={{ color: C.muted, fontSize: "0.85em" }}>{x.date.slice(5)}</span>
            <span className="block h-[0.7em] rounded-[2px]" style={{ width: `${Math.max(2, (x.unique / max) * 100)}%`, background: "#6fa0d8", opacity: 0.85 }} />
            <span className="text-right font-mono" style={{ fontSize: "0.85em" }}>{x.unique}</span>
          </div>
        ))}
      </div>
    </>
  );
}
