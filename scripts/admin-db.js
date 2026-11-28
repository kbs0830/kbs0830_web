// 站長後台的資料庫（data/admin.db，src/lib/admin/db.ts 建的那份）的命令列工具。CommonJS。
// 2026-11-26 起待辦的正本在資料庫（使用者：「以後 todo 直接寫進網站後台，不用讀 MD」），TODO.md 不再更新。
//
// 讀：
//   node scripts/admin-db.js todo                 還沒做的待辦（照分區，附使用者的決定／備註）
//   node scripts/admin-db.js todo --all           含已完成、評估過不做
//   node scripts/admin-db.js todo show <id>       一項的完整說明
//   node scripts/admin-db.js decisions            使用者的決定（先做排最前面）
//   node scripts/admin-db.js log                  最近 20 筆後台操作
// 寫（Claude 用；說明要寫完整——背景、使用者原話、做法、要使用者做什麼）：
//   node scripts/admin-db.js todo add --title "…" --section "還沒做的點子" [--group "B. 網站功能"] [--code B22]
//        [--size S|M|L] [--you] [--star] [--detail "…" | --detail-file <檔案>]
//   node scripts/admin-db.js todo edit <id> [--title …] [--detail … | --detail-file …] [--append "…"] [--size …] [--group …] [--section …]
//   node scripts/admin-db.js todo done <id> [--note "做了什麼"]   完成（--note 會接在說明最後，並自動補一筆完成紀錄到 done_log；多項合併成一筆敘述時再另外 done add）
//   node scripts/admin-db.js todo drop <id> --note "理由"        評估過、不做
//   node scripts/admin-db.js todo reopen <id>
//   node scripts/admin-db.js todo ask <id> "問題"                Claude 有問題要使用者回答：接在說明最後一行「> **Claude 問（日期）**：…」，後台用紫色顯示、列表出現「Claude 有問題」標籤
//   node scripts/admin-db.js todo say <id> "備註"                Claude 的一般備註／回覆（同樣紫色，不加標籤）；使用者回答後，用 say 記下「使用者答：…」並處理掉問題（edit 把那行改成 say 的格式）
// 問題要寫成使用者一眼能回答的樣子（選項 A／B、要提供什麼）；使用者在後台的備註欄回答，讀到就處理。
//   node scripts/admin-db.js search <關鍵字>      待辦、完成紀錄、操作紀錄一次全文搜（FTS5 trigram，3 字以上最準；2 字以下 LIKE）。後台也有：/admin/search
// 完成紀錄（2026-11-26 起 DONE.md 的正本也在資料庫，done_log 表）：
//   node scripts/admin-db.js done [--limit 20]      最近的完成紀錄（日期、標題、字數）
//   node scripts/admin-db.js done show <id>         一筆的全文
//   node scripts/admin-db.js done search <關鍵字>   標題＋內文搜尋
//   node scripts/admin-db.js done add --title "…" [--day 2026-11-26] [--detail "…" | --detail-file <檔案>]   新增（放最前面；說明寫完整：使用者原話、做了什麼、怎麼驗證）
//   node scripts/admin-db.js done import [DONE.md]  只在 done_log 是空的時候，把舊的 DONE.md 一次匯入
// 部落格草稿（2026-11-28 起審批在後台 /admin/blog，不再放待辦）：
//   node scripts/admin-db.js blog                 content/drafts/ 的草稿與審批狀態（待審／已核准／已退回＋使用者備註）；已核准的才搬進 content/blog/ 發布
// id：有編號就是編號（B16），沒有就是 "t:標題"。ADMIN_DB_FILE 可以換檔案（跟網站同一個環境變數）。
// 資料庫要網站先開過一次後台（建表、從 TODO.md 匯入）；表還沒建會提示。
const path = require("node:path");
const fs = require("node:fs");
const { DatabaseSync } = require("node:sqlite");
const { parseDone } = require("./lib/parse-done");

// 在 Claude Code 的 worktree（<repo>/.claude/worktrees/<名字>）裡跑時，data/、content/drafts/ 都不在 git 裡、worktree 沒有：
// 不處理的話會在 worktree 裡建一個空的 admin.db，待辦寫進去、刪 worktree 就不見（2026-11-28，TODO C14）→ 一律用正式站資料夾那份
const here = path.join(__dirname, "..");
const root = /[\\/]\.claude[\\/]worktrees[\\/][^\\/]+$/.test(here) ? path.resolve(here, "../../..") : here;
const file = process.env.ADMIN_DB_FILE || path.join(root, "data", "admin.db");
const [cmd = "todo", ...rest] = process.argv.slice(2);
const tw = (ms) => new Date(ms + 8 * 3600_000).toISOString().slice(0, 16).replace("T", " ");
const LABEL = { now: "先做", later: "之後", skip: "不做" };
const SIZE = { L: "大", M: "中", S: "小" };

/** --key value／--flag 解析；第一個不是 -- 開頭的當位置參數 */
function parseArgs(args) {
  const out = { _: [] };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (!a.startsWith("--")) { out._.push(a); continue; }
    const key = a.slice(2);
    const next = args[i + 1];
    if (next === undefined || next.startsWith("--")) out[key] = true;
    else { out[key] = next; i++; }
  }
  return out;
}

if (!fs.existsSync(file)) {
  console.log(`還沒有資料庫（${file}）：先開一次 /admin/todo（網站會建表、從 TODO.md 匯入）。`);
  process.exit(0);
}
const writing =
  cmd === "backup" ||
  (cmd === "todo" && ["add", "edit", "done", "drop", "reopen", "ask", "say"].includes(rest[0])) || (cmd === "done" && ["add", "import"].includes(rest[0]));
const db = new DatabaseSync(file, { readOnly: !writing });
db.exec("PRAGMA busy_timeout = 3000");
if (writing) db.exec("PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL;"); // 跟網站（src/lib/admin/db.ts）同一套；唯讀連線不能改模式
const version = db.prepare("PRAGMA user_version").get().user_version;
if ((cmd === "todo") && version < 2) {
  console.log("資料庫還沒有 todos 表：先開一次 /admin/todo（網站會升級資料庫、從 TODO.md 匯入）。");
  process.exit(1);
}

if (cmd === "done" && version < 4) {
  if (rest[0] === "import" || rest[0] === "add") {
    // 同 src/lib/admin/db.ts 的 migration 4（網站還沒重啟過、表還沒建的時候先建起來）
    db.exec(`CREATE TABLE done_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT, day TEXT, title TEXT NOT NULL, body TEXT NOT NULL DEFAULT '',
      sort INTEGER NOT NULL, created_at INTEGER NOT NULL);
      CREATE INDEX done_log_sort ON done_log (sort);
      PRAGMA user_version = 4;`);
  } else {
    console.log("資料庫還沒有 done_log 表：網站升級重啟後開一次 /admin/done，或先跑 done import。");
    process.exit(1);
  }
}

const decisionsMap = () => new Map(db.prepare("SELECT item_id, choice, note FROM decisions").all().map((d) => [d.item_id, d]));
const log = (action, detail) =>
  db.prepare("INSERT INTO admin_log (at, action, detail) VALUES (?, ?, ?)").run(Date.now(), action, String(detail).slice(0, 500));
const getTodo = (id) => db.prepare("SELECT * FROM todos WHERE id = ?").get(id);
const need = (cond, msg) => { if (!cond) { console.error(msg); process.exit(1); } };

function readDetail(a) {
  if (a["detail-file"]) return fs.readFileSync(a["detail-file"], "utf8").replace(/\r\n/g, "\n").trimEnd();
  if (typeof a.detail === "string") return a.detail.replace(/\\n/g, "\n");
  return undefined;
}

if (cmd === "search") {
  // 全文搜尋（TODO S4）：待辦、完成紀錄、操作紀錄一次搜，跟後台 /admin/search 同一套（src/lib/admin/db.ts 的 searchAdmin）。
  // 3 個字以上走 FTS5 trigram（有排序，命中處用【】標出來）；2 個字以下退回 LIKE
  need(version >= 5, "資料庫還沒有 search 表：網站升級重啟、開一次後台之後才有（migration 5）。");
  const q = rest.join(" ").trim();
  need(q, "用法：node scripts/admin-db.js search <關鍵字>");
  const LABEL_SRC = { todo: "待辦", "todo:done": "待辦（已完成）", "todo:dropped": "待辦（不做）", done: "完成紀錄", log: "操作紀錄" };
  let rows;
  if ([...q].length >= 3) {
    const phrase = `"${q.replace(/"/g, '""')}"`;
    rows = db
      .prepare("SELECT src, ref, highlight(search, 2, '【', '】') AS title, snippet(search, 3, '【', '】', '…', 14) AS snippet FROM search WHERE search MATCH ? ORDER BY rank LIMIT 40")
      .all(phrase);
  } else {
    const like = `%${q.replace(/[!%_]/g, (c) => `!${c}`)}%`;
    rows = db.prepare("SELECT src, ref, title, substr(body, 1, 80) AS snippet FROM search WHERE title LIKE ? ESCAPE '!' OR body LIKE ? ESCAPE '!' LIMIT 40").all(like, like);
  }
  for (const r of rows) console.log(`[${LABEL_SRC[r.src] ?? r.src} ${r.ref}] ${r.title}${r.snippet ? `\n    ${r.snippet.replace(/\s+/g, " ")}` : ""}`);
  console.log(`\n${rows.length} 筆。`);
} else if (cmd === "backup") {
  // 備份（TODO S1）：WAL 模式下資料可能還在 admin.db-wal，直接複製 .db 會漏；VACUUM INTO 產生一致、單檔的備份。backup.ps1 用這個
  const dest = rest[0];
  need(dest, "用法：node scripts/admin-db.js backup <備份檔路徑>");
  fs.mkdirSync(path.dirname(path.resolve(dest)), { recursive: true });
  fs.rmSync(dest, { force: true });
  db.exec(`VACUUM INTO '${path.resolve(dest).replace(/'/g, "''")}'`);
  const check = new DatabaseSync(dest, { readOnly: true });
  const ok = check.prepare("PRAGMA integrity_check").get().integrity_check;
  const n = check.prepare("SELECT COUNT(*) n FROM todos").get().n;
  check.close();
  need(ok === "ok", `備份檔 integrity_check：${ok}`);
  console.log(`備份完成：${dest}（integrity_check ok、${n} 項待辦）`);
} else if (cmd === "decisions") {
  const order = { now: 0, later: 1, skip: 2 };
  const titles = version >= 2 ? new Map(db.prepare("SELECT id, title FROM todos").all().map((t) => [t.id, t.title])) : new Map();
  const rows = db.prepare("SELECT item_id, choice, note, updated_at FROM decisions").all();
  rows.sort((a, b) => (order[a.choice] ?? 3) - (order[b.choice] ?? 3) || b.updated_at - a.updated_at);
  if (rows.length === 0) console.log("還沒有任何決定。");
  for (const r of rows) {
    const name = titles.get(r.item_id) ?? r.item_id.replace(/^t:/, "");
    const code = r.item_id.startsWith("t:") ? "" : `${r.item_id} `;
    console.log(`${(LABEL[r.choice] ?? "備註").padEnd(3, "　")} ${code}${name}${r.note ? `　— ${r.note}` : ""}　(${tw(r.updated_at)})`);
  }
} else if (cmd === "blog") {
  const dir = path.join(root, "content", "drafts");
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".mdx")) : [];
  const rev = version >= 6 ? new Map(db.prepare("SELECT slug, status, note, updated_at FROM blog_review").all().map((r) => [r.slug, r])) : new Map();
  const LAB = { pending: "待審", approved: "已核准", rejected: "已退回" };
  const rows = files.map((f) => {
    const slug = f.slice(0, -4);
    const title = /^title:\s*"?(.*?)"?\s*$/m.exec(fs.readFileSync(path.join(dir, f), "utf8"))?.[1] ?? slug;
    return { slug, title, r: rev.get(slug) };
  });
  const order = { approved: 0, pending: 1, rejected: 2 };
  rows.sort((a, b) => order[a.r?.status ?? "pending"] - order[b.r?.status ?? "pending"]);
  if (rows.length === 0) console.log("沒有草稿（content/drafts/ 是空的）。");
  for (const { slug, title, r } of rows) console.log(`${LAB[r?.status ?? "pending"].padEnd(4, "　")} ${slug}　${title}${r?.note ? `　— ${r.note}` : ""}${r ? `　(${tw(r.updated_at)})` : ""}`);
  console.log("\n已核准的：搬進 content/blog/、日期改當天、跑 vitest（lib/content）、push；做完把結果回給使用者。");
} else if (cmd === "log") {
  for (const r of db.prepare("SELECT at, action, detail FROM admin_log ORDER BY id DESC LIMIT 20").all()) {
    console.log(`${tw(r.at)}  ${r.action}  ${r.detail}`);
  }
} else if (cmd === "todo") {
  const sub = rest[0] && !rest[0].startsWith("--") ? rest[0] : "list";
  const a = parseArgs(sub === "list" ? rest : rest.slice(1));
  const now = Date.now();

  if (sub === "list") {
    const rows = db.prepare(`SELECT * FROM todos ${a.all ? "" : "WHERE status = 'open'"} ORDER BY sort`).all();
    const dec = decisionsMap();
    let lastGroup = "";
    for (const t of rows) {
      const g = `${t.section}${t.grp ? ` · ${t.grp}` : ""}`;
      if (g !== lastGroup) { console.log(`\n## ${g}`); lastGroup = g; }
      const d = dec.get(t.id);
      const tags = [t.size && SIZE[t.size], t.needs_you && "要你", t.recommended && "推薦", t.status !== "open" && (t.status === "done" ? "✓完成" : "不做"), t.status === "open" && /^>\s*\*\*Claude 問/m.test(t.detail) && "❓Claude 有問題"].filter(Boolean).join("・");
      const decision = d ? `  ← ${d.choice ? LABEL[d.choice] : ""}${d.note ? `「${d.note}」` : ""}` : "";
      console.log(`- [${t.id}] ${t.title}${tags ? `（${tags}）` : ""}${decision}`);
    }
    console.log(`\n共 ${rows.length} 項。完整說明：node scripts/admin-db.js todo show <id>`);
  } else if (sub === "show") {
    const t = getTodo(a._[0]);
    need(t, `找不到 ${a._[0]}`);
    const d = decisionsMap().get(t.id);
    console.log(`[${t.id}] ${t.title}\n分區：${t.section}${t.grp ? ` · ${t.grp}` : ""}　狀態：${t.status}　大小：${t.size ?? "—"}${t.needs_you ? "　要你" : ""}${t.recommended ? "　推薦" : ""}`);
    if (d) console.log(`使用者的決定：${d.choice ? LABEL[d.choice] : "—"}${d.note ? `　備註：${d.note}` : ""}`);
    console.log(`更新：${tw(t.updated_at)}${t.done_at ? `　完成：${tw(t.done_at)}` : ""}\n\n${t.detail}`);
  } else if (sub === "add") {
    need(typeof a.title === "string" && typeof a.section === "string", "要 --title 跟 --section");
    const code = typeof a.code === "string" ? a.code : null;
    const id = code ?? `t:${a.title}`;
    need(!getTodo(id), `已經有 ${id} 了`);
    need(!a.size || SIZE[a.size], "--size 只能 S／M／L");
    const sort = (db.prepare("SELECT MAX(sort) m FROM todos").get().m ?? 0) + 10;
    db.prepare(
      `INSERT INTO todos (id, code, title, detail, section, grp, size, needs_you, recommended, status, sort, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?, ?)`,
    ).run(id, code, a.title, readDetail(a) ?? "", a.section, typeof a.group === "string" ? a.group : null, a.size || null, a.you ? 1 : 0, a.star ? 1 : 0, sort, now, now);
    log("todo.add", `${id} ${a.title}`);
    console.log(`新增 ${id}`);
  } else if (sub === "edit") {
    const t = getTodo(a._[0]);
    need(t, `找不到 ${a._[0]}`);
    let detail = readDetail(a) ?? t.detail;
    if (typeof a.append === "string") detail = `${detail}\n${a.append.replace(/\\n/g, "\n")}`.trim();
    need(!a.size || SIZE[a.size], "--size 只能 S／M／L");
    db.prepare("UPDATE todos SET title = ?, detail = ?, size = ?, section = ?, grp = ?, needs_you = ?, recommended = ?, updated_at = ? WHERE id = ?").run(
      typeof a.title === "string" ? a.title : t.title,
      detail,
      a.size || t.size,
      typeof a.section === "string" ? a.section : t.section,
      typeof a.group === "string" ? a.group : t.grp,
      a.you === true ? 1 : a["not-you"] ? 0 : t.needs_you,
      a.star === true ? 1 : a["no-star"] ? 0 : t.recommended,
      now,
      t.id,
    );
    log("todo.edit", t.id);
    console.log(`改好 ${t.id}`);
  } else if (sub === "ask" || sub === "say") {
    const t = getTodo(a._[0]);
    need(t, `找不到 ${a._[0]}`);
    const text = a._.slice(1).join(" ").replace(/\n/g, " ").trim();
    need(text, `要寫內容：todo ${sub} <id> "…"`);
    const label = sub === "ask" ? "Claude 問" : "Claude 備註";
    const line = `> **${label}（${tw(now).slice(0, 10)}）**：${text}`;
    db.prepare("UPDATE todos SET detail = ?, updated_at = ? WHERE id = ?").run(`${t.detail}
${line}`.trim(), now, t.id);
    log(`todo.${sub}`, `${t.id} ${text.slice(0, 120)}`);
    console.log(`${t.id} ← ${label}`);
  } else if (sub === "done" || sub === "drop" || sub === "reopen") {
    const t = getTodo(a._[0]);
    need(t, `找不到 ${a._[0]}`);
    need(sub !== "drop" || typeof a.note === "string", "不做要寫理由：--note \"…\"");
    const status = sub === "done" ? "done" : sub === "drop" ? "dropped" : "open";
    const tag = sub === "done" ? "✅ 完成" : sub === "drop" ? "不做的理由" : "重新打開";
    const detail = typeof a.note === "string" ? `${t.detail}\n**${tag}（${tw(now).slice(0, 10)}）**：${a.note.replace(/\\n/g, "\n")}`.trim() : t.detail;
    db.prepare("UPDATE todos SET status = ?, detail = ?, done_at = ?, updated_at = ? WHERE id = ?").run(status, detail, status === "open" ? null : now, now, t.id);
    // 完成的歷史只留 /admin/done 一份：待辦標完成時順手補一筆完成紀錄（2026-11-26，使用者同意「待辦的已完成跟完成會衝突」）
    if (sub === "done" && version >= 4) {
      const minSort = db.prepare("SELECT MIN(sort) m FROM done_log").get().m ?? 10;
      const title = `${t.code ? `${t.code} ` : ""}${t.title}`;
      const doneNote = typeof a.note === "string" ? a.note.replace(/\\n/g, "\n") : "完成";
      const body = [`- [x] ${doneNote}`, "", "**原待辦說明**", t.detail].join("\n");
      db.prepare("INSERT INTO done_log (day, title, body, sort, created_at) VALUES (?, ?, ?, ?, ?)").run(tw(now).slice(0, 10), title, body, minSort - 10, now);
      log("done.add", `（待辦完成）${title}`);
    }
    log(`todo.${sub}`, `${t.id} ${t.title}`);
    console.log(`${t.id} → ${status}`);
  } else {
    console.log("用法見 scripts/admin-db.js 開頭的說明");
    process.exitCode = 1;
  }
} else if (cmd === "done") {
  const sub = rest[0] && !rest[0].startsWith("--") ? rest[0] : "list";
  const a = parseArgs(sub === "list" ? rest : rest.slice(1));
  const getDone = (id) => db.prepare("SELECT * FROM done_log WHERE id = ?").get(Number(id));
  const line = (r) => `[${r.id}] ${r.day ?? "（無日期）"}　${r.title}　(${r.body.length} 字)`;

  if (sub === "list") {
    const rows = db.prepare("SELECT * FROM done_log ORDER BY sort, id LIMIT ?").all(Number(a.limit) || 20);
    for (const r of rows) console.log(line(r));
    console.log(`
共 ${db.prepare("SELECT COUNT(*) n FROM done_log").get().n} 筆。全文：node scripts/admin-db.js done show <id>`);
  } else if (sub === "show") {
    const r = getDone(a._[0]);
    need(r, `找不到 ${a._[0]}`);
    console.log(`${line(r)}

${r.body}`);
  } else if (sub === "search") {
    need(a._[0], "要給關鍵字");
    const like = `%${a._[0].replace(/[%_]/g, "")}%`;
    const rows = db.prepare("SELECT * FROM done_log WHERE title LIKE ? OR body LIKE ? ORDER BY sort, id").all(like, like);
    for (const r of rows) console.log(line(r));
    console.log(`
${rows.length} 筆符合。`);
  } else if (sub === "add") {
    need(typeof a.title === "string", "要 --title");
    need(!a.day || /^\d{4}-\d{2}-\d{2}$/.test(a.day), "--day 格式 YYYY-MM-DD");
    const sort = (db.prepare("SELECT MIN(sort) m FROM done_log").get().m ?? 10) - 10;
    const day = a.day || new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10);
    const r = db.prepare("INSERT INTO done_log (day, title, body, sort, created_at) VALUES (?, ?, ?, ?, ?)").run(day, a.title, readDetail(a) ?? "", sort, Date.now());
    log("done.add", a.title);
    console.log(`新增 [${r.lastInsertRowid}] ${a.title}`);
  } else if (sub === "import") {
    need(db.prepare("SELECT COUNT(*) n FROM done_log").get().n === 0, "done_log 已經有資料了，不重複匯入");
    const src = a._[0] || path.join(__dirname, "..", "DONE.md");
    const entries = parseDone(fs.readFileSync(src, "utf8"));
    need(entries.length > 0, `${src} 解析不出任何一筆`);
    const stmt = db.prepare("INSERT INTO done_log (day, title, body, sort, created_at) VALUES (?, ?, ?, ?, ?)");
    const now = Date.now();
    db.exec("BEGIN");
    try {
      for (const e of entries) stmt.run(e.day, e.title, e.body, e.sort, now);
      db.exec("COMMIT");
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
    log("done.import", `從 ${path.basename(src)} 匯入 ${entries.length} 筆`);
    console.log(`匯入 ${entries.length} 筆`);
  } else {
    console.log("用法見 scripts/admin-db.js 開頭的說明");
    process.exitCode = 1;
  }
} else {
  console.log("用法：node scripts/admin-db.js [todo|done|decisions|log]（詳見檔案開頭）");
  process.exitCode = 1;
}
db.close();
