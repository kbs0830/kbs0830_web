// 依問題挑網站內容：embedding 語意檢索（embeddinggemma）＋ knowledge.ts 的關鍵字檢索合併；Ollama 沒開、向量還沒算完就只用關鍵字。
import { getCore, getTopical, search, type Chunk } from "./knowledge";
import { dot, embed } from "./ollama";

let docVecs: Promise<number[][]> | undefined;

/** 所有段落的向量：第一次用到才算（約幾百段，一個請求一批），之後留在記憶體；失敗就清掉，下次重試 */
function getDocVecs(): Promise<number[][]> {
  docVecs ??= (async () => {
    const chunks = getTopical();
    const out: number[][] = [];
    for (let i = 0; i < chunks.length; i += 32) {
      const batch = chunks.slice(i, i + 32).map((c) => `title: ${c.title} | text: ${c.text}`);
      out.push(...(await embed(batch)));
    }
    return out;
  })().catch((e) => {
    docVecs = undefined;
    throw e;
  });
  return docVecs;
}

/** 語意相似度低於這個就不算相關（用真實問題校準：沒寫的問題最高約 0.25、問得到的 0.45 以上） */
export const MIN_SIMILARITY = 0.4;

/** 兩份排名合併（Reciprocal Rank Fusion）：語意檢索跟關鍵字檢索各有漏掉的，合起來比單一種穩 */
export function fuse(semantic: Chunk[], lexical: Chunk[], limit: number): Chunk[] {
  const score = new Map<Chunk, number>();
  for (const list of [semantic, lexical]) list.forEach((c, i) => score.set(c, (score.get(c) ?? 0) + 1 / (60 + i)));
  return [...score].toSorted((a, b) => b[1] - a[1]).slice(0, limit).map(([c]) => c);
}

/** 語意相似度夠高才當作「來源」列給訪客看（比 MIN_SIMILARITY 嚴：放進提示可以寬，掛名「來源」要有把握） */
export const CITE_SIMILARITY = 0.42;

export function rank(queryVec: number[], vecs: number[][], chunks: Chunk[], limit: number): { chunk: Chunk; score: number }[] {
  return chunks
    .map((chunk, i) => ({ chunk, score: dot(queryVec, vecs[i]) }))
    .toSorted((a, b) => b.score - a.score)
    .slice(0, limit)
    .filter((x) => x.score >= MIN_SIMILARITY);
}

/** 向量最多等這麼久（第一次要算全部段落，實測約 40 秒），等不到就先用關鍵字回答，不讓訪客乾等 */
const VECTOR_WAIT_MS = 3000;
const timeoutAfter = (ms: number) => new Promise<never>((_, reject) => setTimeout(() => reject(new Error("vectors not ready")), ms));

/**
 * 依問題挑最相關的作品／文章段落（語意＋關鍵字合併）。found 放進提示，cited 是有把握的、拿來當「來源」連結。
 * Ollama 沒開或向量還沒算完就只用關鍵字（這時 found 全部當來源）。
 */
export async function retrieve(query: string, limit = 3, signal?: AbortSignal): Promise<{ core: Chunk[]; found: Chunk[]; cited: Chunk[] }> {
  const lexical = search(query, getTopical(), 6);
  try {
    const [vecs, [q]] = await Promise.all([Promise.race([getDocVecs(), timeoutAfter(VECTOR_WAIT_MS)]), embed([`task: search result | query: ${query}`], signal)]);
    const semantic = rank(q, vecs, getTopical(), 6);
    const found = fuse(semantic.map((x) => x.chunk), lexical, limit);
    const strong = new Set(semantic.filter((x) => x.score >= CITE_SIMILARITY).map((x) => x.chunk));
    return { core: getCore(), found, cited: found.filter((c) => strong.has(c)) };
  } catch {
    const found = lexical.slice(0, limit);
    return { core: getCore(), found, cited: found };
  }
}

/** 同一頁只留一筆（段落很多，同一篇文章常有好幾段都相關） */
export function uniquePages(chunks: Chunk[], limit: number): { title: string; href: string }[] {
  const seen = new Set<string>();
  const out: { title: string; href: string }[] = [];
  for (const c of chunks) {
    if (seen.has(c.href)) continue;
    seen.add(c.href);
    out.push({ title: c.title.split(" · ")[0], href: c.href });
    if (out.length === limit) break;
  }
  return out;
}

/**
 * 網址（slug）比對：問題裡的英文字（3 字元以上）有幾個出現在頁面網址裡。打錯一個字的網址（/blog/tunnel-dwon-four-days）
 * 語意向量對不準，但 tunnel、four、days 三個字都在 tunnel-down-four-days 裡。重疊 ≥2 個字（只有 1 個字時要 1 個）才算，多的排前面。
 */
export function hrefMatches(query: string, chunks: Chunk[]): Chunk[] {
  const tokens = [...new Set(query.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length >= 3))];
  if (tokens.length === 0) return [];
  const need = Math.min(2, tokens.length);
  const best = new Map<string, { chunk: Chunk; n: number }>();
  for (const c of chunks) {
    if (best.has(c.href)) continue;
    const n = tokens.filter((t) => c.href.toLowerCase().includes(t)).length;
    if (n >= need) best.set(c.href, { chunk: c, n });
  }
  return [...best.values()].toSorted((a, b) => b.n - a.n).map((x) => x.chunk);
}

/**
 * 語意搜尋（Ctrl+K、404 頁、MCP 用）：只用 embedding 模型，不碰聊天模型，所以很快（暖機後約 0.1 秒）、不跟 /ask 搶 GPU。
 * 問「怎麼讓網站不要掛掉」也找得到寫「監控」「自動重啟」的文章。Ollama 沒開就退回關鍵字。
 */
export async function semanticSearch(query: string, limit = 5, signal?: AbortSignal): Promise<{ title: string; href: string }[]> {
  const lexical = search(query, getTopical(), 8);
  try {
    const [vecs, [q]] = await Promise.all([Promise.race([getDocVecs(), timeoutAfter(VECTOR_WAIT_MS)]), embed([`task: search result | query: ${query}`], signal)]);
    const semantic = rank(q, vecs, getTopical(), 10).filter((x) => x.score >= CITE_SIMILARITY);
    return uniquePages([...hrefMatches(query, getTopical()), ...fuse(semantic.map((x) => x.chunk), lexical, 10)], limit);
  } catch {
    return uniquePages([...hrefMatches(query, getTopical()), ...lexical], limit);
  }
}

/** 開機或進 /ask 時先把向量算好，第一個訪客就不用等 */
export async function warmRetrieval(): Promise<boolean> {
  try {
    await getDocVecs();
    return true;
  } catch {
    return false;
  }
}
