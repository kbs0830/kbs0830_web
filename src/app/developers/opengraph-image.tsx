import { pageCardImage } from "@/lib/site/og-card";
import { TOOLS } from "@/lib/api/mcp";
import { API_ENDPOINTS } from "@/lib/api/public-api";

// 這頁的分享圖（版面在 lib/site/og-card.tsx）
export const alt = "PINGWEI LI · 開發者 API & MCP";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return pageCardImage({
    eyebrow: "開發者 · Developers",
    eyebrowEn: "Developers",
    title: "API ＆ MCP",
    titleEn: "Public API and MCP server",
    description: "作品、文章、現況，用程式讀、或讓 AI 助理直接查。",
    descriptionEn: "Read projects and posts as JSON, or let an AI assistant query them.",
    stats: [
      [String(API_ENDPOINTS.length), "個 API 端點", "API endpoints"],
      [String(TOOLS.length), "個 MCP 工具", "MCP tools"],
    ],
  });
}
