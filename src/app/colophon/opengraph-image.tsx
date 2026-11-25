import { pageCardImage } from "@/lib/site/og-card";

// 這頁的分享圖（版面在 lib/site/og-card.tsx）。即時數字不放（圖是 build 時產生的）
export const alt = "PINGWEI LI · 本站構造";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return pageCardImage({
    eyebrow: "本站構造 · Colophon",
    eyebrowEn: "Colophon",
    title: "本站構造",
    titleEn: "How this site runs",
    description: "跑在家裡桌機上的網站：Cloudflare、Tunnel、雙槽部署、watchdog、備份。",
    descriptionEn: "A site self-hosted on a home desktop, end to end.",
  });
}
