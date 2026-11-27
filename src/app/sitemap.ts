import { MetadataRoute } from "next";
import { projects } from "@/lib/content/projects";
import { getAllPosts } from "@/lib/content/blog";
import { HIRE_ENABLED, SITE_URL } from "@/lib/site/site";
import { TOOL_PAGES } from "@/lib/site/site-map";
import { allRouteSlugs } from "@/lib/tools/popular-routes";
import { MONTHS } from "@/lib/travel/fukuoka-climate";

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
    page("/ask", "monthly", 0.5),
    ...(HIRE_ENABLED ? [page("/hire", "monthly", 0.6)] : []),
    page("/resume", "monthly", 0.6),
    page("/blog", "weekly", 0.8),
    page("/flights", "monthly", 0.3),
    page("/hotels", "monthly", 0.3),
    page("/travel", "monthly", 0.4),
    page("/stats", "daily", 0.3),
    page("/radar", "daily", 0.5),
    page("/radar/zukan", "daily", 0.5),
    page("/airports", "hourly", 0.4),
    page("/changelog", "weekly", 0.4),
    page("/status", "daily", 0.4),
    page("/colophon", "weekly", 0.5),
    page("/developers", "monthly", 0.4),
    page("/tools", "monthly", 0.6),
    // 工具清單跟 /tools、Ctrl+K 共用 site-map.ts 的 TOOL_PAGES（2026-11-25 之前這裡另外手寫一份）
    ...TOOL_PAGES.map((t) => page(t.href, "weekly", 0.6)),
    // 熱門航線距離頁 30 頁（TODO V3，/tools/airport-distance/tpe-fuk）
    ...allRouteSlugs().map((s) => page(`/tools/airport-distance/${s}`, "monthly", 0.5)),
    // 福岡每月穿搭 12 頁（TODO V2，/tools/fukuoka-weather/3）
    ...MONTHS.map((m) => page(`/tools/fukuoka-weather/${m}`, "monthly", 0.5)),
    ...projects.map((p) => page(`/projects/${p.slug}`, "monthly", 0.7)),
    ...getAllPosts().map((post) => page(`/blog/${post.slug}`, "monthly", 0.6, new Date(post.date))),
    // tag 頁 noindex（2026-11-12，見 app/blog/tags/[tag]/page.tsx），不列
  ];
}
