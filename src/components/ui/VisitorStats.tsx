"use client";

import { useEffect, useState } from "react";
import type { RawTraffic } from "@/app/api/visitor-stats/route";

function countryCodeToFlag(code: string) {
  if (!/^[A-Z]{2}$/.test(code)) return "🏳️";
  const points = [...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65);
  return String.fromCodePoint(...points);
}

interface VisitorStatsData {
  total: number;
  countryCount: number;
  top: [string, number][];
  raw: RawTraffic | null;
}

const n = (v: number) => v.toLocaleString("en-US");

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

  if (!stats) return null;
  const { raw } = stats;

  return (
    <>
      {stats.total > 0 && (
        <p className="text-xs text-(--muted) font-light tracking-[0.15em] font-mono">
          共 {stats.total} 次造訪 · 來自 {stats.countryCount} 國{" "}
          {stats.top.map(([code]) => countryCodeToFlag(code)).join(" ")}
        </p>
      )}
      {/* 未過濾：server 端每個頁面請求都算，AI 爬蟲／搜尋引擎／掃描器都在裡面（scripts/lib/raw-traffic.js） */}
      {raw && raw.total > 0 && (
        <p
          className="text-xs text-(--muted) font-light tracking-[0.1em] font-mono opacity-70"
          title={
            `${raw.since} 起，每一個頁面請求都算（不執行 JS 的爬蟲也算）` +
            (raw.topBots.length ? `\n最常來的爬蟲：${raw.topBots.map(([name, c]) => `${name} ${c}`).join("、")}` : "")
          }
        >
          未過濾 {n(raw.total)} 次 · 瀏覽器 {n(raw.browser)} · AI 爬蟲 {n(raw.ai)} · 搜尋引擎 {n(raw.search)} · 其他機器人 {n(raw.bot)}
        </p>
      )}
    </>
  );
}
