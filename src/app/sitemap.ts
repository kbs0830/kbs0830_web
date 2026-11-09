import { MetadataRoute } from "next";
import { projects } from "@/lib/projects";
import { getAllPosts } from "@/lib/blog";
import { SITE_URL } from "@/lib/site";

type Entry = MetadataRoute.Sitemap[number];
const page = (path: string, changeFrequency: Entry["changeFrequency"], priority: number, lastModified?: Date): Entry => ({
  url: `${SITE_URL}${path}`,
  changeFrequency,
  priority,
  ...(lastModified && { lastModified }),
});

// lastModified 只給有真實日期的頁面（blog 文章的 frontmatter date）。
// 原本每頁都填 new Date()，等於每次 build 都告訴 Google「全站剛改過」；
// Google 發現 lastmod 不可信之後會整份忽略，不如不填。
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    page("", "monthly", 1),
    page("/now", "weekly", 0.6),
    page("/uses", "monthly", 0.5),
    page("/resume", "monthly", 0.6),
    page("/blog", "weekly", 0.8),
    page("/flights", "monthly", 0.3),
    page("/hotels", "monthly", 0.3),
    page("/stats", "daily", 0.3),
    ...projects.map((p) => page(`/projects/${p.slug}`, "monthly", 0.7)),
    ...getAllPosts().map((post) => page(`/blog/${post.slug}`, "monthly", 0.6, new Date(post.date))),
  ];
}
