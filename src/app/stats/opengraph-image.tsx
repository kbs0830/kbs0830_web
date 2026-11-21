import { pageCardImage } from "@/lib/og-card";

// 這頁的分享圖（TODO B7）；版面在 lib/og-card.tsx
export const alt = "PINGWEI LI · 訪客分析";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return pageCardImage({
    eyebrow: "訪客分析 · Analytics",
    eyebrowEn: "Analytics",
    title: "訪客分析",
    titleEn: "Site Analytics",
    description: "這個自架網站的流量：每天多少人、看哪些頁、從哪裡來，還有 AI 爬蟲。",
    descriptionEn: "Traffic of this self-hosted site, including AI crawlers.",
  });
}
