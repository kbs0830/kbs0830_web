import { SITE_GROUPS, TOOL_PAGES } from "./site-map";
import { projects } from "@/lib/content/projects";
import { getAllPosts } from "@/lib/content/blog";

// 路徑 → 看得懂的頁名（/stats、/reports 的熱門頁面用）。2026-11-25 從 stats 頁抽出來：原本手寫一張 PAGE_NAMES，
// 跟 site-map.ts 重複維護、新加的工具頁都沒列到。現在一般頁面直接用 site-map 的中文名，作品、文章查資料。
// 會讀文章（fs），只能在伺服器用；site-map.ts 本身 client 也在用，所以分開放。

const NAMES = new Map<string, string>([
  ["/", "首頁"],
  ...[...SITE_GROUPS.flatMap((g) => g.pages), ...TOOL_PAGES].map((p): [string, string] => [p.href, p.zh]),
]);

export function pageTitle(path: string): string {
  const known = NAMES.get(path);
  if (known) return known;
  const [, section, slug, rest] = path.split("/");
  if (section === "projects") return projects.find((p) => p.slug === slug)?.titleZh ?? path;
  if (section === "blog" && slug === "tags" && rest) return `標籤：${rest}`;
  if (section === "blog") return getAllPosts().find((p) => p.slug === slug)?.title ?? path;
  return path;
}
