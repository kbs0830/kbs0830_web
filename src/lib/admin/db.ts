import "server-only";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { dataFile } from "@/lib/data-file";

// 站長後台的資料庫（TODO A1／G1 決策表，2026-11-26）：SQLite，用 Node 24 內建的 node:sqlite（不用裝套件，桌機不能手動 pnpm add）。
// 檔案在 data/admin.db（不進 git，ADMIN_DB_FILE 可以換；單元測試用 ":memory:"）。
// - 同步 API：跟 lib/data-file.ts 一樣，「讀 → 改 → 寫」中間沒有 await，單一 process 不會交錯
// - journal_mode = WAL（2026-11-27，TODO S1）：網站（後台按鈕）跟 scripts/admin-db.js 會同時寫同一個檔，WAL 讓讀寫互不擋。
//   ⚠️ WAL 模式下資料可能還在 admin.db-wal，備份不能直接複製 .db：用 `node scripts/admin-db.js backup <檔案>`（VACUUM INTO，一致的單檔）
// - 表結構用 PRAGMA user_version 做版本，要加欄位就在 MIGRATIONS 後面加一段，不要改舊的
// 給 Claude／排程讀：scripts/admin-db.js（CommonJS，同一個檔案）

export type Choice = "now" | "later" | "skip";
export const CHOICES: readonly Choice[] = ["now", "later", "skip"];

export type Decision = { itemId: string; choice: Choice | null; note: string; updatedAt: number };
export type AdminEvent = { id: number; at: number; action: string; detail: string };

const MIGRATIONS = [
  `CREATE TABLE decisions (
     item_id    TEXT PRIMARY KEY,
     choice     TEXT CHECK (choice IN ('now', 'later', 'skip')),
     note       TEXT NOT NULL DEFAULT '',
     updated_at INTEGER NOT NULL
   );
   CREATE TABLE admin_log (
     id     INTEGER PRIMARY KEY AUTOINCREMENT,
     at     INTEGER NOT NULL,
     action TEXT NOT NULL,
     detail TEXT NOT NULL DEFAULT ''
   );
   CREATE INDEX admin_log_at ON admin_log (at DESC);`,
  // 2：待辦本身搬進資料庫（2026-11-26 晚，使用者：「以後 todo 直接寫進網站後台，不用讀 MD」）
  `CREATE TABLE todos (
     id          TEXT PRIMARY KEY,
     code        TEXT,
     title       TEXT NOT NULL,
     detail      TEXT NOT NULL DEFAULT '',
     section     TEXT NOT NULL,
     grp         TEXT,
     size        TEXT CHECK (size IN ('L', 'M', 'S')),
     needs_you   INTEGER NOT NULL DEFAULT 0,
     recommended INTEGER NOT NULL DEFAULT 0,
     status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done', 'dropped')),
     sort        INTEGER NOT NULL,
     created_at  INTEGER NOT NULL,
     updated_at  INTEGER NOT NULL,
     done_at     INTEGER
   );
   CREATE INDEX todos_status_sort ON todos (status, sort);`,
  // 3：登入紀錄（2026-11-26，使用者：「紀錄登錄過的狀態」）。session：同一次 Cloudflare 登入（7 天內）／同一天的本機、家裡 IP 算一筆
  //    不存 IP、不存完整 User-Agent，只存「iPhone · Safari」這種摘要跟國家
  `CREATE TABLE logins (
     session  TEXT PRIMARY KEY,
     via      TEXT NOT NULL CHECK (via IN ('access', 'ip', 'local')),
     email    TEXT,
     country  TEXT,
     device   TEXT NOT NULL DEFAULT '',
     first_at INTEGER NOT NULL,
     last_at  INTEGER NOT NULL,
     views    INTEGER NOT NULL DEFAULT 1
   );
   CREATE INDEX logins_last ON logins (last_at DESC);`,
  // 4：完成紀錄（2026-11-26，使用者：「done.md 收進資料庫搬家」）。原本的 DONE.md 一段一筆；day 是標題裡的日期（舊的分類段落沒有＝null）
  `CREATE TABLE done_log (
     id         INTEGER PRIMARY KEY AUTOINCREMENT,
     day        TEXT,
     title      TEXT NOT NULL,
     body       TEXT NOT NULL DEFAULT '',
     sort       INTEGER NOT NULL,
     created_at INTEGER NOT NULL
   );
   CREATE INDEX done_log_sort ON done_log (sort);`,
  // 5：全文搜尋（2026-11-27，TODO S4）：SQLite FTS5＋trigram 分詞，中文不用斷詞，任意 3 字以上的片段都搜得到（2 字以下退回 LIKE，見 searchAdmin）。
  //    ⚠️ 刪除用 src IN (...)，不能用 src LIKE 'todo%'：FTS5 的未索引欄位用 LIKE 比對會永遠 0 筆（2026-11-27 實測）。
  //    一張 search 表放三個來源：待辦（src＝todo／todo:done／todo:dropped）、完成紀錄（done）、操作紀錄（log）；用 trigger 跟原表同步。
  `CREATE VIRTUAL TABLE search USING fts5(src UNINDEXED, ref UNINDEXED, title, body, tokenize = 'trigram');
   INSERT INTO search (src, ref, title, body) SELECT 'todo' || CASE WHEN status = 'open' THEN '' ELSE ':' || status END, id, title, detail FROM todos;
   INSERT INTO search (src, ref, title, body) SELECT 'done', CAST(id AS TEXT), title, body FROM done_log;
   INSERT INTO search (src, ref, title, body) SELECT 'log', CAST(id AS TEXT), action, detail FROM admin_log;
   CREATE TRIGGER search_todos_ai AFTER INSERT ON todos BEGIN
     INSERT INTO search (src, ref, title, body) VALUES ('todo' || CASE WHEN new.status = 'open' THEN '' ELSE ':' || new.status END, new.id, new.title, new.detail);
   END;
   CREATE TRIGGER search_todos_au AFTER UPDATE ON todos BEGIN
     DELETE FROM search WHERE src IN ('todo', 'todo:done', 'todo:dropped') AND ref = old.id;
     INSERT INTO search (src, ref, title, body) VALUES ('todo' || CASE WHEN new.status = 'open' THEN '' ELSE ':' || new.status END, new.id, new.title, new.detail);
   END;
   CREATE TRIGGER search_todos_ad AFTER DELETE ON todos BEGIN
     DELETE FROM search WHERE src IN ('todo', 'todo:done', 'todo:dropped') AND ref = old.id;
   END;
   CREATE TRIGGER search_done_ai AFTER INSERT ON done_log BEGIN
     INSERT INTO search (src, ref, title, body) VALUES ('done', CAST(new.id AS TEXT), new.title, new.body);
   END;
   CREATE TRIGGER search_done_au AFTER UPDATE ON done_log BEGIN
     DELETE FROM search WHERE src = 'done' AND ref = CAST(old.id AS TEXT);
     INSERT INTO search (src, ref, title, body) VALUES ('done', CAST(new.id AS TEXT), new.title, new.body);
   END;
   CREATE TRIGGER search_done_ad AFTER DELETE ON done_log BEGIN
     DELETE FROM search WHERE src = 'done' AND ref = CAST(old.id AS TEXT);
   END;
   CREATE TRIGGER search_log_ai AFTER INSERT ON admin_log BEGIN
     INSERT INTO search (src, ref, title, body) VALUES ('log', CAST(new.id AS TEXT), new.action, new.detail);
   END;
   CREATE TRIGGER search_log_ad AFTER DELETE ON admin_log BEGIN
     DELETE FROM search WHERE src = 'log' AND ref = CAST(old.id AS TEXT);
   END;`,
  // 6：部落格草稿審批（2026-11-28，使用者：「部落格的審核不要在 todo 裡面，後台要有一個 blog 專區」）。草稿檔還是 content/drafts/<slug>.mdx（不進 git），
  //    這裡只存審批狀態：pending 待審／approved 核准（Claude 讀到就搬進 content/blog 發布）／rejected 退回，加使用者的備註
  `CREATE TABLE blog_review (
     slug       TEXT PRIMARY KEY,
     status     TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
     note       TEXT NOT NULL DEFAULT '',
     updated_at INTEGER NOT NULL
   );`,
];

let db: { file: string; conn: DatabaseSync } | null = null;

export function getDb(): DatabaseSync {
  const file = dataFile("ADMIN_DB_FILE", "admin.db");
  if (db?.file === file) return db.conn;
  db?.conn.close();
  if (file !== ":memory:") fs.mkdirSync(path.dirname(file), { recursive: true });
  const conn = new DatabaseSync(file);
  conn.exec("PRAGMA busy_timeout = 3000; PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL;");
  migrate(conn);
  db = { file, conn };
  return conn;
}

function migrate(conn: DatabaseSync) {
  const { user_version: v } = conn.prepare("PRAGMA user_version").get() as { user_version: number };
  for (let i = v; i < MIGRATIONS.length; i++) {
    conn.exec("BEGIN");
    try {
      conn.exec(MIGRATIONS[i]);
      conn.exec(`PRAGMA user_version = ${i + 1}`);
      conn.exec("COMMIT");
    } catch (e) {
      conn.exec("ROLLBACK");
      throw e;
    }
  }
}

type DecisionRow = { item_id: string; choice: Choice | null; note: string; updated_at: number };
const toDecision = (r: DecisionRow): Decision => ({ itemId: r.item_id, choice: r.choice, note: r.note, updatedAt: r.updated_at });

export function listDecisions(): Decision[] {
  return (getDb().prepare("SELECT * FROM decisions ORDER BY updated_at DESC").all() as DecisionRow[]).map(toDecision);
}

/** 存一項的選擇＋備註。choice 是 null 而且沒有備註＝清掉這一列。回傳存好的結果（清掉回 null） */
export function saveDecision(itemId: string, choice: Choice | null, note: string, now = Date.now()): Decision | null {
  const conn = getDb();
  const trimmed = note.trim();
  if (!choice && !trimmed) {
    conn.prepare("DELETE FROM decisions WHERE item_id = ?").run(itemId);
    logEvent("decision.clear", itemId, now);
    return null;
  }
  conn
    .prepare(
      `INSERT INTO decisions (item_id, choice, note, updated_at) VALUES (?, ?, ?, ?)
       ON CONFLICT (item_id) DO UPDATE SET choice = excluded.choice, note = excluded.note, updated_at = excluded.updated_at`,
    )
    .run(itemId, choice, trimmed, now);
  logEvent("decision.set", `${itemId} → ${choice ?? "（只有備註）"}`, now);
  return { itemId, choice, note: trimmed, updatedAt: now };
}

/** 後台的操作紀錄（之後重寄信、清快取這類寫入動作也記在這裡）。只留最近 1000 筆 */
export function logEvent(action: string, detail = "", now = Date.now()) {
  const conn = getDb();
  conn.prepare("INSERT INTO admin_log (at, action, detail) VALUES (?, ?, ?)").run(now, action, detail.slice(0, 500));
  conn.prepare("DELETE FROM admin_log WHERE id <= (SELECT MAX(id) - 1000 FROM admin_log)").run();
}

export function recentEvents(limit = 20): AdminEvent[] {
  return getDb().prepare("SELECT id, at, action, detail FROM admin_log ORDER BY id DESC LIMIT ?").all(limit) as AdminEvent[];
}

// ── 待辦 ────────────────────────────────────────────────
export type TodoRow = {
  id: string;
  code: string | null;
  title: string;
  detail: string;
  section: string;
  grp: string | null;
  size: "L" | "M" | "S" | null;
  needs_you: number;
  recommended: number;
  status: "open" | "done" | "dropped";
  sort: number;
  created_at: number;
  updated_at: number;
  done_at: number | null;
};

export type TodoInput = {
  id: string;
  code: string | null;
  title: string;
  detail: string;
  section: string;
  group: string | null;
  size: "L" | "M" | "S" | null;
  needsYou: boolean;
  recommended: boolean;
  status: "open" | "done" | "dropped";
};

/** 全部待辦（含完成、不做），照 sort 排 */
export function listTodos(): TodoRow[] {
  return getDb().prepare("SELECT * FROM todos ORDER BY sort").all() as TodoRow[];
}

/** 從 TODO.md 一次匯入（只在 todos 表是空的時候呼叫）。照原本順序，sort 每項間隔 10，之後插隊有空間 */
export function importTodos(items: TodoInput[], now = Date.now()) {
  const conn = getDb();
  const stmt = conn.prepare(
    `INSERT OR IGNORE INTO todos (id, code, title, detail, section, grp, size, needs_you, recommended, status, sort, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  conn.exec("BEGIN");
  try {
    items.forEach((t, i) =>
      stmt.run(t.id, t.code, t.title, t.detail, t.section, t.group, t.size, t.needsYou ? 1 : 0, t.recommended ? 1 : 0, t.status, (i + 1) * 10, now, now),
    );
    conn.exec("COMMIT");
  } catch (e) {
    conn.exec("ROLLBACK");
    throw e;
  }
}

// ── 登入紀錄 ────────────────────────────────────────────
export type LoginRow = {
  session: string;
  via: "access" | "ip" | "local";
  email: string | null;
  country: string | null;
  device: string;
  first_at: number;
  last_at: number;
  views: number;
};

/** 記一次後台瀏覽：同一個 session 只更新最後時間、頁數＋1 */
export function recordLogin(row: { session: string; via: LoginRow["via"]; email?: string | null; country?: string | null; device: string }, now = Date.now()) {
  getDb()
    .prepare(
      `INSERT INTO logins (session, via, email, country, device, first_at, last_at, views) VALUES (?, ?, ?, ?, ?, ?, ?, 1)
       ON CONFLICT (session) DO UPDATE SET last_at = excluded.last_at, views = views + 1, device = excluded.device,
         country = COALESCE(excluded.country, country)`,
    )
    .run(row.session, row.via, row.email ?? null, row.country ?? null, row.device, now, now);
}

export function recentLogins(limit = 10): LoginRow[] {
  return getDb().prepare("SELECT * FROM logins ORDER BY last_at DESC LIMIT ?").all(limit) as LoginRow[];
}

// ── 完成紀錄 ────────────────────────────────────────────
export type DoneRow = { id: number; day: string | null; title: string; body: string; sort: number; created_at: number };

/** 完成紀錄，新的在前（sort 小的在前；新增的 sort 比現有最小的還小） */
export function listDone(): DoneRow[] {
  return getDb().prepare("SELECT * FROM done_log ORDER BY sort, id").all() as DoneRow[];
}

/** 新增一筆完成紀錄（放最前面）。day 預設今天（台灣） */
export function addDone(title: string, body: string, day: string | null = null, now = Date.now()): number {
  const conn = getDb();
  const sort = ((conn.prepare("SELECT MIN(sort) m FROM done_log").get() as { m: number | null }).m ?? 10) - 10;
  const d = day ?? new Date(now + 8 * 3600_000).toISOString().slice(0, 10);
  const r = conn.prepare("INSERT INTO done_log (day, title, body, sort, created_at) VALUES (?, ?, ?, ?, ?)").run(d, title, body, sort, now);
  logEvent("done.add", title, now);
  return Number(r.lastInsertRowid);
}

// ── 全文搜尋（TODO S4）────────────────────────────────────
export type SearchHit = { src: "todo" | "todo:done" | "todo:dropped" | "done" | "log"; ref: string; title: string; snippet: string };
export const SEARCH_LABEL: Record<SearchHit["src"], string> = { todo: "待辦", "todo:done": "待辦（已完成）", "todo:dropped": "待辦（不做）", done: "完成紀錄", log: "操作紀錄" };
/** 標出命中字的記號（結果字串裡用這兩個字元包起來，畫面再換成 <mark>） */
export const MARK_OPEN = "⟦";
export const MARK_CLOSE = "⟧";

/**
 * 搜全部：待辦、完成紀錄、操作紀錄。3 個字以上走 FTS5 trigram（有排序、命中處反白）；
 * trigram 搜不到 2 個字的詞（例「雷達」），退回 LIKE（沒有反白，標題或內文含這個字就算）。
 */
export function searchAdmin(query: string, limit = 40): SearchHit[] {
  const q = query.trim();
  if (!q) return [];
  const conn = getDb();
  if ([...q].length >= 3) {
    const phrase = `"${q.replace(/"/g, '""')}"`; // 整串當一個片語，使用者打的 - * : 這類符號才不會被當成 FTS 語法
    return conn
      .prepare(
        `SELECT src, ref, highlight(search, 2, ?, ?) AS title, snippet(search, 3, ?, ?, '…', 14) AS snippet
         FROM search WHERE search MATCH ? ORDER BY rank LIMIT ?`,
      )
      .all(MARK_OPEN, MARK_CLOSE, MARK_OPEN, MARK_CLOSE, phrase, limit) as SearchHit[];
  }
  // LIKE 的跳脫字元用 !（不用反斜線，免得在 SQL 字串跟 JS 字串之間來回跳脫）
  const like = `%${q.replace(/[!%_]/g, (c) => `!${c}`)}%`;
  return conn
    .prepare(
      `SELECT src, ref, title, substr(body, 1, 80) AS snippet FROM search
       WHERE title LIKE ? ESCAPE '!' OR body LIKE ? ESCAPE '!' LIMIT ?`,
    )
    .all(like, like, limit) as SearchHit[];
}

/** 只給測試用 */
export function __closeDb() {
  db?.conn.close();
  db = null;
}
