import "server-only";
import { cacheLife } from "next/cache";

// 自己畫的 GitHub 貢獻熱力圖資料（TODO D1，2026-11-28）。原本用別人的 ghchart.rshah.org（白底圖片、深色模式是白卡）。
// 資料來源：GitHub 公開的 https://github.com/users/<帳號>/contributions（不用 token，ghchart 也是抓這個），
// 每一格有 data-date、data-level（0～4），旁邊的 tool-tip 文字是「N contributions on …」。
// "use cache"＋cacheLife：1 小時重抓、最久 1 天（部署／build 時抓一次，GitHub 掛了就沿用上次，沒有上次就丟例外讓頁面用備案）。
// 失敗要丟例外、不要回 null（null 會被快取，見 CLAUDE.md）。

export interface ContribDay {
  date: string; // YYYY-MM-DD
  level: 0 | 1 | 2 | 3 | 4;
  count: number;
}

/** 純函式：GitHub contributions 頁的 HTML → 每天一筆（照日期排序） */
export function parseContributions(html: string): ContribDay[] {
  const counts = new Map<string, number>();
  for (const m of html.matchAll(/<tool-tip[^>]*\bfor="([^"]+)"[^>]*>\s*(No|\d+)\s+contributions?\s+on/g)) {
    counts.set(m[1], m[2] === "No" ? 0 : Number(m[2]));
  }
  const days: ContribDay[] = [];
  for (const m of html.matchAll(/<td\b[^>]*>/g)) {
    const tag = m[0];
    const date = tag.match(/data-date="(\d{4}-\d{2}-\d{2})"/)?.[1];
    const level = Number(tag.match(/data-level="(\d)"/)?.[1]);
    const id = tag.match(/\bid="([^"]+)"/)?.[1];
    if (!date || !(level >= 0 && level <= 4)) continue;
    days.push({ date, level: level as ContribDay["level"], count: (id && counts.get(id)) || 0 });
  }
  days.sort((a, b) => a.date.localeCompare(b.date));
  if (days.length < 300) throw new Error(`GitHub 貢獻頁只解析到 ${days.length} 天，格式可能改了`);
  return days;
}

export async function getContributions(user: string): Promise<ContribDay[]> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 3600, expire: 86400 });
  const res = await fetch(`https://github.com/users/${user}/contributions`, {
    headers: { "user-agent": "kbs0830-site (contributions heatmap)" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`GitHub contributions HTTP ${res.status}`);
  return parseContributions(await res.text());
}
