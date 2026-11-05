// 「Markdown for Agents」：每一頁的 Markdown 版，給 AI 工具讀（比整包 HTML 省 token、結構也更清楚）。
// 取得方式（next.config.ts 的 rewrites 轉到 app/md/[[...path]]/route.ts）：
//   1. 同一個網址帶 `Accept: text/markdown`（Cloudflare 付費版的 Markdown for Agents 也是這個慣例）
//   2. 網址後面加 `.md`：/projects/foodlens-advisor.md、首頁是 /index.md
// 內容跟頁面上看得到的一致，只換格式——所以**不放中文本名**（本名只在 JSON-LD 與 /llms.txt，見 CLAUDE.md Key Constraints 1）
import { projects, type Project } from "./projects";
import { getAllPosts, getPostBySlug } from "./blog";
import { skills, statusLines, timeline } from "./about";
import { education, nowItems, resumeFeaturedSlugs, resumeRole, resumeSkillGroups, usesGroups } from "./page-content";
import { EMAIL, GITHUB_URL, SITE_URL } from "./site";

const SITE_DESCRIPTION =
  "高雄出身的學生開発者，專注於 AI 工具應用與網頁開發。就讀國立高科大智慧商務系，使用 Claude & Gemini 構建 AI × Web 専案。";

const list = (items: string[]) => items.map((i) => `- ${i}`).join("\n");
const mdUrl = (path: string) => `${SITE_URL}/${path || "index"}.md`;
const htmlUrl = (path: string) => `${SITE_URL}${path ? `/${path}` : ""}`;

function footer(path: string) {
  return `\n---\n\n原始網頁：${htmlUrl(path)}\n`;
}

function projectLine(p: Project) {
  return `- [${p.titleZh}（${p.title}）](${mdUrl(`projects/${p.slug}`)})：${p.descriptionZh}`;
}

function home() {
  const personal = projects.filter((p) => p.isPersonal);
  const course = projects.filter((p) => !p.isPersonal);
  return `# PINGWEI LI

> ${SITE_DESCRIPTION}

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
  return `# PINGWEI LI — 履歷 · Resume

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

PDF 版：${SITE_URL}/resume.pdf
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

/** 所有有 Markdown 版的頁面路徑（不含開頭的 /；首頁是空字串） */
export function markdownPaths(): string[] {
  return [
    "",
    "resume",
    "now",
    "uses",
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
