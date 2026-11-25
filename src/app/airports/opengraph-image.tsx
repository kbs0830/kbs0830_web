import { pageCardImage } from "@/lib/site/og-card";

// 這頁的分享圖（版面在 lib/site/og-card.tsx）。即時航班不放進圖裡（圖會停在 build 那一刻）
export const alt = "PINGWEI LI · 機場時刻表";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return pageCardImage({
    eyebrow: "機場時刻表 · Airport Boards",
    eyebrowEn: "Airport Boards",
    title: "小港 ⇄ 福岡",
    titleEn: "Kaohsiung ⇄ Fukuoka",
    description: "兩個機場的即時航班看板，每 3 分鐘更新。",
    descriptionEn: "Live departures and arrivals at KHH and FUK.",
  });
}
