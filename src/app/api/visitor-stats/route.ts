import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// production 由 scripts/server.js 透過 VISITOR_STATS_FILE 傳絕對路徑進來，
// 因為 Task Scheduler 啟動時的 process.cwd() 不保證是專案根目錄。
// `next dev` 沒有這個環境變數，fallback 回 process.cwd()（本機開發時就是專案根目錄）。
const statsFile = process.env.VISITOR_STATS_FILE || path.join(process.cwd(), "data", "visitor-stats.json");

export async function GET() {
  let stats: Record<string, number> = {};
  try {
    stats = JSON.parse(fs.readFileSync(statsFile, "utf8"));
  } catch {
    stats = {};
  }

  const entries = Object.entries(stats).filter(([code]) => code !== "XX");
  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  const top = entries.sort((a, b) => b[1] - a[1]).slice(0, 5);

  return NextResponse.json({ total, countryCount: entries.length, top });
}
