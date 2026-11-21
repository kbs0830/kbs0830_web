"use client";

import { useEffect, useState } from "react";
import SectionHeading from "@/components/ui/SectionHeading";

// 自家 FR24 雷達的即時狀態（/flights 最下面；資料見 scripts/lib/radar.js、/api/radar）。
// 放在頁面最下面：資料是載入後才拿到的，放上面會把底下的內容往下推（CLS）。
// 雷達沒設定（configured: false）就整塊不顯示。分頁在背景時不輪詢。
// 隱私：只顯示數字跟航空公司，不放地圖、座標、涵蓋範圍（那些看得出接收器在哪）。

interface RadarSummary {
  configured: boolean;
  online?: boolean;
  aircraftNow?: number;
  today?: { unique: number; peak: number; airlines: { code: string; name: string; n: number }[] };
  week?: { unique: number; uptime: number | null };
  since?: string;
}

const nf = new Intl.NumberFormat("zh-TW");

export default function RadarStatus() {
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

  if (!data?.configured || !data.today) return null;
  const { online, today, week } = data;

  return (
    <section className="mt-12" aria-label="自家雷達即時狀態">
      <SectionHeading en="My Radar">自家雷達</SectionHeading>
      <p className="flex items-center gap-2 text-xs font-mono text-(--muted) mb-4">
        <span
          aria-hidden
          className={`inline-block w-1.5 h-1.5 rounded-full ${online ? "bg-(--accent)" : "bg-(--border)"}`}
        />
        {online ? "收訊中 · Live" : "暫時離線 · Offline"}
      </p>

      <dl className="grid grid-cols-3 gap-px bg-(--border) border border-(--border) rounded-sm overflow-hidden">
        {[
          [online ? nf.format(data.aircraftNow ?? 0) : "–", "現在 · Now"],
          [nf.format(today.unique), "今天 · Today"],
          [nf.format(today.peak), "最多同時 · Peak"],
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

      {today.airlines.length > 0 && (
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
        <span className="block text-[11px] font-mono mt-1">Self-hosted ADS-B receiver, feeding Flightradar24.</span>
      </p>
    </section>
  );
}
