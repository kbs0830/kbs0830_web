import type { Route } from "next";

// 文章 ↔ 工具互相連結（TODO V8，2026-11-27）：文章解釋「為什麼」、工具直接幫你修，兩邊其實是同一件事。
// 互相連結對 Google 判斷主題、對訪客都有幫助。文章頁最後列「相關工具」、工具頁最後列「相關記事」（RelatedLinks.tsx）。
// 只列真的有關的；新增文章或工具時在這裡加一行。key 是文章 slug，value 是工具網址（要在 lib/site/site-map.ts 的 TOOL_PAGES 裡）。
export const POST_TOOLS: Record<string, Route[]> = {
  "tailwind-v4-bracket-var": ["/tools/tailwind-v4-vars"],
  "task-scheduler-72-hours": ["/tools/ps1-encoding"],
  "visitor-stats-bot-pollution": ["/tools/user-agent", "/tools/ai-crawlers"],
  "ci-polluted-stats": ["/tools/user-agent", "/tools/ai-crawlers"],
  "tunnel-down-four-days": ["/tools/power-cost"],
  "vscode-locks-next": ["/tools/power-cost"],
};

export const toolsForPost = (slug: string): Route[] => POST_TOOLS[slug] ?? [];

export const postsForTool = (href: string): string[] =>
  Object.entries(POST_TOOLS)
    .filter(([, tools]) => tools.includes(href as Route))
    .map(([slug]) => slug);
