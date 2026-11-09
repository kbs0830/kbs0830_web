import { describe, expect, it } from "vitest";
import { getAllPosts, getPostBySlug } from "./blog";

// 對著 content/blog/*.mdx 真實文章跑，不 mock fs——最早三篇文章 date 都相同
// （2026-07-17），正好覆蓋到 blog.ts 排序 comparator 對「相同日期」處理不嚴謹
// 那次修正（改用 localeCompare 前会把其中一篇排到不一致的位置）。

describe("getAllPosts", () => {
  it("回傳所有文章，依 date 由新到舊排序（相同日期也不能反過來）", () => {
    const posts = getAllPosts();
    expect(posts.length).toBeGreaterThan(0);
    for (let i = 1; i < posts.length; i++) {
      expect(posts[i - 1].date >= posts[i].date).toBe(true);
    }
  });

  it("每篇文章的 frontmatter 欄位都完整解析出來", () => {
    for (const post of getAllPosts()) {
      expect(post.slug).toBeTruthy();
      expect(post.title).toBeTruthy();
      expect(post.titleEn).toBeTruthy();
      expect(post.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(post.description).toBeTruthy();
      expect(Array.isArray(post.tags)).toBe(true);
    }
  });
});

describe("getPostBySlug", () => {
  it("找得到存在的 slug", () => {
    const [first] = getAllPosts();
    expect(getPostBySlug(first.slug)?.slug).toBe(first.slug);
  });

  it("找不到的 slug 回傳 undefined，不會丟例外", () => {
    expect(getPostBySlug("not-a-real-slug")).toBeUndefined();
  });
});

describe("readingMinutes", () => {
  it("中文約 400 字一分鐘、程式碼區塊不算、最少 1 分鐘", async () => {
    const { readingMinutes } = await import("./blog");
    expect(readingMinutes("字".repeat(800))).toBe(2);
    expect(readingMinutes("字".repeat(400) + "\n```ts\n" + "x ".repeat(5000) + "\n```")).toBe(1);
    expect(readingMinutes("短")).toBe(1);
  });
});

describe("系列文、上一篇／下一篇、相關文章、tag、目錄（2026-11-09）", () => {
  it("自架網站維運系列 5 篇，依 seriesOrder 1～5 排", async () => {
    const { getSeriesPosts } = await import("./blog");
    const s = getSeriesPosts("自架網站維運");
    expect(s.map((p) => p.seriesOrder)).toEqual([1, 2, 3, 4, 5]);
    expect(s[0].slug).toBe("task-scheduler-72-hours");
  });

  it("上一篇＝比較舊、下一篇＝比較新；最新那篇沒有下一篇", async () => {
    const { getAdjacentPosts } = await import("./blog");
    const posts = getAllPosts();
    expect(getAdjacentPosts(posts[0].slug).newer).toBeUndefined();
    expect(getAdjacentPosts(posts[0].slug).older?.slug).toBe(posts[1].slug);
    expect(getAdjacentPosts(posts.at(-1)!.slug).older).toBeUndefined();
    expect(getAdjacentPosts("沒有這篇")).toEqual({});
  });

  it("相關文章：至少一個共同 tag、不含自己跟同系列", async () => {
    const { getRelatedPosts } = await import("./blog");
    const post = getPostBySlug("task-scheduler-72-hours")!;
    const related = getRelatedPosts(post);
    expect(related.length).toBeGreaterThan(0);
    for (const r of related) {
      expect(r.slug).not.toBe(post.slug);
      expect(r.series).not.toBe(post.series);
      expect(r.tags.some((t) => post.tags.includes(t))).toBe(true);
    }
  });

  it("tag 網址：Next.js → next-js（結尾不會像 .js 檔），每個 tag 都找得回文章", async () => {
    const { getAllTags, getPostsByTagSlug, tagSlug } = await import("./blog");
    expect(tagSlug("Next.js")).toBe("next-js");
    // 網址只能英數字：中文 tag 上線後 404（見 blog.ts 的 TAG_SLUGS），新增中文 tag 沒加對照表這裡會擋
    for (const t of getAllTags()) expect(t.slug, t.tag).toMatch(/^[a-z0-9-]+$/);
    for (const t of getAllTags()) expect(getPostsByTagSlug(t.slug)?.posts.length).toBe(t.count);
    expect(getPostsByTagSlug("沒有這個")).toBeUndefined();
  });

  it("目錄只抓 ##，程式碼區塊裡的 # 不算；id 跟 MDX 的 h2 同一個規則", async () => {
    const { getHeadings, headingId } = await import("./blog");
    const md = "## 第一段：原因\n內容\n```bash\n## 這是註解\n```\n### 小小標\n## Step 2 (fix)";
    expect(getHeadings(md)).toEqual([
      { text: "第一段：原因", id: headingId("第一段：原因") },
      { text: "Step 2 (fix)", id: "step-2-fix" },
    ]);
    expect(headingId("第一段：原因")).toBe("第一段-原因");
  });
});
