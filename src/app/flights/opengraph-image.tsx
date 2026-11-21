import { pageCardImage } from "@/lib/og-card";
import { flightStats } from "@/lib/flights";

// 這頁的分享圖（TODO B7）；版面在 lib/og-card.tsx
export const alt = "PINGWEI LI · 飛行紀錄";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const s = flightStats();
  const nf = new Intl.NumberFormat("en-US");
  return pageCardImage({
    eyebrow: "飛行紀錄 · Flight Log",
    eyebrowEn: "Flight Log",
    title: "飛行紀錄",
    titleEn: "Flight Log",
    description: "航迷小筆記：搭過的航線、機場跟航空公司。",
    descriptionEn: "Routes, airports and airlines I have flown.",
    stats: [
      [nf.format(s.flights), "航班", "Flights"],
      [nf.format(s.airports), "機場", "Airports"],
      [nf.format(s.airlines.length), "航空公司", "Airlines"],
      [`${nf.format(s.km)} km`, `繞地球 ${s.earthLaps.toFixed(1)} 圈`, `${s.earthLaps.toFixed(1)}× around Earth`],
    ],
  });
}
