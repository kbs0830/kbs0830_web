import "server-only";
import fs from "node:fs";
import path from "node:path";

// 從 TODO.md 解析出待辦項目，給後台的決策表用（TODO G1「決策表」，2026-11-26）。
// 每次請求才讀：正式站就是 repo 本身（server.js 會 chdir 到專案根目錄），push 之後 TODO.md 改了這裡馬上跟著變。
// 只收最外層的 `- [ ] **標題**…`（縮排的子項目是說明，不算一項）。
// id：標題開頭有編號（B16.、E1.）就用編號；沒有就用標題文字——改標題等於換一項，舊的決定會變成「找不到的項目」留在資料庫，不會亂套到別項。

export type Size = "L" | "M" | "S";
export type TodoItem = {
  id: string;
  code: string | null;
  title: string;
  summary: string;
  section: string;
  group: string | null;
  size: Size | null;
  needsYou: boolean;
  recommended: boolean;
};

const SIZE: Record<string, Size> = { "🟥": "L", "🟧": "M", "🟩": "S" };

/** 拿掉 markdown 標記（粗體、行內程式碼、連結），留純文字 */
const plain = (s: string) =>
  s
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\*\*|`/g, "")
    .replace(/\s+/g, " ")
    .trim();

/** 標題前的 emoji、編號這類裝飾拿掉 */
const cleanHeading = (s: string) => plain(s).replace(/^[^\p{L}\p{N}]+/u, "").trim();

export function parseTodo(md: string): TodoItem[] {
  const items: TodoItem[] = [];
  const seen = new Set<string>();
  let section = "";
  let group: string | null = null;
  for (const raw of md.split(/\r?\n/)) {
    const line = raw.replace(/^﻿/, "");
    const h2 = /^## (.+)/.exec(line);
    if (h2) { section = cleanHeading(h2[1]); group = null; continue; }
    const h3 = /^### (.+)/.exec(line);
    if (h3) { group = cleanHeading(h3[1]).replace(/（.*$/, ""); continue; }
    const bold = /^\*\*(.+)\*\*\s*$/.exec(line);
    if (bold) { group = cleanHeading(bold[1]).replace(/（.*$/, ""); continue; }
    const m = /^- \[ \] \*\*(.+?)\*\*(.*)$/.exec(line);
    if (!m || !section) continue;
    const titleRaw = plain(m[1]);
    const rest = m[2];
    const codeMatch = /^([A-Z]\d+)\.\s*(.+)$/.exec(titleRaw);
    const code = codeMatch?.[1] ?? null;
    const title = codeMatch?.[2] ?? titleRaw;
    // 標記只看標題後、第一個「：」之前（說明裡提到 🙋 的不算）
    const head = rest.split("：")[0];
    const sizeEmoji = Object.keys(SIZE).find((e) => head.includes(e));
    let id = code ?? `t:${title}`;
    if (seen.has(id)) id = `${id}#${items.filter((i) => i.id.startsWith(id)).length + 1}`;
    seen.add(id);
    const summary = plain(rest.includes("：") ? rest.slice(rest.indexOf("：") + 1) : rest);
    items.push({
      id,
      code,
      title,
      summary: summary.length > 140 ? `${summary.slice(0, 140)}…` : summary,
      section,
      group,
      size: sizeEmoji ? SIZE[sizeEmoji] : null,
      needsYou: head.includes("🙋") || section.startsWith("你要"),
      recommended: head.includes("⭐"),
    });
  }
  return items;
}

const todoPath = () => process.env.TODO_FILE || path.join(/* turbopackIgnore: true */ process.cwd(), "TODO.md");

/** 讀 TODO.md；讀不到回空陣列 */
export function readTodo(): TodoItem[] {
  try {
    return parseTodo(fs.readFileSync(todoPath(), "utf8"));
  } catch {
    return [];
  }
}
