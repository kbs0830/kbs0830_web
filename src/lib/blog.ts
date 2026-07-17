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
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return getAllPosts().find((p) => p.slug === slug);
}
