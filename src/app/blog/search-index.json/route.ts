import { getAllPosts } from "@/lib/content/blog";
import { plainText, type IndexedPost } from "@/lib/content/blog-search";

// 部落格搜尋索引（TODO A6）：build 時產生，/blog 的搜尋框第一次用到才下載。說明見 lib/content/blog-search.ts

export function GET() {
  const index: IndexedPost[] = getAllPosts().map((p) => ({
    slug: p.slug,
    title: p.title,
    titleEn: p.titleEn,
    date: p.date,
    tags: p.tags,
    description: p.description,
    text: plainText(p.content),
  }));
  return Response.json(index, { headers: { "Cache-Control": "public, max-age=3600" } });
}
