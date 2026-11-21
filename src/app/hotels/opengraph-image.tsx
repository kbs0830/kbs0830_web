import { pageCardImage } from "@/lib/og-card";
import { hotelStats } from "@/lib/hotels";

// 這頁的分享圖（TODO B7）；版面在 lib/og-card.tsx
export const alt = "PINGWEI LI · 住宿紀錄";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const s = hotelStats();
  return pageCardImage({
    eyebrow: "住宿紀錄 · Hotel Log",
    eyebrowEn: "Hotel Log",
    title: "住宿紀錄",
    titleEn: "Hotel Log",
    description: "住過的飯店、城市跟飯店集團。",
    descriptionEn: "Hotels, cities and hotel groups I have stayed with.",
    stats: [
      [String(s.hotels), "飯店", "Hotels"],
      [String(s.cities), "城市", "Cities"],
      [String(s.countries), "國家／地區", "Countries"],
    ],
  });
}
