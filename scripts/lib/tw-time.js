// 台灣時間（UTC+8，沒有夏令時間）的日期／小時。2026-11-25 整理：原本 10 個檔案各寫一份 `new Date(ms + 8 * 3600_000)…`。
// 放在 scripts/lib（CommonJS）是因為 scripts/server.js 那邊的 JS 也要用；src/ 的 TS 直接 import 這支（跟 bot-patterns.js 一樣）。
// 所有統計檔的「哪一天」都用這個，日報／週報才對得起來。

const OFFSET_MS = 8 * 3600_000;

/** 台灣日期 YYYY-MM-DD；ms 預設現在 @param {number} [ms] */
const twDate = (ms = Date.now()) => new Date(ms + OFFSET_MS).toISOString().slice(0, 10);

/** 台灣時間的小時 0～23 @param {number} [ms] */
const twHour = (ms = Date.now()) => new Date(ms + OFFSET_MS).getUTCHours();

module.exports = { twDate, twHour };
