// 讀站長後台的資料庫（data/admin.db，src/lib/admin/db.ts 寫的那份）。唯讀，CommonJS。
// Claude 開工前：node scripts/admin-db.js decisions   → 「先做」排最前面，列出選擇跟備註
//               node scripts/admin-db.js log         → 最近 20 筆後台操作
// ADMIN_DB_FILE 可以換檔案（跟網站同一個環境變數）。
const path = require("node:path");
const fs = require("node:fs");
const { DatabaseSync } = require("node:sqlite");

const file = process.env.ADMIN_DB_FILE || path.join(__dirname, "..", "data", "admin.db");
if (!fs.existsSync(file)) {
  console.log(`還沒有資料庫（${file}）：後台還沒存過東西。`);
  process.exit(0);
}
const db = new DatabaseSync(file, { readOnly: true });
const cmd = process.argv[2] || "decisions";
const tw = (ms) => new Date(ms + 8 * 3600_000).toISOString().slice(0, 16).replace("T", " ");

if (cmd === "decisions") {
  const order = { now: 0, later: 1, skip: 2 };
  const label = { now: "先做", later: "之後", skip: "不做" };
  const rows = db.prepare("SELECT item_id, choice, note, updated_at FROM decisions").all();
  rows.sort((a, b) => (order[a.choice] ?? 3) - (order[b.choice] ?? 3) || b.updated_at - a.updated_at);
  if (rows.length === 0) console.log("還沒有任何決定。");
  for (const r of rows) {
    console.log(`${(label[r.choice] ?? "備註").padEnd(3, "　")} ${r.item_id.replace(/^t:/, "")}${r.note ? `　— ${r.note}` : ""}　(${tw(r.updated_at)})`);
  }
} else if (cmd === "log") {
  for (const r of db.prepare("SELECT at, action, detail FROM admin_log ORDER BY id DESC LIMIT 20").all()) {
    console.log(`${tw(r.at)}  ${r.action}  ${r.detail}`);
  }
} else {
  console.log("用法：node scripts/admin-db.js [decisions|log]");
  process.exitCode = 1;
}
db.close();
