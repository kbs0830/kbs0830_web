// DONE.md → 完成紀錄的列（2026-11-26 搬進 data/admin.db 的 done_log 表用）。CommonJS，scripts/admin-db.js 跟單元測試共用。
// 規則：`## ` 開一筆（底下的 `### ` 都算它的內文）；沒有被 `## ` 包住的 `### ` 各自一筆。第一個標題之前的前言不要。
// day：標題裡第一個 YYYY-MM-DD（「2026-11-04～05」取 11-04）；標題沒日期的（舊的分類段落）是 null，排在最後。

/** 標題前的 emoji 這類裝飾拿掉，留文字 */
const cleanTitle = (s) => s.replace(/\*\*|`/g, "").replace(/^[^\p{L}\p{N}]+/u, "").trim();
/** 標題開頭的日期（「2026-11-04～05 」「2026-11-03 — 」）：日期另外存在 day，標題不重複 */
const stripDate = (t) => t.replace(/^\d{4}-\d{2}-\d{2}(?:～\d{2}(?:-\d{2})?)?\s*[—-]?\s*/, "") || t;

/** @param {string} md @returns {{ day: string | null, title: string, body: string, sort: number }[]} */
function parseDone(md) {
  const entries = [];
  /** @type {{ heading: string, level: number, lines: string[] } | null} */
  let cur = null;
  const finish = () => {
    if (!cur) return;
    const body = cur.lines.join("\n").replace(/^\s*\n/, "").replace(/\s+$/, "");
    const day = /\d{4}-\d{2}-\d{2}/.exec(cur.heading)?.[0] ?? null;
    entries.push({ day, title: stripDate(cleanTitle(cur.heading)), body, sort: (entries.length + 1) * 10 });
    cur = null;
  };
  for (const raw of md.split(/\r?\n/)) {
    const line = raw.replace(/^﻿/, "");
    const h2 = /^## (.+)/.exec(line);
    const h3 = /^### (.+)/.exec(line);
    if (h2 || (h3 && cur?.level !== 2)) {
      finish();
      cur = { heading: (h2 ?? h3)[1], level: h2 ? 2 : 3, lines: [] };
    } else if (cur) {
      cur.lines.push(line);
    }
  }
  finish();
  return entries;
}

module.exports = { parseDone };
