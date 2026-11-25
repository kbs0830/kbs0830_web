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

/** 只給測試用 */
export function __closeDb() {
  db?.conn.close();
  db = null;
}
