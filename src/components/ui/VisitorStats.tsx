"use client";

import { useEffect, useState } from "react";
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
  cloudflare: CloudflareSummary | null;
}

const n = (v: number) => v.toLocaleString("en-US");

export default function VisitorStats() {
  const [stats, setStats] = useState<VisitorStatsData | null>(null);

  useEffect(() => {
    // 只讀。回報造訪是 layout 的 VisitBeacon（每一頁都算，2026-11-09 起），這裡再 POST 首頁會算兩次
    const ac = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/visitor-stats", { signal: ac.signal });
        setStats(await res.json());
      } catch {
        // 讀不到就不顯示
      }
    })();
    return () => ac.abort();
  }, []);

  if (!stats) return null;
  const { cloudflare: cf } = stats;

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
        // 每一段 whitespace-nowrap：窄螢幕只在「·」之間換行，不會把「2,940 訪客」拆開（2026-11-09：
        // 曾經為了這個在手機整行隱藏，使用者以為 Cloudflare 資料不見了——改成手機顯示精簡版）
        <p
          className="text-xs text-(--muted) font-light tracking-[0.1em] font-mono"
          title={
            `${cf.since} 起累計：訪客 ${n(cf.total.uniques)} · 頁面瀏覽 ${n(cf.total.pageViews)} · 請求 ${n(cf.total.requests)}` +
            "\n訪客＝每天不重複 IP 加總（含機器人），每小時更新"
          }
        >
          <span className="whitespace-nowrap">Cloudflare · 近 30 天 {n(cf.last30.uniques)} 訪客</span>{" "}
          <span className="whitespace-nowrap">· {n(cf.last30.pageViews)} 次瀏覽</span>{" "}
          <span className="whitespace-nowrap">· 累計 {n(cf.total.pageViews)} 次瀏覽</span>
        </p>
      )}
      {/* 「未過濾」那行 2026-11-09 依使用者要求拿掉（Cloudflare 快取之後它只數得到沒命中快取的請求）；細節在 /stats */}
    </>
  );
}
