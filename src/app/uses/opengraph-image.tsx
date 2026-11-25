import { pageCardImage } from "@/lib/site/og-card";

// 這頁的分享圖（TODO B7）；版面在 lib/site/og-card.tsx
export const alt = "PINGWEI LI · Uses";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return pageCardImage({
    eyebrow: "開発環境 · Uses",
    eyebrowEn: "Uses",
    title: "我用的工具",
    titleEn: "What I use",
    description: "開発環境、硬體、軟體跟日常工具清單。",
    descriptionEn: "Hardware, software and tools I use every day.",
  });
}
