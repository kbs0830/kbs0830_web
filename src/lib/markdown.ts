// 「Markdown for Agents」：每一頁的 Markdown 版，給 AI 工具讀（比整包 HTML 省 token、結構也更清楚）。
// 取得方式（next.config.ts 的 rewrites 轉到 app/md/[[...path]]/route.ts）：
//   1. 同一個網址帶 `Accept: text/markdown`（Cloudflare 付費版的 Markdown for Agents 也是這個慣例）
//   2. 網址後面加 `.md`：/projects/foodlens-advisor.md、首頁是 /index.md
// 內容跟頁面一致、只換格式；另外**加上中文本名**：這是只有 AI 工具會讀、人在網頁上看不到的地方，
// 使用者 2026-11-05 確認「AI 跟爬蟲要找得到名字，只是不要顯示在網頁上」（CLAUDE.md Key Constraints 1）
import { projects, type Project } from "./projects";
import { getAllPosts, getPostBySlug } from "./blog";
import { skills, statusLines, timeline } from "./about";
import { education, nowItems, resumeFeaturedSlugs, resumeRole, resumeSkillGroups, usesGroups } from "./page-content";
import { EMAIL, GITHUB_URL, SITE_URL } from "./site";
import { AIRLINES, AIRPORTS, airportsByCountry, flightStats, routes } from "./flights";
import { GROUP_NAMES, hotelStats, hotelsByPlace, membershipsByKind } from "./hotels";

const SITE_DESCRIPTION =
  "高雄出身的學生開発者，專注於 AI 工具應用與網頁開發。就讀國立高科大智慧商務系，使用 Claude & Gemini 構建 AI × Web 専案。";

const list = (items: string[]) => items.map((i) => `- ${i}`).join("\n");
const mdUrl = (path: string) => `${SITE_URL}/${path || "index"}.md`;
const htmlUrl = (path: string) => `${SITE_URL}${path ? `/${path}` : ""}`;

const AUTHOR = "PINGWEI LI（李秉威，Li Ping-Wei）";

function footer(path: string) {
  return `\n---\n\n作者：${AUTHOR}\n原始網頁：${htmlUrl(path)}\n`;
}

function projectLine(p: Project) {
  return `- [${p.titleZh}（${p.title}）](${mdUrl(`projects/${p.slug}`)})：${p.descriptionZh}`;
}

function home() {
  const personal = projects.filter((p) => p.isPersonal);
  const course = projects.filter((p) => !p.isPersonal);
  return `# PINGWEI LI（李秉威）

> ${SITE_DESCRIPTION}

也寫作 Li Ping-Wei、Ping-Wei Li；GitHub 帳號 kbs0830。這是本人的個人網站與作品集。

## 自己紹介 · About

${list(statusLines)}

## 技能 · Skills

${skills.map((g) => `- **${g.category}**：${g.items.map((i) => i.name).join("、")}`).join("\n")}

## 經歷 · Timeline

${timeline.map((t) => `- **${t.year}**：${t.zh}——${t.detailZh}`).join("\n")}

## 製作物 · Projects

### 個人専案

${personal.map(projectLine).join("\n")}

### 課程専題

${course.map(projectLine).join("\n")}

## 其他頁面

- [履歷 · Resume](${mdUrl("resume")})
- [部落格 · Blog](${mdUrl("blog")})
- [現在在做什麼 · Now](${mdUrl("now")})
- [開発環境 · Uses](${mdUrl("uses")})
- [飛行紀錄 · Flight Log](${mdUrl("flights")})
- [住宿紀錄 · Hotel Log](${mdUrl("hotels")})

## 連絡先 · Contact

- Email：${EMAIL}
- GitHub：${GITHUB_URL}
${footer("")}`;
}

function project(p: Project) {
  const d = p.detail;
  const parts = [
    `# ${p.titleZh}（${p.title}）`,
    `> ${p.descriptionZh}`,
    `- 狀態：${p.status}\n- 成果：${p.highlightZh}\n- 技術：${p.tags.join("、")}${p.github ? `\n- 原始碼：${p.github}` : ""}`,
  ];
  if (d) {
    parts.push(d.intro);
    if (d.architectureDiagram) parts.push(`## 架構圖 · Architecture\n\n\`\`\`mermaid\n${d.architectureDiagram}\n\`\`\``);
    for (const s of d.sections) parts.push(`## ${s.heading}${s.headingEn ? ` · ${s.headingEn}` : ""}\n\n${list(s.body)}`);
    if (d.context) parts.push(`> ${d.context}`);
  }
  return parts.join("\n\n") + "\n" + footer(`projects/${p.slug}`);
}

function blogIndex() {
  const posts = getAllPosts();
  return `# 部落格 · Blog

${posts.map((p) => `- [${p.title}](${mdUrl(`blog/${p.slug}`)})（${p.date}）：${p.description}`).join("\n")}
${footer("blog")}`;
}

function blogPost(slug: string) {
  const post = getPostBySlug(slug);
  if (!post) return null;
  return `# ${post.title}

> ${post.description}

- 日期：${post.date}
- 標籤：${post.tags.join("、")}

${post.content.trim()}
${footer(`blog/${slug}`)}`;
}

function resume() {
  const featured = projects.filter((p) => resumeFeaturedSlugs.includes(p.slug));
  return `# PINGWEI LI（李秉威）— 履歷 · Resume

${resumeRole}

- Email：${EMAIL}
- GitHub：${GITHUB_URL}
- 高雄，台灣 ↔ 福岡，日本

## 教育 · Education

${education.map((e) => `- **${e.school} ${e.program}**（${e.period}）\n  ${e.schoolEn}`).join("\n")}

## 技能 · Skills

${resumeSkillGroups.map((g) => `- **${g.label}**：${g.items.join("、")}`).join("\n")}

## 作品 · Projects

${featured.map((p) => `- **[${p.titleZh}（${p.title}）](${mdUrl(`projects/${p.slug}`)})**：${p.descriptionZh}\n  成果：${p.highlightZh}`).join("\n")}

${footer("resume")}`;
}

function now() {
  return `# 現在 · What I'm doing

這個頁面記錄我當下的狀態，會不定期更新（nownownow.com 的傳統）。

${list(nowItems)}
${footer("now")}`;
}

function uses() {
  return `# 開発環境 · 我用的工具

${usesGroups.map((g) => `## ${g.title}\n\n${g.items.map((i) => `- **${i.name}**：${i.detail}`).join("\n")}`).join("\n\n")}
${footer("uses")}`;
}

function flights() {
  const s = flightStats();
  return `# 飛行紀錄 · Flight Log

航迷小筆記：搭過的航線、機場跟航空公司。只記航班代碼跟起降機場，不記日期。

- 航班：${s.flights}
- 機場：${s.airports}（${s.countries} 個國家／地區）
- 航空公司：${s.airlines.length}
- 總距離：約 ${s.km.toLocaleString("en-US")} km（約繞地球 ${s.earthLaps.toFixed(1)} 圈）

## 航線 · Routes

${routes().map((r) => `- ${AIRPORTS[r.a].name}（${r.a}）↔ ${AIRPORTS[r.b].name}（${r.b}）：${r.count} 次，${r.km} km——${r.codes.join("、")}`).join("\n")}

## 機場 · Airports

${airportsByCountry().map(([c, codes]) => `- **${c}**：${codes.map((x) => `${AIRPORTS[x].name}（${x}）`).join("、")}`).join("\n")}

## 航空公司 · Airlines

${s.airlines.map(([code, n]) => `- ${AIRLINES[code] ?? code}（${code}）：${n} 班`).join("\n")}
${footer("flights")}`;
}

function hotels() {
  const s = hotelStats();
  const groups = membershipsByKind();
  const memberships = groups.length
    ? `## 會籍 · Memberships\n\n${groups
        .map(([kind, ms]) => `### ${kind}\n\n${ms.map((m) => `- **${m.program}**${m.tier ? `：${m.tier}` : ""}`).join("\n")}`)
        .join("\n\n")}\n\n`
    : "";
  const places = hotelsByPlace()
    .map(([country, cities]) => `### ${country}\n\n${cities.map(([city, h]) => `- **${city}**：${h.join("、")}`).join("\n")}`)
    .join("\n\n");
  return `# 住宿紀錄 · Hotel Log

住過的飯店、城市跟飯店集團。只記名稱跟城市，不記日期。

- 飯店：${s.hotels}
- 城市：${s.cities}（${s.countries} 個國家／地區）

${memberships}## 飯店 · Hotels

${places}

## 飯店集團 · Groups

${s.groups.map(([g, n]) => `- ${GROUP_NAMES[g]}：${n} 間`).join("\n")}
${footer("hotels")}`;
}

/** 所有有 Markdown 版的頁面路徑（不含開頭的 /；首頁是空字串） */
export function markdownPaths(): string[] {
  return [
    "",
    "resume",
    "now",
    "uses",
    "flights",
    "hotels",
    "blog",
    ...getAllPosts().map((p) => `blog/${p.slug}`),
    ...projects.map((p) => `projects/${p.slug}`),
  ];
}

/** 頁面路徑 → Markdown；沒有這頁就回 null */
export function renderMarkdown(path: string): string | null {
  switch (path) {
    case "":
      return home();
    case "resume":
      return resume();
    case "now":
      return now();
    case "uses":
      return uses();
    case "flights":
      return flights();
    case "hotels":
      return hotels();
    case "blog":
      return blogIndex();
  }
  const [section, slug, ...rest] = path.split("/");
  if (!slug || rest.length) return null;
  if (section === "blog") return blogPost(slug);
  if (section === "projects") {
    const p = projects.find((x) => x.slug === slug);
    return p ? project(p) : null;
  }
  return null;
}
