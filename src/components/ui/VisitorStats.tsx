"use client";

import { useEffect, useState } from "react";
import type { RawTraffic } from "@/app/api/visitor-stats/route";
import type { CloudflareSummary } from "@/lib/cloudflare-analytics";

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
  cloudflare: CloudflareSummary | null;
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
  const { raw, cloudflare: cf } = stats;

  return (
    <>
      {stats.total > 0 && (
        <p className="text-xs text-(--muted) font-light tracking-[0.15em] font-mono">
          共 {stats.total} 次造訪 · 來自 {stats.countryCount} 國{" "}
          {/* 國旗整串不拆行（手機上曾經斷成「TW US BE」＋下一行「DE CN」） */}
          <span className="whitespace-nowrap">{stats.top.map(([code]) => countryCodeToFlag(code)).join(" ")}</span>
        </p>
      )}
      {/* Cloudflare：跟 dashboard 同一份數字，含快取直接回應、沒到主機的請求（lib/cloudflare-analytics.ts） */}
      {cf && cf.total.pageViews > 0 && (
        // 手機只留上面那行：這兩行在窄螢幕斷得很亂，細節在 /stats（頁尾有連結）
        <p
          className="hidden sm:block text-xs text-(--muted) font-light tracking-[0.1em] font-mono"
          title={
            `${cf.since} 起累計：訪客 ${n(cf.total.uniques)} · 頁面瀏覽 ${n(cf.total.pageViews)} · 請求 ${n(cf.total.requests)}` +
            "\n訪客＝每天不重複 IP 加總（含機器人），每小時更新"
          }
        >
          Cloudflare · 近 30 天 {n(cf.last30.uniques)} 訪客 · {n(cf.last30.pageViews)} 次瀏覽 · 累計 {n(cf.total.pageViews)} 次瀏覽
        </p>
      )}
      {/* 未過濾：server 端每個頁面請求都算，AI 爬蟲／搜尋引擎／掃描器都在裡面（scripts/lib/raw-traffic.js） */}
      {raw && raw.total > 0 && (
        <p
          className="hidden sm:block text-xs text-(--muted) font-light tracking-[0.1em] font-mono opacity-70"
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
