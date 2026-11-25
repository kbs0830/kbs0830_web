// 文章 Markdown → HTML，給 RSS 全文用（TODO A6，2026-11-21）。
// 只支援文章實際用到的語法：標題、段落、清單（- 跟 1.）、引用、程式碼區塊、行內程式碼、粗體、連結。
// 不用 remark／MDX：那是 next-mdx-remote 的間接依賴，pnpm 下不能直接 import；裝新套件又要在正式站目錄 pnpm install（會停站）。
// 文章是自己寫的、沒有 JSX 元件；之後文章用到新語法（表格、圖片），這裡要跟著補，md-html.test.ts 有每篇都轉得出來的檢查。

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** 行內：`code`、**粗體**、[文字](網址)。程式碼裡的東西不再處理 */
export function inline(text: string): string {
  // 程式碼先換成佔位符：粗體裡面可能包著程式碼（**1037 筆 `XX`**），先切開的話粗體會斷掉
  const codes: string[] = [];
  const masked = text.replace(/`([^`]+)`/g, (_m, code: string) => `\u0000${codes.push(code) - 1}\u0000`);
  return escapeHtml(masked)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label: string, href: string) => {
      // 站內連結補成完整網址（RSS 閱讀器不知道網站在哪）；只允許 http(s) 跟 /
      const url = href.startsWith("/") ? `https://kbs0830.com${href}` : /^https?:\/\//.test(href) ? href : "#";
      return `<a href="${url}">${label}</a>`;
    })
    .replace(/\u0000(\d+)\u0000/g, (_m, i: string) => `<code>${escapeHtml(codes[Number(i)])}</code>`);
}

export function markdownToHtml(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let para: string[] = [];
  let list: { tag: "ul" | "ol"; items: string[] } | null = null;
  let quote: string[] = [];

  const flushPara = () => {
    if (para.length) out.push(`<p>${inline(para.join(" "))}</p>`);
    para = [];
  };
  const flushList = () => {
    if (list) out.push(`<${list.tag}>${list.items.map((i) => `<li>${inline(i)}</li>`).join("")}</${list.tag}>`);
    list = null;
  };
  const flushQuote = () => {
    if (quote.length) out.push(`<blockquote><p>${inline(quote.join(" "))}</p></blockquote>`);
    quote = [];
  };
  const flushAll = () => {
    flushPara();
    flushList();
    flushQuote();
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fence = /^```(\S*)/.exec(line);
    if (fence) {
      flushAll();
      const code: string[] = [];
      for (i++; i < lines.length && !/^```/.test(lines[i]); i++) code.push(lines[i]);
      const cls = fence[1] ? ` class="language-${escapeHtml(fence[1])}"` : "";
      out.push(`<pre><code${cls}>${escapeHtml(code.join("\n"))}</code></pre>`);
      continue;
    }
    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      flushAll();
      const level = Math.min(heading[1].length + 1, 4); // 文章的 ## 在 RSS 裡當 h3（h2 留給文章標題）
      out.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      continue;
    }
    const ul = /^[-*]\s+(.*)$/.exec(line);
    const ol = /^\d+\.\s+(.*)$/.exec(line);
    if (ul || ol) {
      flushPara();
      flushQuote();
      const tag = ul ? "ul" : "ol";
      if (!list || list.tag !== tag) {
        flushList();
        list = { tag, items: [] };
      }
      list.items.push((ul ?? ol)![1]);
      continue;
    }
    const q = /^>\s?(.*)$/.exec(line);
    if (q) {
      flushPara();
      flushList();
      quote.push(q[1]);
      continue;
    }
    if (!line.trim()) {
      flushAll();
      continue;
    }
    // 清單項目換行接續（縮排的下一行）
    if (list && /^\s+\S/.test(line)) {
      list.items[list.items.length - 1] += ` ${line.trim()}`;
      continue;
    }
    flushList();
    flushQuote();
    para.push(line.trim());
  }
  flushAll();
  return out.join("\n");
}
