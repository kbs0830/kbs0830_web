import { pageCardImage } from "@/lib/site/og-card";

// 這頁的分享圖（TODO B7）；版面在 lib/site/og-card.tsx
export const alt = "PINGWEI LI · Now";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return pageCardImage({
    eyebrow: "現在 · Now",
    eyebrowEn: "Now",
    title: "現在在做什麼",
    titleEn: "What I'm doing now",
    description: "現在在忙的、在學的，會不定期更新。",
    descriptionEn: "What I'm working on and learning at the moment.",
  });
}
