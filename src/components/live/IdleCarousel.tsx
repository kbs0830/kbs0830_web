"use client";

import { useEffect, useRef, useState } from "react";
import { decodeMetar } from "@/lib/tools/metar";

// 直播畫面「沒有飛機時」中下方輪播的四張卡片（2026-11-29，使用者：「小港起飛，小港降落，現在天氣，近三天的雷達資料，這四個圖卡輪轉」；
// 「天氣跟小港機場時刻表，跟福岡不要有關係」；位置：右欄左邊那塊空地的正中間）。資料來自 /api/radar/idle，每分鐘更新一次；
// 有飛機時 RadarLiveScreen 會把這張卡淡出（元件一直掛著，不重新載入資料）。
// 換卡：上一張淡出（往上飄一點、變模糊）、下一張同時淡入（從下面升起、由模糊變清楚），兩張疊在同一個固定高度的框裡，
// 只動 transform／opacity／filter（都在顯卡上合成），畫面是 2K60 也不會卡。每張停留時間依內容多寡（DWELL）。
// METAR 用 lib/tools/metar.ts 在這裡解碼（跟 /tools/metar 同一份）。

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
// 每張停留多久（毫秒）：看內容多少——時刻表 6 列要掃一遍、METAR 有原文＋8 項翻譯要讀，統計卡最少。淡入淡出另外算
const DWELL: Record<string, number> = { dep: 14_000, arr: 14_000, wx: 18_000, l3: 12_000 };
const FADE_MS = 1300;

/** 這份資料現在有哪幾張卡（資料不全的略過，例如時刻表抓不到） */
function slideKeys(d: Idle | null): string[] {
  if (!d) return [];
  const k: string[] = [];
  if (d.dep?.length) k.push("dep");
  if (d.arr?.length) k.push("arr");
  if (d.metar || d.weather || d.aqi) k.push("wx");
  if (d.last3) k.push("l3");
  return k;
}

export default function IdleCarousel({ visible = true }: { visible?: boolean }) {
  const [data, setData] = useState<Idle | null>(null);
  const [phase, setPhase] = useState<{ cur: number; prev: number | null }>({ cur: 0, prev: null });
  const [h, setH] = useState(0); // 目前這張卡內容的高度（px）
  const roRef = useRef<ResizeObserver | null>(null);
  const keysRef = useRef("");
  const curRef = useRef(0);
  const keyStr = slideKeys(data).join(",");

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
    keysRef.current = keyStr;
  }, [keyStr]);

  // 量「現在這張」內容的高度：換卡時換觀察對象；內容自己變高（例如資料更新）也會跟著
  const measureRef = (el: HTMLDivElement | null) => {
    roRef.current?.disconnect();
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const e = entries[0];
      if (e) setH(Math.ceil(e.target.getBoundingClientRect().height));
    });
    roRef.current = ro;
    ro.observe(el);
  };

  // 換頁：每 0.5 秒看一次，現在這張停夠它的時間才換
  useEffect(() => {
    let since = Date.now();
    let fade: ReturnType<typeof setTimeout> | null = null;
    const t = setInterval(() => {
      const keys = keysRef.current.split(",").filter(Boolean);
      if (keys.length === 0) return;
      const cur = keys[curRef.current % keys.length];
      if (Date.now() - since >= (DWELL[cur] ?? 12_000)) {
        since = Date.now();
        const from = curRef.current;
        curRef.current += 1;
        setPhase({ cur: curRef.current, prev: from });
        if (fade) clearTimeout(fade);
        fade = setTimeout(() => setPhase((p) => (p.cur === curRef.current ? { cur: p.cur, prev: null } : p)), FADE_MS);
      }
    }, 500);
    return () => {
      clearInterval(t);
      if (fade) clearTimeout(fade);
    };
  }, []);

  const keys = slideKeys(data);
  if (!data || keys.length === 0) return null;
  const render = (n: number): { key: string; label: string; sub?: string; body: React.ReactNode } => {
    const key = keys[n % keys.length];
    if (key === "dep") return { key, label: "小港機場 · 起飛 DEPARTURES", body: <Board rows={data.dep ?? []} /> };
    if (key === "arr") return { key, label: "小港機場 · 降落 ARRIVALS", body: <Board rows={data.arr ?? []} /> };
    if (key === "wx") {
      // 「現在天氣」這頁只放完整的 METAR 電報原文，下面接白話翻譯（使用者：「那一頁只顯示完整 METAR，下面給翻譯」）
      return data.metar
        ? { key, label: "高雄機場天氣 · METAR", sub: obsTime(data.metar.raw), body: <Weather metar={data.metar.raw} /> }
        : { key, label: "高雄現在天氣 · WEATHER NOW", body: <WeatherFallback d={data} /> };
    }
    return { key, label: "近三天雷達資料 · LAST 3 DAYS", sub: "自己架的接收器", body: <Last3 d={data.last3!} /> };
  };
  const cur = render(phase.cur);
  const prev = phase.prev != null ? render(phase.prev) : null;
  const slides = [...(prev ? [{ ...prev, out: true }] : []), { ...cur, out: false }];

  return (
    // 外層用「畫面基準的 em」定位：中心放在「螢幕左邊到右欄之間」的正中央（右欄左邊緣在 70em → 中心 35em），寬 48em，左右各留約 11em。
    // 卡片放大的字級只加在內層：如果 left 寫在已經放大的元素上，em 會被乘上 1.2，整張卡就偏右、貼近右欄（使用者：「右邊太擠」）
    <div className="absolute" style={{ left: "35em", bottom: "8em", width: "48em", translate: "-50% 0", pointerEvents: "none" }}>
      <div
        className="w-full overflow-hidden rounded-sm border"
        style={{
          fontSize: "1.2em",
          padding: "1.1em", // 上下左右一樣（使用者：「空間四周都要一樣」）
          background: "rgba(14,26,38,0.78)",
          borderColor: "rgba(255,255,255,0.08)",
          opacity: visible ? 1 : 0,
          transform: visible ? "none" : "translate3d(0, 12px, 0)",
          filter: visible ? "none" : "blur(8px)",
          transition: "opacity 1s ease, transform 1s ease, filter 1s ease",
          willChange: "opacity, transform, filter",
        }}
      >
        <style>{`
          @keyframes idle-in { from { opacity: 0; transform: translate3d(14%, 0, 0); filter: blur(8px); } to { opacity: 1; transform: none; filter: blur(0); } }
          @keyframes idle-out { from { opacity: 1; transform: none; filter: blur(0); } to { opacity: 0; transform: translate3d(-14%, 0, 0); filter: blur(8px); } }
          @media (prefers-reduced-motion: reduce) { .idle-slide { animation: none !important; } }
        `}</style>
        {/* 高度 = 目前這張卡內容的高度（量出來的），換卡時高度也平順地變；內容多少就多高，四周留白才會一樣 */}
        <div className="relative" style={{ height: h ? `${h}px` : "14em", transition: "height 0.9s cubic-bezier(0.22, 0.8, 0.24, 1)" }}>
          {slides.map((s) => (
            <div
              key={s.key + (s.out ? "-out" : "-in")}
              className="idle-slide absolute inset-x-0 top-0"
              style={{
                animation: s.out ? `idle-out ${Math.round(FADE_MS * 0.8)}ms cubic-bezier(0.55, 0, 0.8, 0.4) both` : `idle-in ${FADE_MS}ms cubic-bezier(0.22, 0.8, 0.24, 1) both`,
                willChange: "transform, opacity, filter",
              }}
            >
              <div ref={s.out ? undefined : measureRef}>
                <div className="flex items-baseline justify-between">
                  <span className="font-mono tracking-[0.18em]" style={{ color: C.muted, fontSize: "0.8em" }}>{s.label}</span>
                  <span className="font-mono" style={{ color: C.muted, fontSize: "0.78em" }}>{s.sub ?? ""}</span>
                </div>
                <div className="mt-[0.5em]" style={{ fontSize: "0.95em" }}>{s.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* 頁碼的小點放在卡片外面下方：卡片裡面只剩內容與一致的留白 */}
      <div className="mt-[0.7em] flex justify-center gap-[0.55em]" aria-hidden style={{ opacity: visible ? 1 : 0, transition: "opacity 1s ease" }}>
        {keys.map((k, i) => (
          <span key={k} className="inline-block size-[0.5em] rounded-full" style={{ background: i === phase.cur % keys.length ? "#6fa0d8" : "rgba(138,160,181,0.35)", transition: "background 0.6s ease" }} />
        ))}
      </div>
    </div>
  );
}

function Board({ rows }: { rows: Row[] }) {
  const cols = "4.4em 5.4em 1fr 4em 3em";
  return (
    <>
      {/* 狀態與登機門要看得清楚：用亮色、跟航班同大，不是灰色小字（使用者：「狀態跟登機門不見了」） */}
      <div className="grid gap-[0.5em]" style={{ gridTemplateColumns: cols, color: C.muted, padding: "0 0 0.3em" }}>
        {/* 字級要放在每個欄位上、不能放在 grid 上：欄寬是 em，grid 字級變小欄寬就跟著變窄，表頭會跟資料對不上 */}
        <span style={{ fontSize: "0.72em" }}>時間</span>
        <span style={{ fontSize: "0.72em" }}>航班</span>
        <span style={{ fontSize: "0.72em" }}>目的地</span>
        <span style={{ fontSize: "0.72em" }}>狀態</span>
        <span className="text-right" style={{ fontSize: "0.72em" }}>登機門</span>
      </div>
      {rows.map((r) => (
        <div key={`${r.t}-${r.code}`} className="grid items-baseline gap-[0.5em]" style={{ gridTemplateColumns: cols, padding: "0.26em 0", borderTop: `1px solid ${C.line}` }}>
          <span className="font-mono">{r.t}</span>
          <span className="font-mono font-semibold">{r.code}</span>
          <span className="truncate">{r.place}</span>
          <span className="font-semibold" style={{ color: r.kind === "delayed" || r.kind === "cancelled" ? "#d9a766" : "#e8f0f8" }}>{r.status}</span>
          <span className="text-right font-mono font-semibold">{r.gate ?? "–"}</span>
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

/**
 * 翻譯整理成「項目｜內容」兩欄（使用者：「METAR 解釋，圖案對齊」）：項目名稱固定寬度靠左對齊，內容在同一條線上開始。
 * 來源是 decodeMetar 的 summary（每行開頭的字決定它是哪一項）。
 */
function rowsOf(m: ReturnType<typeof decodeMetar>): { label: string; text: string }[] {
  const clouds = m.tokens.filter((t) => t.field === "雲").map((t) => compactCloud(t.zh));
  const out: { label: string; text: string }[] = [];
  for (const l of m.summary.slice(1)) {
    // 第一行是機場與時間，標題已經有
    if (l.startsWith("風：")) out.push({ label: "風", text: l.slice(2).replace("，風速", " ·") });
    else if (l.startsWith("能見度")) out.push({ label: "能見度", text: l.replace(/^能見度\s*/, "") });
    else if (l.startsWith("天氣現象：")) out.push({ label: "天氣", text: l.slice(5) });
    else if (l.startsWith("沒有顯著天氣")) out.push({ label: "天氣", text: "沒有顯著天氣（沒下雨、沒起霧）" });
    else if (l.startsWith("雲：")) out.push({ label: "雲", text: clouds.join("、") });
    else if (l.startsWith("氣溫")) out.push({ label: "氣溫", text: l.replace(/^氣溫\s*/, "").replace("，露點", " ／ 露點") });
    else if (l.startsWith("QNH") || l.startsWith("高度表")) out.push({ label: "氣壓", text: l.replace("（修正海平面氣壓）", "").replace(/^QNH\s*/, "") });
    else if (l.startsWith("趨勢：")) out.push({ label: "趨勢", text: l.slice(3).replace("（詳見下表）", "") });
    else if (l.startsWith("飛航天氣分類：")) out.push({ label: "分類", text: l.slice(7) });
    else out.push({ label: "", text: l });
  }
  return out;
}

function Weather({ metar }: { metar: string }) {
  const m = decodeMetar(metar);
  const rows = rowsOf(m);
  return (
    <>
      <div className="font-mono" style={{ fontSize: "0.95em", lineHeight: 1.45, overflowWrap: "anywhere" }}>{m.raw}</div>
      <div className="mt-[0.6em] pt-[0.5em]" style={{ borderTop: `1px solid ${C.line}`, fontSize: "0.82em", lineHeight: 1.5 }}>
        {rows.map((r) => (
          <div key={r.label + r.text} className="grid gap-[0.8em]" style={{ gridTemplateColumns: "4.6em 1fr" }}>
            <span style={{ color: C.muted }}>{r.label}</span>
            <span className="font-light">{r.text}</span>
          </div>
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
