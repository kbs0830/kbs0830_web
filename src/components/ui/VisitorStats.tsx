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
    fetch("/api/visitor-stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  if (!stats || stats.countryCount === 0) return null;

  return (
    <p
      className="text-xs text-(--border) font-light tracking-[0.15em]"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      訪客來自 {stats.countryCount} 國 {stats.top.map(([code]) => countryCodeToFlag(code)).join(" ")}
    </p>
  );
}
