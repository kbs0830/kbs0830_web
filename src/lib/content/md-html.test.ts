import { describe, expect, it } from "vitest";
import { inline, markdownToHtml } from "@/lib/content/md-html";
import { getAllPosts } from "@/lib/content/blog";

describe("Markdown → HTML（RSS 全文）", () => {
  it("行內：程式碼不處理、粗體、連結、跳脫 HTML", () => {
    expect(inline("用 `<Settings>` 跟 **粗體** 還有 <b>")).toBe("用 <code>&lt;Settings&gt;</code> 跟 <strong>粗體</strong> 還有 &lt;b&gt;");
    expect(inline("[文章](/blog/x) [外站](https://a.com)")).toBe('<a href="https://kbs0830.com/blog/x">文章</a> <a href="https://a.com">外站</a>');
    expect(inline("[怪](javascript:alert(1))")).not.toContain("javascript:");
    expect(inline("**1037 筆 `XX`**")).toBe("<strong>1037 筆 <code>XX</code></strong>");
  });

  it("區塊：標題、段落合併、清單、編號清單、引用、程式碼", () => {
    const html = markdownToHtml(
      ["## 標題", "", "第一行", "第二行", "", "- a", "- b", "", "1. x", "2. y", "", "> 引用", "", "```powershell", "# 不是標題 <x>", "```"].join("\n"),
    );
    expect(html).toBe(
      [
        "<h3>標題</h3>",
        "<p>第一行 第二行</p>",
        "<ul><li>a</li><li>b</li></ul>",
        "<ol><li>x</li><li>y</li></ol>",
        "<blockquote><p>引用</p></blockquote>",
        '<pre><code class="language-powershell"># 不是標題 &lt;x&gt;</code></pre>',
      ].join("\n"),
    );
  });

  it("每篇真的文章都轉得出來：沒有沒轉到的 Markdown 標記、沒有裸露的 <", () => {
    for (const p of getAllPosts()) {
      const html = markdownToHtml(p.content);
      expect(html.length, p.slug).toBeGreaterThan(500);
      const text = html.replace(/<pre>[\s\S]*?<\/pre>/g, "").replace(/<code>[\s\S]*?<\/code>/g, "");
      expect(text, p.slug).not.toMatch(/^#{1,4} |\*\*|```/m);
      expect(text.replace(/<\/?(p|h[2-4]|ul|ol|li|strong|a|blockquote|code|pre)( [^>]*)?>/g, ""), p.slug).not.toContain("<");
    }
  });
});
