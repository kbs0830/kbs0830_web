// 畫面上的數字、日期格式（2026-11-25 整理：NumberFormat 原本 14 個檔案各 new 一個，月/日、時:分 也各寫一份）。
// 伺服器、瀏覽器都能用（沒有 Node 專用的東西）。

/** 千分位：1234 → "1,234"。用法 nf.format(n) */
export const nf = new Intl.NumberFormat("en-US");

/** "2026-11-05" → "11/5" */
export const monthDay = (date: string) => `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`;

const twClockFmt = new Intl.DateTimeFormat("zh-TW", { timeZone: "Asia/Taipei", hour: "2-digit", minute: "2-digit", hour12: false });
/** 毫秒時間 → 台灣時間 "14:05" */
export const twClock = (ms: number) => twClockFmt.format(ms);

const twDateTimeFmt = new Intl.DateTimeFormat("zh-TW", { timeZone: "Asia/Taipei", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });
/** ISO／毫秒 → 台灣時間 "11/25 14:05" */
export const twDateTime = (t: string | number) => twDateTimeFmt.format(new Date(t));

const regionNames = new Intl.DisplayNames(["zh-TW"], { type: "region" });
/** 國碼 → 中文國名（"TW" → "台灣"）。不是兩個大寫英文字母、或 Intl 不認得就回原字串——
 *  Intl.DisplayNames.of() 遇到格式不對的代碼會丟 RangeError，整頁就掛了（2026-11-25 安全檢查） */
export function regionName(code: string): string {
  if (!/^[A-Z]{2}$/.test(code)) return code;
  try {
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}
