import "server-only";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { dataFile } from "@/lib/data-file";

// 站長後台的資料庫（TODO A1／G1 決策表，2026-11-26）：SQLite，用 Node 24 內建的 node:sqlite（不用裝套件，桌機不能手動 pnpm add）。
// 檔案在 data/admin.db（不進 git，ADMIN_DB_FILE 可以換；單元測試用 ":memory:"）。
// - 同步 API：跟 lib/data-file.ts 一樣，「讀 → 改 → 寫」中間沒有 await，單一 process 不會交錯
// - journal_mode 用預設的 DELETE（不是 WAL）：寫入量很小，而且備份直接複製 .db 一個檔就完整
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
];

let db: { file: string; conn: DatabaseSync } | null = null;

export function getDb(): DatabaseSync {
  const file = dataFile("ADMIN_DB_FILE", "admin.db");
  if (db?.file === file) return db.conn;
  db?.conn.close();
  if (file !== ":memory:") fs.mkdirSync(path.dirname(file), { recursive: true });
  const conn = new DatabaseSync(file);
  conn.exec("PRAGMA busy_timeout = 3000; PRAGMA foreign_keys = ON;");
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

/** 只給測試用 */
export function __closeDb() {
  db?.conn.close();
  db = null;
}
