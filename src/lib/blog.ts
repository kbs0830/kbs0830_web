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
