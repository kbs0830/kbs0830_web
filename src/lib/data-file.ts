import fs from "node:fs";
import path from "node:path";

// data/ 跟 logs/ 底下執行期資料檔的共用讀寫（2026-11-25 整理：原本 13 個檔案各寫一份路徑、16 處各寫一份 try { JSON.parse(readFileSync) }）。
//
// 路徑：production 由 scripts/server.js 用環境變數傳絕對路徑（Task Scheduler 啟動時 cwd 不保證是專案根目錄），
// 測試（3200）也靠環境變數把檔案指到暫存區；沒設就退回 process.cwd()/data。每次呼叫才讀環境變數，測試才能換檔案。
// turbopackIgnore：這些是執行期資料，不是程式碼依賴，不要被 build 追蹤（曾經跳過 NFT over-trace 警告）。
//
// 寫入一律同步（fs.*Sync）：好幾支 API 是「讀 → 改 → 寫」，中間沒有 await 才不會兩個請求交錯蓋掉（單一 process，見 /api/visitor-stats）。

/** data/ 底下的檔案；envName 有設就用它（例：dataFile("VISITOR_STATS_FILE", "visitor-stats.json")） */
export const dataFile = (envName: string | null, fileName: string) =>
  (envName && process.env[envName]) || path.join(/* turbopackIgnore: true */ process.cwd(), "data", fileName);

/** logs/ 底下的檔案（LOGS_DIR 可以換） */
export const logFile = (fileName: string) =>
  path.join(process.env.LOGS_DIR || path.join(/* turbopackIgnore: true */ process.cwd(), "logs"), fileName);

/** 讀 JSON；檔案不存在或壞掉回 null */
export function readJsonFile<T>(file: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return null;
  }
}

/**
 * 寫 JSON（自動建資料夾）。atomic：先寫 .tmp 再改名，寫到一半斷電也不會留下壞檔（背景記錄器用）。
 * 失敗回 false，不丟例外：統計少記一筆不該讓請求失敗。
 */
export function writeJsonFile(file: string, value: unknown, { atomic = false } = {}): boolean {
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    if (atomic) {
      fs.writeFileSync(`${file}.tmp`, JSON.stringify(value));
      fs.renameSync(`${file}.tmp`, file);
    } else {
      fs.writeFileSync(file, JSON.stringify(value));
    }
    return true;
  } catch {
    return false;
  }
}
