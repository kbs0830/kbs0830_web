import { pageCardImage } from "@/lib/site/og-card";
import { incidents } from "@/lib/ops/incidents";

// 這頁的分享圖（版面在 lib/site/og-card.tsx）。可用率是即時數字，不放；事故報告篇數是固定的
export const alt = "PINGWEI LI · 維運狀態";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return pageCardImage({
    eyebrow: "維運狀態 · Status",
    eyebrowEn: "Status",
    title: "維運狀態",
    titleEn: "Site Status",
    description: "自家桌機架的網站：可用率、每次部署、自動重啟，跟出過的事故。",
    descriptionEn: "Uptime, deploys, auto-recovery and incident reports of a self-hosted site.",
    stats: [[String(incidents.length), "篇事故報告", "Incident reports"]],
  });
}
