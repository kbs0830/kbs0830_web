import { markdownPaths, renderMarkdown } from "@/lib/markdown";
import { SITE_URL } from "@/lib/site";

// 「Markdown for Agents」的出口，說明見 lib/markdown.ts。訪客不會直接打這裡：
// next.config.ts 的 rewrites 把 `Accept: text/markdown` 的請求、以及 `xxx.md` 網址轉過來。
// build 時全部預先產生（跟頁面一樣是靜態的），不存在的路徑直接 404。
export const dynamicParams = false;

export function generateStaticParams() {
  return markdownPaths().map((p) => ({ path: p ? p.split("/") : [] }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ path?: string[] }> }) {
  const path = ((await params).path ?? []).join("/");
  const body = renderMarkdown(path);
  if (body === null) return new Response("Not Found", { status: 404 });

  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      // 同一個網址依 Accept 回 HTML 或 Markdown，快取要分開存
      Vary: "Accept",
      // 告訴搜尋引擎正本是 HTML 那頁，Markdown 版不要當成重複內容
      // header 只能 ASCII：中文 tag 頁（/blog/tags/隱私）要先 encodeURI
      Link: `<${SITE_URL}${path ? `/${encodeURI(path)}` : "/"}>; rel="canonical"`,
    },
  });
}
