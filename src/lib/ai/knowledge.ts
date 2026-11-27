// 「問我」AI 助理的知識庫（TODO H1，2026-11-27）：把公開頁面的內容切成小段，依問題挑最相關的幾段交給模型。
//
// ⚠️ 只從「頁面上看得到」的資料模組取內容（作品、文章、About、履歷頁的欄位），不是從 lib/content/markdown.ts：
//    那份為了爬蟲加了中文本名。後台資料庫、雷達位置、logs、data/ 都不碰——模型讀不到，就不可能說出來。
//    knowledge.test.ts 會檢查：不含本名、隱藏作品不在裡面。
// 這個檔案是「關鍵字檢索」：中文字元雙連詞＋英數單字，依「出現在多少段」加權（IDF），標題命中加倍；單用不夠準，
// 所以 retrieve.ts 把它跟 embedding 語意檢索合併，Ollama 沒開時也退回這個。
// 基本資料（About、履歷、聯絡）最常被問、又不大，每次提問整批帶上，不走檢索（isCore）；檢索的對象只有作品與文章（getTopical）。

import { projects, type Project } from "@/lib/content/projects";
import { getAllPosts, type BlogPost } from "@/lib/content/blog";
import { planningCountries, skills, statusLines, timeline, visitedCountries } from "@/lib/content/about";
import { certifications, education, resumeSkillGroups } from "@/lib/content/page-content";
import { EMAIL, GITHUB_URL } from "@/lib/site/site";

export interface Chunk {
  id: string;
  title: string;
  /** 站內路徑，給「來源」連結用 */
  href: string;
  text: string;
}

const MAX_CHUNK_CHARS = 700;

/** 太長的段落從句點或換行處切開，每段不超過 MAX_CHUNK_CHARS */
function splitLong(text: string): string[] {
  const out: string[] = [];
  let cur = "";
  for (const part of text.split(/(?<=[。！？\n])/)) {
    if (cur && cur.length + part.length > MAX_CHUNK_CHARS) {
      out.push(cur.trim());
      cur = "";
    }
    cur += part;
  }
  if (cur.trim()) out.push(cur.trim());
  return out.flatMap((s) => (s.length > MAX_CHUNK_CHARS * 1.5 ? (s.match(new RegExp(`[\\s\\S]{1,${MAX_CHUNK_CHARS}}`, "g")) ?? [s]) : [s]));
}

function aboutChunks(): Chunk[] {
  return [
    // 「日文＝日語」：問的人常寫日文，頁面上寫日語，兩個詞不同模型就容易答「沒寫」
    { id: "about:profile", title: "關於 PINGWEI LI", href: "/#about", text: `${statusLines.join("\n")}\n（日文能力＝日語 N5 学習中）` },
    {
      id: "about:travel",
      title: "去過的國家與城市（足跡）",
      href: "/#about",
      text: `${visitedCountries.map((c) => `${c.country}${c.cities.length ? `：${c.cities.join("、")}` : ""}`).join("\n")}\n計畫前往：${planningCountries.map((c) => c.country).join("、")}`,
    },
    {
      id: "about:skills",
      title: "技能",
      href: "/#about",
      text: skills.map((g) => `${g.category}（${g.categoryEn}）：${g.items.map((i) => i.name).join("、")}`).join("\n"),
    },
    {
      id: "about:timeline",
      title: "經歷與時間軸",
      href: "/#about",
      text: timeline.map((t) => `${t.year} ${t.zh}：${t.detailZh}`).join("\n"),
    },
    {
      id: "about:projects",
      title: "作品清單（技術標籤）",
      href: "/#portfolio",
      // 每個作品一行（名稱、個人／課程、技術標籤、作品頁）：問「做過哪些專案」「用過 X 的專案」直接從這裡答；細節靠檢索
      text: projects.map((p) => `${p.titleZh}（${p.isPersonal ? "個人" : "課程"}）：${p.tags.join("、")}｜/projects/${p.slug}`).join("\n"),
    },
    {
      id: "about:contact",
      title: "聯絡方式",
      href: "/#contact",
      text: `Email：${EMAIL}
GitHub：${GITHUB_URL}
歡迎合作、技術交流、閒聊；也可以看網站首頁最下面的 Contact 區塊。`,
    },
    {
      id: "resume:edu",
      title: "學歷、證照與技能（履歷）",
      href: "/resume",
      text: [
        ...education.map((e) => `${e.school} ${e.program}（${e.period}）`),
        ...certifications.map((c) => `${c.group}：${c.items.map((i) => i.name).join("、")}`),
        ...resumeSkillGroups.map((g) => `${g.label}：${g.items.join("、")}`),
      ].join("\n"),
    },
  ];
}

function projectChunks(p: Project): Chunk[] {
  const href = `/projects/${p.slug}`;
  const name = `${p.titleZh}（${p.title}）`;
  const head = [
    `${name}：${p.descriptionZh}`,
    p.highlightZh,
    `狀態：${p.status}${p.isPersonal ? "（個人專案）" : "（課程專題）"}；技術：${p.tags.join("、")}`,
    p.github ? `GitHub：${p.github}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  const out: Chunk[] = [{ id: `project:${p.slug}`, title: name, href, text: head }];
  const d = p.detail;
  if (!d) return out;
  if (d.intro) out.push({ id: `project:${p.slug}:intro`, title: name, href, text: d.intro });
  const cs = d.caseStudy;
  if (cs) {
    const text = [
      `問題：${cs.problem}`,
      cs.role ? `角色：${cs.role}` : "",
      ...cs.decisions.map((x) => `決定：${x.what}（${x.why}）`),
      ...(cs.tradeoffs ?? []).map((x) => `取捨：${x}`),
      ...cs.results.map((x) => `成果：${x}`),
    ]
      .filter(Boolean)
      .join("\n");
    splitLong(text).forEach((t, i) => out.push({ id: `project:${p.slug}:case${i}`, title: `${name} · 案例`, href, text: t }));
  }
  d.sections.forEach((s, i) => {
    splitLong(`${s.heading}\n${s.body.join("\n")}`).forEach((t, j) => out.push({ id: `project:${p.slug}:s${i}.${j}`, title: `${name} · ${s.heading}`, href, text: t }));
  });
  return out;
}

/** 文章 Markdown 轉成純文字：去掉程式碼區塊、連結語法、強調符號 */
function plain(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[`*_>]/g, "")
    .replace(/^\s*[-\d.]+\s+/gm, "")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function postChunks(post: BlogPost): Chunk[] {
  const href = `/blog/${post.slug}`;
  const out: Chunk[] = [{ id: `post:${post.slug}`, title: post.title, href, text: `${post.title}\n${post.description}\n標籤：${post.tags.join("、")}` }];
  const sections = post.content.split(/^## /m);
  sections.forEach((sec, i) => {
    const body = plain(sec); // 第 0 段是第一個 ## 之前的開頭，其餘段落第一行就是小標題
    if (body.length < 30) return;
    splitLong(body).forEach((t, j) => out.push({ id: `post:${post.slug}:${i}.${j}`, title: post.title, href, text: t }));
  });
  return out;
}

let cache: Chunk[] | undefined;

/** 基本資料（About、履歷、聯絡）：最常被問、也不大，所以每次提問都整批帶上，不靠檢索 */
export const isCore = (c: Chunk) => c.id.startsWith("about:") || c.id.startsWith("resume:");

export function buildKnowledge(): Chunk[] {
  return [...aboutChunks(), ...projects.flatMap(projectChunks), ...getAllPosts().flatMap(postChunks)];
}

let topical: Chunk[] | undefined;
/** 作品與文章的段落：依問題檢索的對象 */
export function getTopical(): Chunk[] {
  return (topical ??= getKnowledge().filter((c) => !isCore(c)));
}
export const getCore = () => getKnowledge().filter(isCore);

/** 啟動後第一次用到才建，之後共用（內容隨部署換新，process 重啟就重建） */
export function getKnowledge(): Chunk[] {
  return (cache ??= buildKnowledge());
}

// ── 檢索 ──

const MULTI_STOP = /什麼|為什麼|哪些|哪個|哪間|哪裡|怎麼|如何|為何|多少|可以|是否|有沒有|會不會|能不能|請問|嗎/g;
const SINGLE_STOP = /[的了呢吧啊是有在和與或也都就這那他她你我]/g;

/** 中文先拿掉疑問詞、在虛詞處切開，再取相鄰兩字；英數取小寫單字（兩個字元以上） */
export function tokenize(text: string): string[] {
  const out: string[] = [];
  for (const m of text.toLowerCase().matchAll(/[a-z0-9][a-z0-9.+#-]*|[぀-ヿ㐀-鿿]+/g)) {
    const s = m[0];
    if (/^[a-z0-9]/.test(s)) {
      const word = s.replace(/[.+#-]+$/, ""); // 句尾的句點不算單字的一部分
      if (word.length >= 2) out.push(word);
      continue;
    }
    for (const frag of s.replace(MULTI_STOP, " ").replace(SINGLE_STOP, " ").split(" ")) {
      for (let i = 0; i < frag.length - 1; i++) out.push(frag.slice(i, i + 2));
    }
  }
  return out;
}

/** 建索引用：英數單字多存前綴（yolov8 → yolo、yolov），問「YOLO」才找得到寫「YOLOv8」的段落 */
function withPrefixes(tokens: string[]): Set<string> {
  const set = new Set(tokens);
  for (const t of tokens) {
    if (/^[a-z0-9]/.test(t)) for (let n = 4; n < t.length; n++) set.add(t.slice(0, n));
  }
  return set;
}

interface Index {
  chunks: Chunk[];
  sets: Set<string>[];
  titles: Set<string>[];
  idf: Map<string, number>;
}

const indexCache = new WeakMap<Chunk[], Index>();

function indexOf(chunks: Chunk[]): Index {
  let ix = indexCache.get(chunks);
  if (ix) return ix;
  const sets = chunks.map((c) => withPrefixes(tokenize(`${c.title}\n${c.text}`)));
  const titles = chunks.map((c) => withPrefixes(tokenize(c.title)));
  const df = new Map<string, number>();
  for (const s of sets) for (const t of s) df.set(t, (df.get(t) ?? 0) + 1);
  const idf = new Map([...df].map(([t, n]) => [t, Math.log(1 + chunks.length / n)]));
  ix = { chunks, sets, titles, idf };
  indexCache.set(chunks, ix);
  return ix;
}

/** 依問題挑最相關的 limit 段；分數太低（沒什麼相關）就回空陣列 */
export function search(query: string, chunks: Chunk[] = getTopical(), limit = 4): Chunk[] {
  const q = [...new Set(tokenize(query))];
  if (q.length === 0) return [];
  const { sets, titles, idf } = indexOf(chunks);
  const rareIdf = Math.log(1 + chunks.length / 40); // 出現在不到 40 段的詞
  const scored = chunks
    .map((chunk, i) => {
      let score = 0;
      let hits = 0;
      let rare = false;
      for (const t of q) {
        if (!sets[i].has(t)) continue;
        hits++;
        const w = idf.get(t) ?? 0;
        if (w >= rareIdf) rare = true;
        score += w * (titles[i].has(t) ? 2 : 1);
      }
      return { chunk, score, hits, rare };
    })
    // 至少兩個詞命中，或命中一個不常見的詞（例：YOLO、Ollama）；只中「專案」這種到處都有的詞不算
    .filter((x) => x.hits >= 2 || x.rare)
    .toSorted((a, b) => b.score - a.score);
  if (scored.length === 0) return [];
  const floor = scored[0].score * 0.3;
  return scored.filter((x) => x.score >= floor).slice(0, limit).map((x) => x.chunk);
}

/** 來源連結：同一個頁面只列一次，最多 3 個 */
export function sourcesOf(found: Chunk[]): { title: string; href: string }[] {
  const seen = new Set<string>();
  const out: { title: string; href: string }[] = [];
  for (const c of found) {
    if (seen.has(c.href)) continue;
    seen.add(c.href);
    out.push({ title: c.title.split(" · ")[0], href: c.href });
    if (out.length === 3) break;
  }
  return out;
}

/**
 * 「哪些作品用了 X」這類題目小模型從清單推常常推錯（實測把沒用 Next.js 的作品也列進去），所以由程式先算好：
 * 問題裡出現某個作品的技術標籤（英數單字比對，yolo 也對得到 YOLOv8），就產生一行「用 X 的作品只有：…」。
 */
export function techMatches(query: string): { tag: string; projects: Project[] }[] {
  const words = [...new Set(query.toLowerCase().match(/[a-z0-9][a-z0-9.+#-]*[a-z0-9+#]|[a-z0-9]/g) ?? [])].filter((w) => w.length >= 3 || /[.+#]/.test(w));
  if (words.length === 0) return [];
  const byTag = new Map<string, Project[]>();
  for (const p of projects) for (const tag of p.tags) byTag.set(tag, [...(byTag.get(tag) ?? []), p]);
  const out: { tag: string; projects: Project[] }[] = [];
  for (const [tag, list] of byTag) {
    const t = tag.toLowerCase();
    if (words.some((w) => t === w || t.startsWith(w))) out.push({ tag, projects: list });
  }
  return out.slice(0, 4);
}

export const techLines = (query: string): string[] =>
  techMatches(query).map(({ tag, projects: list }) => `用到「${tag}」的作品只有這 ${list.length} 個：${list.map((p) => p.titleZh).join("、")}`);

/** 技術比對到的作品頁，優先當來源（比語意檢索挑到的文章更準） */
export const techSources = (query: string): { title: string; href: string }[] =>
  techMatches(query).flatMap(({ projects: list }) => list.map((p) => ({ title: p.titleZh, href: `/projects/${p.slug}` })));

/** 放進最後一則提問前面的參考資料：基本資料一定有，作品與文章只放檢索到的 */
export function contextBlock(core: Chunk[], found: Chunk[]): string {
  const part = (c: Chunk) => `■ ${c.title}\n${c.text}`;
  return [
    "【參考資料】只能根據下面的內容回答；沒寫的就說網站上沒有寫。",
    "〈基本資料〉",
    core.map(part).join("\n\n"),
    "〈跟這個問題有關的作品與文章〉",
    found.length ? found.map(part).join("\n\n") : "（沒有找到相關的作品或文章）",
  ].join("\n");
}
