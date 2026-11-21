"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SectionHeading from "@/components/ui/SectionHeading";

// 自家 FR24 雷達的即時狀態（資料見 scripts/lib/radar.js、/api/radar）。
//   - RadarStatus：/flights 頁首的完整區塊（id="radar"，作品頁「看即時狀態」連過來）
//   - RadarBadge：首頁 About 現況卡下面的小卡（跟 Spotify 同一種樣式），點了到 /radar（完整頁，有圖表）
// 2026-11-21 使用者：「雷達、飛行紀錄、住宿紀錄可以不用藏那麼深，FR24 自架站點是一個特色」→ 從 /flights 最下面搬上來。
// RadarStatus 載入中先畫同樣大小的骨架（數字是 –），資料回來不會把下面的內容往下推；雷達沒設定（configured: false）才整塊拿掉。
// 隱私：只顯示數字跟航空公司，不放地圖、座標、涵蓋範圍（那些看得出接收器在哪）。

export interface RadarSummary {
  configured: boolean;
  online?: boolean;
  aircraftNow?: number;
  today?: { unique: number; peak: number; airlines: { code: string; name: string; n: number }[] };
  week?: { unique: number; uptime: number | null };
  since?: string;
}

const nf = new Intl.NumberFormat("zh-TW");

/** 每分鐘讀一次 /api/radar；分頁在背景時不讀、切回來馬上讀；離開頁面 abort */
function useRadarSummary() {
  const [data, setData] = useState<RadarSummary | null>(null);
  useEffect(() => {
    const ac = new AbortController();
    const load = async () => {
      if (document.hidden) return;
      try {
        const res = await fetch("/api/radar", { signal: ac.signal });
        setData((await res.json()) as RadarSummary);
      } catch {
        // abort 或網路錯誤：維持原本顯示
      }
    };
    load();
    const id = setInterval(load, 60_000);
    document.addEventListener("visibilitychange", load, { signal: ac.signal });
    return () => {
      ac.abort();
      clearInterval(id);
    };
  }, []);
  return data;
}

function Dot({ on }: { on: boolean | undefined }) {
  return <span aria-hidden className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${on ? "bg-(--accent)" : "bg-(--border)"}`} />;
}

export default function RadarStatus({ className = "" }: { className?: string }) {
  const data = useRadarSummary();
  if (data && (!data.configured || !data.today)) return null;
  const loading = !data;
  const online = data?.online;
  const today = data?.today;
  const week = data?.week;
  const num = (v: number | undefined) => (loading || v === undefined ? "–" : nf.format(v));

  return (
    <section id="radar" className={`scroll-mt-24 ${className}`} aria-label="自家雷達即時狀態" aria-busy={loading}>
      <SectionHeading en="My Radar">自家雷達</SectionHeading>
      <p className="flex items-center gap-2 text-xs font-mono text-(--muted) mb-4">
        <Dot on={online} />
        {loading ? "讀取中 · Loading" : online ? "收訊中 · Live" : "暫時離線 · Offline"}
      </p>

      <dl className="grid grid-cols-3 gap-px bg-(--border) border border-(--border) rounded-sm overflow-hidden">
        {[
          [online ? num(data?.aircraftNow) : "–", "現在 · Now"],
          [num(today?.unique), "今天 · Today"],
          [num(today?.peak), "最多同時 · Peak"],
        ].map(([value, label]) => (
          <div key={label} className="bg-(--bg) px-4 py-4 flex flex-col-reverse">
            <dt className="text-[11px] text-(--muted) font-mono tracking-wide">{label}</dt>
            <dd className="text-xl font-light text-(--text) font-mono mb-1">
              {value}
              <span className="text-xs text-(--muted) ml-1">架</span>
            </dd>
          </div>
        ))}
      </dl>

      {today && today.airlines.length > 0 && (
        <p className="text-[15px] sm:text-sm text-(--text) font-light leading-relaxed mt-4">
          <span className="text-xs text-(--muted) mr-2">今天收到</span>
          {today.airlines.map((a) => (
            <span key={a.code} className="inline-block mr-3">
              {a.name}
              <span className="text-[11px] text-(--muted) font-mono ml-1">{a.n}</span>
            </span>
          ))}
        </p>
      )}

      <p className="text-xs text-(--muted) font-light leading-relaxed mt-4">
        自己架的 ADS-B 接收器（樹莓派＋SDR），收到的資料同時分享給 Flightradar24。
        {week && week.unique > 0 && <>近 7 天收到 {nf.format(week.unique)} 架次{week.uptime != null && `，在線 ${week.uptime}%`}。</>}
        <Link href="/radar" className="text-(--accent) underline underline-offset-4 ml-1 whitespace-nowrap">
          完整雷達頁 →
        </Link>
        <span className="block text-[11px] font-mono mt-1">Self-hosted ADS-B receiver, feeding Flightradar24.</span>
      </p>
    </section>
  );
}

// 「怎麼架的 →」夾在文字中間：一定要有底線，只靠顏色區分會被 axe 的 link-in-text-block 擋（色弱分不出來）

/** 首頁 About 的小卡：還沒拿到資料或沒設定就不顯示（在首屏以下，出現時不影響 CLS） */
export function RadarBadge() {
  const data = useRadarSummary();
  if (!data?.configured || !data.today) return null;
  return (
    <Link
      href="/radar"
      className="group flex items-center gap-3 p-3 border border-(--border) rounded-sm bg-(--bg) hover:border-(--accent) transition-colors"
    >
      <Dot on={data.online} />
      <div className="min-w-0">
        <p className="text-[10px] tracking-[0.2em] text-(--accent) uppercase font-mono">自家雷達 · My Radar</p>
        <p className="text-xs font-light text-(--text) group-hover:text-(--accent) transition-colors">
          {data.online ? `收訊中 · 現在 ${nf.format(data.aircraftNow ?? 0)} 架 · 今天 ${nf.format(data.today.unique)} 架` : "暫時離線"}
          <span className="text-(--muted) ml-1">→</span>
        </p>
      </div>
    </Link>
  );
}
