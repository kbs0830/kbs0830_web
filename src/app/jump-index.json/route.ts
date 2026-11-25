import { getAllPosts } from "@/lib/content/blog";
import { projects } from "@/lib/content/projects";
import type { JumpItem } from "@/lib/site/site-map";

// Ctrl+K 快速跳轉的作品＋文章清單：build 時產生，第一次打開快速跳轉才下載（頁面清單直接編在 client 裡，不用等這個）。
// 不放進 layout 的 props：那樣每一頁的 HTML 都會多帶一份，force-dynamic 的頁面每次請求還要重讀一次文章。
export const dynamic = "force-static";

export function GET() {
  const index: { projects: JumpItem[]; posts: JumpItem[] } = {
    projects: projects.map((p) => ({
      href: `/projects/${p.slug}`,
      title: p.titleZh,
      sub: p.title,
      keywords: `${p.titleJa} ${p.tags.join(" ")} ${p.status}`,
    })),
    posts: getAllPosts().map((p) => ({
      href: `/blog/${p.slug}`,
      title: p.title,
      sub: p.date,
      keywords: `${p.titleEn} ${p.tags.join(" ")} ${p.series ?? ""}`,
    })),
  };
  return Response.json(index, { headers: { "Cache-Control": "public, max-age=3600" } });
}
