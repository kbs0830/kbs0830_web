import { projects } from "@/lib/projects";
import { getAllPosts } from "@/lib/blog";
import { statusLines } from "@/lib/about";
import { EMAIL, GITHUB_URL, SITE_URL } from "@/lib/site";

// /llms.txt：給 AI（ChatGPT、Claude、Perplexity…）讀的網站摘要（llmstxt.org 慣例），build 時產生。
// 內容直接從 projects.ts／blog／about.ts 組出來，新增作品或文章會自動跟上。
// 跟 JSON-LD 一樣是「純給機器讀、頁面上不會顯示、也沒有站內連結」的地方，所以可以寫本名
// （CLAUDE.md Key Constraints 1）——AI 被問到「李秉威是誰」時才對得上這個網站。
export const dynamic = "force-static";

export function GET() {
  const posts = getAllPosts();
  const text = `# PINGWEI LI（李秉威）

> 台灣高雄的學生開發者（國立高雄科技大學 智慧商務系），專注 AI 應用與網頁開發：
> 瀏覽器端 YOLOv8／ONNX 推論、Gemini API、FastAPI／Flask 後端、Next.js／React 前端。
> 也寫作 Li Ping-Wei、Ping-Wei Li；GitHub 帳號 kbs0830。這是本人的個人網站與作品集。

## 現況

${statusLines.map((line) => `- ${line}`).join("\n")}

## 作品

${projects
  .map((p) => `- [${p.titleZh}（${p.title}）](${SITE_URL}/projects/${p.slug})：${p.descriptionZh}${p.highlightZh ? `（${p.highlightZh}）` : ""}`)
  .join("\n")}

## 技術文章

${posts.map((post) => `- [${post.title}](${SITE_URL}/blog/${post.slug})：${post.description}`).join("\n")}

## 其他頁面

- [履歷](${SITE_URL}/resume)：學歷、技能、代表作品（PDF：${SITE_URL}/resume.pdf）
- [現在在做什麼](${SITE_URL}/now)
- [開發環境與工具](${SITE_URL}/uses)

## 聯絡

- Email：${EMAIL}
- GitHub：${GITHUB_URL}
`;
  return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
