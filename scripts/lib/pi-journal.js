// @ts-check
// 雷達樹莓派的系統 log 存一份到桌機（2026-11-28，使用者：「這些紀錄 log 都記錄到本機」）。
//
// 樹莓派上的 journal 只留 50 MB（約兩天），而且出事時常常是整台不見、要拔電重開。
// radar-health 每 5 分鐘 SSH 一次時順便跑 journalctl，用 cursor 只拿上次之後的新紀錄，
// 依台灣日期寫到 logs/pi/YYYY-MM-DD.log，留 90 天。
//
// 過濾掉的：我們自己每 5 分鐘 SSH 登入產生的 session／sudo 紀錄、fr24feed 每幾秒一行的心跳。
// ⚠️ 任何「key=…」的值都會遮掉（fr24feed 的分享金鑰不能落地）。

const fs = require("node:fs");
const path = require("node:path");
const { twDate } = require("./tw-time.js");

const KEEP_DAYS = 90;
const FIRST_SINCE = "-48h";

/** 我們自己輪詢、或每幾秒一次的心跳，存了只是淹掉重要的東西 */
const NOISE = [
  /^systemd\[(?!1\])\d+\]: /, // 每次 SSH 登入都會起一個 user manager（pid 不是 1）
  // pid 1 這邊跟使用者 session 有關的（session-N.scope、user@N、user-runtime-dir@N、run-user-N.mount、user-N.slice）
  /^systemd\[1\]: .*(session-\d+\.scope|user(-runtime-dir)?@\d+\.service|run-user-\d+\.mount|user-\d+\.slice)/,
  /^\((systemd|sd-pam)\)\[\d+\]: pam_unix\(systemd-user:session\)/,
  /^systemd-logind\[\d+\]: (New session \d+ of user|Session \d+ logged out|Removed session \d+)/,
  /^sshd\[\d+\]: (Accepted publickey for|Received disconnect from|Disconnected from user|pam_unix\(sshd:session\)|pam_env\(sshd:session\): deprecated)/,
  /^sudo\[\d+\]: /,
  /^CRON\[\d+\]: pam_unix\(cron:session\)/,
  /^fr24feed\[\d+\]: \[feed\]\[[a-z]\](ping \d+|syncing stream result|sent \d+,\d+ AC|filtering out \d+ overlapping AC)/,
  /^fr24feed\[\d+\]: \[time\]\[i\]Time synchronization confirmed/,
];

/** key=xxx、fr24key: xxx 這類的值換成 <redacted> @param {string} s */
const redact = (s) => s.replace(/\b([\w-]*key)(\s*[=:]\s*)("?)[^\s",;&]+\3/gi, "$1$2<redacted>");

/** UTC 時間轉成台灣時間的 ISO（+08:00） @param {number} ms */
const twIso = (ms) => new Date(ms + 8 * 3600_000).toISOString().slice(0, 19) + "+08:00";

const CURSOR_OK = /^[A-Za-z0-9=;_-]+$/;

/** 遠端要跑的指令：有 cursor 就從那之後，沒有就抓最近 48 小時 @param {string | null} cursor */
function journalScript(cursor) {
  const from = cursor && CURSOR_OK.test(cursor) ? `--after-cursor='${cursor}'` : `--since ${FIRST_SINCE}`;
  return `sudo -n journalctl --no-pager -o short-iso --show-cursor ${from}\n`;
}

/**
 * journalctl -o short-iso 的輸出 → 要存的行。多行訊息（開頭是空白）接在上一行後面。
 * @param {string} text
 * @returns {{ cursor: string | null, entries: { ms: number, line: string }[], dropped: number }}
 */
function parseJournal(text) {
  /** @type {{ ms: number, line: string }[]} */
  const entries = [];
  let cursor = null;
  let dropped = 0;
  let skipping = false;
  for (const raw of text.split(/\r?\n/)) {
    if (!raw) continue;
    const c = raw.match(/^-- cursor: (\S+)/);
    if (c) {
      cursor = c[1];
      continue;
    }
    if (raw.startsWith("-- ")) continue; // "-- No entries --"、"-- Boot …"
    const m = raw.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})([+-]\d{2})(\d{2}) \S+ (.*)$/);
    if (!m) {
      // 上一則的續行；上一則被濾掉就一起丟
      if (!skipping && entries.length) entries[entries.length - 1].line += "\n" + redact(raw);
      continue;
    }
    const ms = Date.parse(`${m[1]}${m[2]}:${m[3]}`);
    const msg = m[4];
    if (Number.isNaN(ms) || NOISE.some((re) => re.test(msg))) {
      dropped++;
      skipping = true;
      continue;
    }
    skipping = false;
    entries.push({ ms, line: `${twIso(ms)} ${redact(msg)}` });
  }
  return { cursor, entries, dropped };
}

/** 依台灣日期 append 到 dir/YYYY-MM-DD.log，順便刪掉超過 90 天的 @param {string} dir @param {{ ms: number, line: string }[]} entries @param {number} [now] */
function writeEntries(dir, entries, now = Date.now()) {
  fs.mkdirSync(dir, { recursive: true });
  /** @type {Map<string, string[]>} */
  const byDay = new Map();
  for (const e of entries) {
    const d = twDate(e.ms);
    const list = byDay.get(d) ?? [];
    list.push(e.line);
    byDay.set(d, list);
  }
  for (const [d, lines] of byDay) fs.appendFileSync(path.join(dir, `${d}.log`), lines.join("\n") + "\n");
  const oldest = twDate(now - KEEP_DAYS * 86400_000);
  for (const f of fs.readdirSync(dir)) {
    const m = f.match(/^(\d{4}-\d{2}-\d{2})\.log$/);
    if (m && m[1] < oldest) fs.rmSync(path.join(dir, f));
  }
  return byDay.size;
}

/**
 * 跑一次：讀 cursor → SSH 拿新紀錄 → 寫檔 → 存新 cursor。
 * 樹莓派重開後舊 cursor 還是有效（journal 存在記憶卡上），拿不到東西也不會重複寫。
 * @param {{ run: (script: string) => Promise<string>, dir: string, cursorFile: string, now?: number }} opts
 */
async function pullJournal({ run, dir, cursorFile, now = Date.now() }) {
  let cursor = null;
  try {
    cursor = fs.readFileSync(cursorFile, "utf8").trim() || null;
  } catch {}
  const out = await run(journalScript(cursor));
  const parsed = parseJournal(out);
  if (parsed.entries.length) writeEntries(dir, parsed.entries, now);
  if (parsed.cursor && parsed.cursor !== cursor) fs.writeFileSync(cursorFile, parsed.cursor);
  return { saved: parsed.entries.length, dropped: parsed.dropped };
}

module.exports = { NOISE, redact, twIso, journalScript, parseJournal, writeEntries, pullJournal };
