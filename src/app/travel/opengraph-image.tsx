import { pageCardImage } from "@/lib/og-card";
import { travelStats } from "@/lib/travel";

// 這頁的分享圖（版面在 lib/og-card.tsx）
export const alt = "PINGWEI LI · 旅行地球";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const s = travelStats();
  const nf = new Intl.NumberFormat("en-US");
  return pageCardImage({
    eyebrow: "旅行地球 · Travel",
    eyebrowEn: "Travel",
    title: "旅行地球",
    titleEn: "Travel globe",
    description: "搭過的航線跟住過的城市，畫在同一顆地球上。",
    descriptionEn: "Flights and stays on one globe.",
    stats: [
      [nf.format(s.flights), "航班", "Flights"],
      [nf.format(s.hotels), "飯店", "Hotels"],
      [String(s.places), "地點", "Places"],
      [String(s.countries), "國家地區", "Countries"],
    ],
  });
}
