"use client";

import { useEffect, useState } from "react";

function countryCodeToFlag(code: string) {
  if (!/^[A-Z]{2}$/.test(code)) return "🏳️";
  const points = [...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65);
  return String.fromCodePoint(...points);
}

interface VisitorStatsData {
  total: number;
  countryCount: number;
  top: [string, number][];
}

export default function VisitorStats() {
  const [stats, setStats] = useState<VisitorStatsData | null>(null);

  useEffect(() => {
    // POST 本身就是這次造訪的回報（只有真的執行這段 JS 的瀏覽器才會打到），
    // 回傳值直接是回報後的最新彙總，不用再多打一次 GET。
    fetch("/api/visitor-stats", { method: "POST" })
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  if (!stats || stats.total === 0) return null;

  return (
    <p
      className="text-xs text-(--muted) font-light tracking-[0.15em]"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      共 {stats.total} 次造訪 · 來自 {stats.countryCount} 國{" "}
      {stats.top.map(([code]) => countryCodeToFlag(code)).join(" ")}
    </p>
  );
}
