import { pageCardImage } from "@/lib/og-card";

// 這頁的分享圖（TODO B7）；版面在 lib/og-card.tsx
export const alt = "PINGWEI LI · 自家雷達";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return pageCardImage({
    eyebrow: "自家雷達 · My Radar",
    eyebrowEn: "My Radar",
    title: "自家雷達",
    titleEn: "Home ADS-B Receiver",
    description: "自己架的 ADS-B 接收器（樹莓派＋SDR），即時看現在收到幾架飛機。",
    descriptionEn: "A Raspberry Pi + SDR receiver feeding Flightradar24, live.",
  });
}
