import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PINGWEI LI — Portfolio",
    short_name: "PINGWEI LI",
    description: "高雄出身的學生開発者，專注於 AI 工具應用與網頁開發。",
    start_url: "/",
    display: "standalone",
    background_color: "#fafaf8",
    theme_color: "#2d5a8e",
    lang: "zh-Hant",
    icons: [
      { src: "/icon/192", sizes: "192x192", type: "image/png" },
      { src: "/icon/512", sizes: "512x512", type: "image/png" },
    ],
  };
}
