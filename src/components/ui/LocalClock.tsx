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

export default function LocalClock() {
  const [times, setTimes] = useState<{ kh: string; fk: string } | null>(null);

  useEffect(() => {
    const update = () => setTimes({ kh: formatTime("Asia/Taipei"), fk: formatTime("Asia/Tokyo") });
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <p
      className="text-xs text-(--border) font-light tracking-[0.15em]"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      {times ? `高雄 ${times.kh} ・ 福岡 ${times.fk}` : "高雄 · 福岡"}
    </p>
  );
}
