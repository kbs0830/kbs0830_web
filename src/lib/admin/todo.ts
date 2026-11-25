import "server-only";
import fs from "node:fs";
import path from "node:path";
import { importTodos, listTodos, logEvent, type TodoRow } from "@/lib/admin/db";

// 站長後台的待辦（TODO G1「決策表」，2026-11-26）。
// 2026-11-26 晚（使用者：「以後 todo 直接寫進網站後台，不用讀 MD，直接看資料庫變化」）：待辦的正本改成 data/admin.db 的 todos 表。
// - 第一次讀到空的 todos 表時，從 TODO.md 匯入一次（含每一項底下的子項目說明、「評估過、先不做」那些標成 dropped），之後就不再讀 TODO.md
// - 之後新增／完成都寫資料庫：Claude 用 `node scripts/admin-db.js todo …`（見那支的說明）
// parseTodo 留著給匯入跟測試用。

export type Size = "L" | "M" | "S";
export type TodoStatus = "open" | "done" | "dropped";
export type TodoItem = {
  id: string;
  code: string | null;
  title: string;
  /** 一行摘要（列表用） */
  summary: string;
  /** 完整說明（markdown：第一行的說明＋底下縮排的子項目），後台點開看 */
  detail: string;
  section: string;
  group: string | null;
  size: Size | null;
  needsYou: boolean;
  recommended: boolean;
  status: TodoStatus;
  doneAt?: number | null;
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

/** 一行摘要：說明的第一行，拿掉開頭的「（日期、使用者原話）」跟「**進度**：」這類前綴；第一行只剩括號就往下一行找 */
const summarize = (detail: string) => {
  const strip = (l: string) => {
    let s = plain(l).replace(/^[-*]\s+/, "");
    if (s.startsWith("（")) {
      let depth = 0, end = -1;
      for (let i = 0; i < s.length; i++) {
        if (s[i] === "（") depth++;
        else if (s[i] === "）" && --depth === 0) { end = i; break; }
      }
      if (end >= 0) s = s.slice(end + 1);
    }
    s = s.replace(/^[：:\s]+/, "");
    const colon = s.indexOf("：");
    if (colon >= 0 && colon <= 8) s = s.slice(colon + 1).trim(); // 「進度：」「做法：」這種短前綴
    return s;
  };
  let first = "";
  for (const l of detail.split("\n")) {
    first = strip(l);
    if (first) break;
  }
  return first.length > 140 ? `${first.slice(0, 140)}…` : first;
};

/**
 * 解析 TODO.md：最外層的 `- [ ] **標題**…`（待辦）、`- **標題**…`（「評估過、先不做」裡的＝dropped）、`### 🟥 A1 標題`（大段設計）。
 * 每一項後面縮排的行、以及 ### 底下到下一個標題前的內容，都收進 detail。
 * id：標題開頭有編號（B16.、E1.）就用編號；沒有就用標題文字。
 */
export function parseTodo(md: string): TodoItem[] {
  const items: TodoItem[] = [];
  const seen = new Set<string>();
  let section = "";
  let group: string | null = null;
  let cur: { item: TodoItem; lines: string[]; block: boolean } | null = null;

  const finish = () => {
    if (!cur) return;
    const extra = cur.lines.join("\n").replace(/\s+$/, "");
    const detail = [cur.item.detail, extra].filter(Boolean).join("\n");
    cur.item.detail = detail;
    if (!cur.item.summary) cur.item.summary = summarize(cur.block ? extra.replace(/^\s*\n/, "") : detail);
    items.push(cur.item);
    cur = null;
  };

  const makeId = (code: string | null, title: string) => {
    let id = code ?? `t:${title}`;
    if (seen.has(id)) id = `${id}#${items.filter((i) => i.id.startsWith(id)).length + 2}`;
    seen.add(id);
    return id;
  };

  for (const raw of md.split(/\r?\n/)) {
    const line = raw.replace(/^﻿/, "");
    const h2 = /^## (.+)/.exec(line);
    if (h2) { finish(); section = cleanHeading(h2[1]).replace(/（.*$/, ""); group = null; continue; }
    const h3 = /^### (.+)/.exec(line);
    if (h3) {
      finish();
      const text = h3[1];
      const codeMatch = /([A-Z]\d+)\s+(.+)$/.exec(plain(text).replace(/[🟥🟧🟩⭐🙋]/gu, "").trim());
      if (codeMatch && section) {
        // 大段設計（### 🟥 A1 站長後台 …）：整段收成一項，底下的段落、表格都是說明
        const title = codeMatch[2].replace(/（.*$/, "").trim();
        const sizeEmoji = Object.keys(SIZE).find((e) => text.includes(e));
        cur = {
          block: true,
          lines: [],
          item: {
            id: makeId(codeMatch[1], title), code: codeMatch[1], title, summary: "", detail: "",
            section, group: null, size: sizeEmoji ? SIZE[sizeEmoji] : null,
            needsYou: text.includes("🙋"), recommended: text.includes("⭐"), status: "open",
          },
        };
        group = null;
      } else {
        group = cleanHeading(text).replace(/（.*$/, "");
      }
      continue;
    }
    // 整行粗體＝分組（**B. 網站功能**）；但在 ### 大段裡，**門禁（兩層）** 這種是段落小標，只有「字母＋點」的才算新分組
    const bold = /^\*\*(.+)\*\*\s*$/.exec(line);
    if (bold && (!cur?.block || /^\*\*[A-Z]\. /.test(line))) { finish(); group = cleanHeading(bold[1]).replace(/（.*$/, ""); continue; }

    const m = /^- (\[ \] )?\*\*(.+?)\*\*(.*)$/.exec(line);
    const isDropped = section.startsWith("評估過");
    if (m && section && (m[1] || isDropped) && !/^- \[x\]/i.test(line)) {
      finish();
      // 有些標記寫在粗體裡（**A2. 停電也不斷線 ⭐ 🙋**）：拿出來當旗標，標題只留文字
      const marks = m[2];
      const titleRaw = plain(marks).replace(/[🟥🟧🟩⭐🙋]/gu, "").replace(/\s+/g, " ").trim();
      const rest = m[3];
      const codeMatch = /^([A-Z]\d+)\.\s*(.+)$/.exec(titleRaw);
      const code = codeMatch?.[1] ?? null;
      const title = codeMatch?.[2] ?? titleRaw;
      // 標記只看標題後、第一個「：」之前（說明裡提到 🙋 的不算）
      const head = marks + rest.split("：")[0];
      const sizeEmoji = Object.keys(SIZE).find((e) => head.includes(e));
      // 第一行的說明：標題後面整段（含括號裡的日期、使用者原話），不截斷
      const firstLine = rest.replace(/^\s*[🟥🟧🟩⭐🙋\s]*/u, "").replace(/^：/, "").trim();
      cur = {
        block: false,
        lines: [],
        item: {
          id: makeId(code, title), code, title,
          summary: summarize(firstLine),
          detail: firstLine, section, group, size: sizeEmoji ? SIZE[sizeEmoji] : null,
          needsYou: head.includes("🙋"), recommended: head.includes("⭐"), status: isDropped ? "dropped" : "open",
        },
      };
      continue;
    }
    if (cur) {
      // 縮排的續行（子項目）一律收；### 大段的話連沒縮排的段落、表格也收，直到下一個標題
      if (/^\s+\S/.test(line)) { cur.lines.push(line.replace(/^ {2}/, "")); continue; }
      if (cur.block) { cur.lines.push(line); continue; }
      if (line.trim() === "") continue;
      finish();
    }
  }
  finish();
  return items;
}

const todoPath = () => process.env.TODO_FILE || path.join(/* turbopackIgnore: true */ process.cwd(), "TODO.md");

const fromRow = (r: TodoRow): TodoItem => ({
  id: r.id, code: r.code, title: r.title, summary: summarize(r.detail), detail: r.detail,
  section: r.section, group: r.grp, size: r.size, needsYou: !!r.needs_you, recommended: !!r.recommended,
  status: r.status, doneAt: r.done_at,
});

/** 讀資料庫裡的待辦（預設只有還沒做的）。todos 表是空的就先從 TODO.md 匯入一次 */
export function readTodo({ all = false }: { all?: boolean } = {}): TodoItem[] {
  try {
    let rows = listTodos();
    if (rows.length === 0) {
      let md = "";
      try { md = fs.readFileSync(todoPath(), "utf8"); } catch {}
      const parsed = parseTodo(md);
      if (parsed.length > 0) {
        importTodos(parsed);
        logEvent("todo.import", `從 TODO.md 匯入 ${parsed.length} 項`);
        rows = listTodos();
      }
    }
    const items = rows.map(fromRow);
    return all ? items : items.filter((i) => i.status === "open");
  } catch {
    return [];
  }
}
