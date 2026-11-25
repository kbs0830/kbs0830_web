import { pageCardImage } from "@/lib/site/og-card";
import { readChangelog } from "@/lib/ops/changelog";

// 這頁的分享圖（TODO B7）；版面在 lib/site/og-card.tsx
export const alt = "PINGWEI LI · 更新紀錄";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const entries = readChangelog();
  return pageCardImage({
    eyebrow: "更新紀錄 · Changelog",
    eyebrowEn: "Changelog",
    title: "更新紀錄",
    titleEn: "Changelog",
    description: "這個網站加過哪些功能，從 git 紀錄自動產生。",
    descriptionEn: "Every feature added to this site, generated from git.",
    stats: entries.length
      ? [
          [String(entries.length), "項新功能", "Features"],
          [entries[0].date, "最近一次", "Latest"],
        ]
      : [],
  });
}
