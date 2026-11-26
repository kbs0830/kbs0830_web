// 公開 JSON API（/api/v1，TODO A10）跟 MCP 伺服器（/mcp，TODO A9）共用的資料（2026-11-21）。
// 只放網站上本來就公開的內容，來源跟頁面／Markdown 版同一份（projects.ts、blog.ts、page-content.ts、flights.ts），不另外維護。
// 名字只用 PINGWEI LI：本名只放在 JSON-LD／llms.txt／Markdown 版（CLAUDE.md Key Constraints 1），API 不需要。
import { projects, type Project } from "@/lib/content/projects";
import { getAllPosts, getPostBySlug, readingMinutes, type BlogPost } from "@/lib/content/blog";
import { nowItems } from "@/lib/content/page-content";
import { statusLines } from "@/lib/content/about";
import { AIRLINES, AIRPORTS, flightStats, routes } from "@/lib/travel/flights";
import { GITHUB_URL, SITE_URL } from "@/lib/site/site";

export const API_BASE = `${SITE_URL}/api/v1`;

/** 端點一覽（/developers 頁跟 Markdown 版共用） */
export const API_ENDPOINTS: [path: string, desc: string][] = [
  ["/profile", "簡介：身分、所在地、專長、現況、連結"],
  ["/projects", "全部作品（個人專案＋課程專題）"],
  ["/projects/{slug}", "單一作品，含架構、做了什麼"],
  ["/posts", "全部文章（不含全文）"],
  ["/posts/{slug}", "單篇文章，含全文（MDX）"],
  ["/now", "現在在做什麼"],
  ["/flights", "飛行紀錄統計（航線、機場、航空公司，沒有日期）"],
  ["/openapi.json", "OpenAPI 3.1 規格"],
];

interface ApiProject {
  slug: string;
  title: string;
  titleZh: string;
  description: string;
  descriptionZh: string;
  highlightZh: string;
  tags: string[];
  status: Project["status"];
  kind: "personal" | "course";
  url: string;
  github: string | null;
}

interface ApiProjectDetail extends ApiProject {
  intro: string | null;
  sections: { heading: string; headingEn: string | null; items: string[] }[];
  context: string | null;
  image: string | null;
}

interface ApiPost {
  slug: string;
  title: string;
  titleEn: string;
  date: string;
  description: string;
  tags: string[];
  series: string | null;
  readingMinutes: number;
  url: string;
  markdownUrl: string;
}

const projectSummary = (p: Project): ApiProject => ({
  slug: p.slug,
  title: p.title,
  titleZh: p.titleZh,
  description: p.description,
  descriptionZh: p.descriptionZh,
  highlightZh: p.highlightZh,
  tags: p.tags,
  status: p.status,
  kind: p.isPersonal ? "personal" : "course",
  url: `${SITE_URL}/projects/${p.slug}`,
  github: p.github ?? null,
});

export function apiProjects(tag?: string): ApiProject[] {
  const t = tag?.trim().toLowerCase();
  return projects.filter((p) => !t || p.tags.some((x) => x.toLowerCase() === t)).map(projectSummary);
}

export function apiProject(slug: string): ApiProjectDetail | null {
  const p = projects.find((x) => x.slug === slug);
  if (!p) return null;
  return {
    ...projectSummary(p),
    intro: p.detail?.intro ?? null,
    sections: (p.detail?.sections ?? []).map((s) => ({ heading: s.heading, headingEn: s.headingEn ?? null, items: s.body })),
    context: p.detail?.context ?? null,
    image: p.image ? `${SITE_URL}${p.image}` : null,
  };
}

const postSummary = (p: BlogPost): ApiPost => ({
  slug: p.slug,
  title: p.title,
  titleEn: p.titleEn,
  date: p.date,
  description: p.description,
  tags: p.tags,
  series: p.series ?? null,
  readingMinutes: readingMinutes(p.content),
  url: `${SITE_URL}/blog/${p.slug}`,
  markdownUrl: `${SITE_URL}/blog/${p.slug}.md`,
});

export function apiPosts(tag?: string): ApiPost[] {
  const t = tag?.trim().toLowerCase();
  return getAllPosts()
    .filter((p) => !t || p.tags.some((x) => x.toLowerCase() === t))
    .map(postSummary);
}

/** 文章全文（MDX 原文，就是網站上那篇） */
export function apiPost(slug: string): (ApiPost & { content: string }) | null {
  const p = getPostBySlug(slug);
  return p ? { ...postSummary(p), content: p.content } : null;
}

export function apiProfile() {
  return {
    name: "PINGWEI LI",
    role: "學生開發者 · Student developer",
    base: "高雄，台灣 ↔ 福岡，日本",
    focus: ["AI 工具應用（YOLOv8、ONNX、Gemini）", "後端（FastAPI、Flask）", "前端（Next.js、React、TypeScript）"],
    status: statusLines,
    links: { site: SITE_URL, github: GITHUB_URL, llms: `${SITE_URL}/llms.txt`, api: API_BASE, mcp: `${SITE_URL}/mcp` },
  };
}

export function apiNow() {
  return { items: nowItems, url: `${SITE_URL}/now` };
}

/** 跟 /flights 頁一樣：只有航班代碼、機場、距離、次數，沒有日期 */
export function apiFlights() {
  const s = flightStats();
  return {
    flights: s.flights,
    airports: s.airports,
    countries: s.countries,
    km: s.km,
    earthLaps: Math.round(s.earthLaps * 100) / 100,
    airlines: s.airlines.map(([code, n]) => ({ code, name: AIRLINES[code] ?? code, flights: n })),
    routes: routes().map((r) => ({
      from: { code: r.a, name: AIRPORTS[r.a].name },
      to: { code: r.b, name: AIRPORTS[r.b].name },
      km: r.km,
      count: r.count,
      flightCodes: r.codes,
    })),
    url: `${SITE_URL}/flights`,
  };
}

/** 作品＋文章的關鍵字搜尋（MCP 的 search 工具用）：標題、說明、tag 有出現就算，不分大小寫 */
export function searchSite(query: string, limit = 10) {
  const q = query.trim().toLowerCase();
  if (!q) return { projects: [], posts: [] };
  const hit = (...fields: string[]) => fields.some((f) => f.toLowerCase().includes(q));
  return {
    projects: projects
      .filter((p) => hit(p.title, p.titleZh, p.description, p.descriptionZh, ...p.tags, ...(p.detail?.sections.flatMap((s) => s.body) ?? [])))
      .slice(0, limit)
      .map(projectSummary),
    posts: getAllPosts()
      .filter((p) => hit(p.title, p.titleEn, p.description, ...p.tags, p.content))
      .slice(0, limit)
      .map(postSummary),
  };
}

/** API 回應共用的 header：公開唯讀，任何網域都可以讀；快取一小時 */
const API_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=3600",
} as const;

export const apiJson = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { ...API_HEADERS, "Content-Type": "application/json; charset=utf-8" } });
