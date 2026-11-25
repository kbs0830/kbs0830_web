// 部落格全文搜尋（TODO A6，2026-11-21）。不用 Pagefind：文章只有幾篇，自己做的索引幾十 KB，
// 而且中文直接用「包含」比對就準（Pagefind 的中文斷詞要另外測）；也不用在正式站目錄裝新套件。
// build 時 /blog/search-index.json 產生索引 → 訪客第一次點搜尋框才下載 → 瀏覽器裡比對。

export interface IndexedPost {
  slug: string;
  title: string;
  titleEn: string;
  date: string;
  tags: string[];
  description: string;
  text: string; // 全文的純文字（程式碼也留著：常常就是要搜指令名稱）
}

export interface SearchHit {
  slug: string;
  title: string;
  date: string;
  snippet: { before: string; match: string; after: string } | null;
  score: number;
}

/** MDX 原文 → 搜尋用的純文字 */
export function plainText(md: string): string {
  return md
    .replace(/```[^\n]*\n?/g, " ") // 程式碼區塊的 ``` 那行（內容留著）
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/^\s*(?:[-*]|\d+\.|>)\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * 空白分開的每個詞都要出現（AND）。分數：標題 ×10、tag ×6、摘要 ×4、內文每次出現 ×1（最多 10）。
 * 片段取第一個詞在內文第一次出現的前後 40 字。
 */
export function searchPosts(index: IndexedPost[], query: string, limit = 10): SearchHit[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const hits: SearchHit[] = [];
  for (const p of index) {
    const title = `${p.title} ${p.titleEn}`.toLowerCase();
    const tags = p.tags.join(" ").toLowerCase();
    const desc = p.description.toLowerCase();
    const text = p.text.toLowerCase();
    let score = 0;
    let all = true;
    for (const t of terms) {
      const inBody = Math.min(10, text.split(t).length - 1);
      const s = (title.includes(t) ? 10 : 0) + (tags.includes(t) ? 6 : 0) + (desc.includes(t) ? 4 : 0) + inBody;
      if (!s) {
        all = false;
        break;
      }
      score += s;
    }
    if (!all) continue;
    const at = text.indexOf(terms[0]);
    const snippet =
      at < 0
        ? null
        : {
            before: (at > 40 ? "…" : "") + p.text.slice(Math.max(0, at - 40), at),
            match: p.text.slice(at, at + terms[0].length),
            after: p.text.slice(at + terms[0].length, at + terms[0].length + 40) + (at + terms[0].length + 40 < p.text.length ? "…" : ""),
          };
    hits.push({ slug: p.slug, title: p.title, date: p.date, snippet, score });
  }
  return hits.sort((a, b) => b.score - a.score || b.date.localeCompare(a.date)).slice(0, limit);
}
