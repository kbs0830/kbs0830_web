import fs from "fs";
import path from "path";
import matter from "gray-matter";

export interface BlogPost {
  slug: string;
  title: string;
  titleEn: string;
  date: string;
  description: string;
  tags: string[];
  /** 系列名稱（frontmatter `series`）跟第幾篇（`seriesOrder`），沒有就不是系列文 */
  series?: string;
  seriesOrder?: number;
  content: string;
}

const blogDir = path.join(process.cwd(), "content", "blog");

export function getAllPosts(): BlogPost[] {
  const files = fs.readdirSync(blogDir).filter((f) => f.endsWith(".mdx"));

  return files
    .map((file) => {
      const raw = fs.readFileSync(path.join(blogDir, file), "utf8");
      const { data, content } = matter(raw);
      return {
        slug: file.replace(/\.mdx$/, ""),
        title: data.title as string,
        titleEn: data.titleEn as string,
        date: data.date as string,
        description: data.description as string,
        tags: (data.tags as string[]) ?? [],
        ...(data.series ? { series: String(data.series), seriesOrder: Number(data.seriesOrder) || 0 } : {}),
        content,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return getAllPosts().find((p) => p.slug === slug);
}

/** 估計閱讀時間（分鐘）：中日文字一分鐘約 400 字、英文單字約 200 個，程式碼區塊不算 */
export function readingMinutes(content: string): number {
  const CJK = /[぀-ヿ㐀-鿿]/g; // 平假名・片假名・漢字
  const text = content.replace(/```[\s\S]*?```/g, "");
  const cjk = (text.match(CJK) ?? []).length;
  const words = (text.replace(CJK, " ").match(/[A-Za-z0-9_]+/g) ?? []).length;
  return Math.max(1, Math.round(cjk / 400 + words / 200));
}

/** 上一篇（比較舊）／下一篇（比較新），依日期排 */
export function getAdjacentPosts(slug: string): { older?: BlogPost; newer?: BlogPost } {
  const posts = getAllPosts(); // 新的在前
  const i = posts.findIndex((p) => p.slug === slug);
  if (i < 0) return {};
  return { newer: posts[i - 1], older: posts[i + 1] };
}

/** 相關文章：共同 tag 越多越前面，一樣多就新的在前；同系列的已經在系列導覽裡，不重複列 */
export function getRelatedPosts(post: BlogPost, limit = 3): BlogPost[] {
  return getAllPosts()
    .filter((p) => p.slug !== post.slug && !(post.series && p.series === post.series))
    .map((p) => ({ p, shared: p.tags.filter((t) => post.tags.includes(t)).length }))
    .filter(({ shared }) => shared > 0)
    .sort((a, b) => b.shared - a.shared || b.p.date.localeCompare(a.p.date))
    .slice(0, limit)
    .map(({ p }) => p);
}

/** 同一個系列的全部文章，依 seriesOrder 排 */
export function getSeriesPosts(series: string): BlogPost[] {
  return getAllPosts()
    .filter((p) => p.series === series)
    .sort((a, b) => (a.seriesOrder ?? 0) - (b.seriesOrder ?? 0));
}

// 中文 tag 的網址：網址片段一定要是英數字。2026-11-09 第一版直接用「隱私」，Next 預先產生的頁面跟瀏覽器送來的
// 編碼網址（%E9%9A%B1…）對不上，上線後 404（Markdown 版還因為 header 不能有中文 build 失敗）。新增中文 tag 要加在這裡
const TAG_SLUGS: Record<string, string> = { 隱私: "privacy" };

/** tag 的網址片段：小寫、空白跟「.」換成「-」（`Next.js` → `next-js`，網址結尾才不會像 .js 檔）；中文查表 */
export function tagSlug(tag: string): string {
  return TAG_SLUGS[tag] ?? tag.toLowerCase().replace(/[\s.]+/g, "-");
}

/** 全部 tag 跟文章數，多的在前 */
export function getAllTags(): { tag: string; slug: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const t of getAllPosts().flatMap((p) => p.tags)) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts]
    .map(([tag, count]) => ({ tag, slug: tagSlug(tag), count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, "en"));
}

export function getPostsByTagSlug(slug: string): { tag: string; posts: BlogPost[] } | undefined {
  const tag = getAllTags().find((t) => t.slug === slug)?.tag;
  return tag ? { tag, posts: getAllPosts().filter((p) => p.tags.includes(tag)) } : undefined;
}

/** 文章小標（## 開頭）的 id：MDX 的 h2 跟目錄用同一個規則產生，連結才對得上 */
export function headingId(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[`*_~]/g, "")
    .replace(/[\s/：:，,、。.?？!！()（）「」『』]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** 目錄：文章裡的 ## 小標（程式碼區塊裡的 # 不算） */
export function getHeadings(content: string): { text: string; id: string }[] {
  return content
    .replace(/```[\s\S]*?```/g, "")
    .split(/\r?\n/)
    .filter((line) => /^## /.test(line))
    .map((line) => {
      const text = line.replace(/^## /, "").replace(/[`*]/g, "").trim();
      return { text, id: headingId(text) };
    });
}
