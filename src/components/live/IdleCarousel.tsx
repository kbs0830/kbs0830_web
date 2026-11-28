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
  last3: { unique: number; peak: number; days: { date: string; unique: number; peak: number }[]; airlines: { name: string; n: number }[]; types: { name: string; n: number }[] } | null;
};

const C = { muted: "#8aa0b5", line: "rgba(255,255,255,0.06)" };
// 每張停留多久（毫秒）：看內容多少——時刻表 6 列要掃一遍、METAR 有原文＋8 項翻譯要讀，統計卡最少。淡入淡出另外算
const DWELL: Record<string, number> = { dep: 14_000, arr: 14_000, wx: 18_000, l3: 12_000 };
const SLIDE_MS = 1000; // 換卡動畫的長度（舊卡移出、新卡淡入同一段時間）
const FADE_MS = SLIDE_MS + 200; // 動畫結束後才把舊卡拿掉

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

export default function IdleCarousel({ visible = true, headline, subline }: { visible?: boolean; headline: string; subline: string }) {
  const [data, setData] = useState<Idle | null>(null);
  const [phase, setPhase] = useState<{ cur: number; prev: number | null }>({ cur: 0, prev: null });
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
  const hasCards = data !== null && keys.length > 0;
  const render = (n: number): { key: string; label: string; sub?: string; body: React.ReactNode } => {
    const d = data!;
    const key = keys[n % keys.length];
    if (key === "dep") return { key, label: "小港機場 · 起飛 DEPARTURES", body: <Board rows={d.dep ?? []} /> };
    if (key === "arr") return { key, label: "小港機場 · 降落 ARRIVALS", body: <Board rows={d.arr ?? []} /> };
    if (key === "wx") {
      // 「現在天氣」這頁只放完整的 METAR 電報原文，下面接白話翻譯（使用者：「那一頁只顯示完整 METAR，下面給翻譯」）
      return d.metar
        ? { key, label: "高雄機場天氣 · METAR", sub: obsTime(d.metar.raw), body: <Weather metar={d.metar.raw} /> }
        : { key, label: "高雄現在天氣 · WEATHER NOW", body: <WeatherFallback d={d} /> };
    }
    return { key, label: "近三天雷達資料 · LAST 3 DAYS", sub: "自己架的接收器", body: <Last3 d={d.last3!} /> };
  };
  const cur = hasCards ? render(phase.cur) : null;
  const prev = hasCards && phase.prev != null ? render(phase.prev) : null;
  const slides = cur ? [...(prev ? [{ ...prev, out: true }] : []), { ...cur, out: false }] : [];

  return (
    // 狀態文字（空域安靜中／接收器離線）跟卡片是「同一組」（使用者：「你跟上面的狀態是一體的，要一起上抬」）：
    // 放在同一個容器裡、固定間距，整組一起定位、一起淡入淡出；卡片大小固定不變（使用者：「卡片大小不要動」）。
    // 容器用「畫面基準的 em」定位：中心放在「螢幕左邊到右欄之間」的正中央（右欄左邊緣在 70em → 中心 35em），寬 48em，左右各留約 11em。
    // 卡片放大的字級只加在內層：如果 left 寫在已經放大的元素上，em 會被乘上 1.2，整張卡就偏右、貼近右欄（使用者：「右邊太擠」）
    <div
      className="absolute"
      style={{
        left: "35em",
        top: "28em", // 垂直中心：上邊界＝左上標題區塊底部（約 8.5em）、下邊界＝左下「即時」區塊頂部（約 47.5em）的正中間
        width: "48em",
        translate: "-50% -50%",
        pointerEvents: "none",
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : "translate3d(0, 12px, 0)",
        filter: visible ? "none" : "blur(8px)",
        transition: "opacity 1s ease, transform 1s ease, filter 1s ease",
        willChange: "opacity, transform, filter",
      }}
      aria-hidden={!visible}
    >
      <div className="text-center" style={{ marginBottom: hasCards ? "1.8em" : 0 }}>
        <p className="font-serif font-light tracking-[0.1em]" style={{ fontSize: "2.4em" }}>{headline}</p>
        <p className="mt-[0.6em] font-light" style={{ color: C.muted, fontSize: "1em" }}>{subline}</p>
      </div>
      {hasCards && (
        <>
          <div className="w-full overflow-hidden rounded-sm border" style={{ fontSize: "1.2em", padding: "1.1em", background: "rgba(14,26,38,0.78)", borderColor: "rgba(255,255,255,0.08)" }}>
            <style>{`
              /* 新卡：留在原位、只淡入（不從右邊移進來）。舊卡：往左移出並淡出。兩者同一段時間、新卡稍晚一點點開始，看起來是舊卡被推開、新卡浮現 */
              @keyframes idle-in { from { opacity: 0; } to { opacity: 1; } }
              @keyframes idle-out { from { opacity: 1; transform: none; filter: blur(0); } to { opacity: 0; transform: translate3d(-16%, 0, 0); filter: blur(5px); } }
              @media (prefers-reduced-motion: reduce) { .idle-slide { animation: none !important; } }
            `}</style>
            {/* 固定大小：以內容最多的那張（METAR）為準；內容比較少的卡在框裡上下置中，四周留白看起來一樣 */}
            <div className="relative" style={{ height: "15.5em" }}>
              {slides.map((s) => (
                <div
                  key={s.key + (s.out ? "-out" : "-in")}
                  className="idle-slide absolute inset-0 flex items-center"
                  style={{
                    animation: s.out ? `idle-out ${SLIDE_MS}ms cubic-bezier(0.4, 0, 0.2, 1) both` : `idle-in ${SLIDE_MS}ms ease-out 120ms both`,
                    zIndex: s.out ? 2 : 1,
                    willChange: "transform, opacity, filter",
                  }}
                >
                  <div className="w-full">
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
          <div className="mt-[0.7em] flex justify-center gap-[0.55em]" aria-hidden>
            {keys.map((k, i) => (
              <span key={k} className="inline-block size-[0.5em] rounded-full" style={{ background: i === phase.cur % keys.length ? "#6fa0d8" : "rgba(138,160,181,0.35)", transition: "background 0.6s ease" }} />
            ))}
          </div>
        </>
      )}
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

/**
 * 近三天雷達資料（使用者：「三天雷達資料頁面顯示內容重做」）。兩欄、對齊同一條線：
 *   左：三天總共收到幾架（大數字）＋同時最多，下面三天逐日橫條（日期、星期、橫條、架數、當天最多同時）
 *   右：航空公司前三、機型前三（各三列，名稱靠左、架數靠右）
 * 只有數字、航空公司、機型（跟 /radar 頁公開的是同一批），沒有位置。
 */
const WEEKDAY = ["日", "一", "二", "三", "四", "五", "六"];
// 台灣日期的中午 12 點 = UTC 04:00，同一天，用 getUTCDay 就是台灣那天的星期
const dayLabel = (date: string) => `${date.slice(5)}（${WEEKDAY[new Date(`${date}T12:00:00+08:00`).getUTCDay()]}）`;

function NameList({ title, rows }: { title: string; rows: { name: string; n: number }[] }) {
  return (
    <div>
      <div className="font-mono tracking-[0.12em]" style={{ color: C.muted, fontSize: "0.78em", paddingBottom: "0.3em", borderBottom: `1px solid ${C.line}` }}>{title}</div>
      {rows.map((r) => (
        <div key={r.name} className="flex items-baseline justify-between gap-[0.8em]" style={{ padding: "0.22em 0" }}>
          <span className="truncate">{r.name}</span>
          <span className="font-mono" style={{ color: C.muted }}>{r.n}</span>
        </div>
      ))}
    </div>
  );
}

function Last3({ d }: { d: NonNullable<Idle["last3"]> }) {
  const max = Math.max(1, ...d.days.map((x) => x.unique));
  return (
    <div className="grid gap-[2em]" style={{ gridTemplateColumns: "1.15fr 1fr" }}>
      <div>
        <div className="flex items-baseline gap-[0.5em]">
          <span className="font-serif" style={{ fontSize: "2.6em", lineHeight: 1.1 }}>{d.unique.toLocaleString("en-US")}</span>
          <span style={{ color: C.muted }}>架次</span>
          <span className="ml-auto font-mono" style={{ color: C.muted, fontSize: "0.85em" }}>同時最多 {d.peak} 架</span>
        </div>
        <div className="mt-[0.6em] pt-[0.5em]" style={{ borderTop: `1px solid ${C.line}` }}>
          {d.days.map((x) => (
            <div key={x.date} className="grid items-center gap-[0.7em]" style={{ gridTemplateColumns: "5.6em 1fr 2.4em", padding: "0.2em 0" }}>
              <span className="font-mono" style={{ color: C.muted, fontSize: "0.85em" }}>{dayLabel(x.date)}</span>
              <span className="block h-[0.65em] rounded-[2px]" style={{ width: `${Math.max(2, (x.unique / max) * 100)}%`, background: "#6fa0d8", opacity: 0.85 }} />
              <span className="text-right font-mono">{x.unique}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-[1em] content-start" style={{ fontSize: "0.92em" }}>
        <NameList title="航空公司前三" rows={d.airlines} />
        <NameList title="機型前三" rows={d.types} />
      </div>
    </div>
  );
}
