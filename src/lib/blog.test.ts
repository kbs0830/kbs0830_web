import { describe, expect, it } from "vitest";
import { getAllPosts, getPostBySlug } from "./blog";

// 對著 content/blog/*.mdx 真實文章跑，不 mock fs——三篇文章目前 date 都相同
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
