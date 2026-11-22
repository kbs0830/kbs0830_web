"use client";

import { useEffect, useState } from "react";

function formatTime(tz: string) {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

type CityWeather = { id: string; label: string; temp: number };

// 頁尾高雄／福岡現地時間＋天氣（天氣是 TODO D3，2026-11-22：/api/weather，伺服器 30 分鐘跟 Open-Meteo 抓一次）。
// 天氣讀不到就只顯示時間；分頁在背景時不更新。
export default function LocalClock() {
  const [times, setTimes] = useState<{ kh: string; fk: string } | null>(null);
  const [weather, setWeather] = useState<Record<string, CityWeather>>({});

  useEffect(() => {
    const update = () => setTimes({ kh: formatTime("Asia/Taipei"), fk: formatTime("Asia/Tokyo") });
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let ctrl: AbortController | null = null;
    const load = async () => {
      if (document.hidden) return;
      ctrl?.abort();
      ctrl = new AbortController();
      try {
        const res = await fetch("/api/weather", { signal: ctrl.signal });
        const data: { cities?: CityWeather[] } = await res.json();
        setWeather(Object.fromEntries((data.cities ?? []).map((c) => [c.id, c])));
      } catch {}
    };
    load();
    const id = setInterval(load, 30 * 60_000);
    return () => {
      clearInterval(id);
      ctrl?.abort();
    };
  }, []);

  const w = (id: string) => (weather[id] ? ` ${weather[id].label} ${weather[id].temp}°` : "");

  return (
    <p className="text-xs text-(--muted) font-light tracking-[0.15em] font-mono">
      {times ? `高雄 ${times.kh}${w("kh")} ・ 福岡 ${times.fk}${w("fk")}` : "高雄 · 福岡"}
    </p>
  );
}
