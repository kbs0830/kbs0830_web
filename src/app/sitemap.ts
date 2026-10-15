import { MetadataRoute } from "next";
import { projects } from "@/lib/projects";
import { getAllPosts } from "@/lib/blog";

// lastModified 只給有真實日期的頁面（blog 文章的 frontmatter date）。
// 原本每頁都填 new Date()，等於每次 build 都告訴 Google「全站剛改過」；
// Google 發現 lastmod 不可信之後會整份忽略，不如不填。
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://kbs0830.com",
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: "https://kbs0830.com/now",
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: "https://kbs0830.com/uses",
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: "https://kbs0830.com/resume",
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: "https://kbs0830.com/blog",
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...projects.map((p) => ({
      url: `https://kbs0830.com/projects/${p.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...getAllPosts().map((post) => ({
      url: `https://kbs0830.com/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
