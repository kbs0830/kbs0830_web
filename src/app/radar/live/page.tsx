import type { Metadata } from "next";
import RadarLiveScreen from "@/components/live/RadarLiveScreen";

// 直播畫面（OBS 瀏覽器來源，建議 1920×1080，網址 https://kbs0830.com/radar/live）。
// 不包 PageShell（沒有導覽列）、不進 sitemap、noindex；資料與隱私規則見 RadarLiveScreen.tsx、scripts/lib/radar-live.js
export const metadata: Metadata = {
  title: "即時飛機雷達 · Live Radar — PINGWEI LI",
  robots: { index: false, follow: false },
};

export default function RadarLivePage() {
  return <RadarLiveScreen />;
}
