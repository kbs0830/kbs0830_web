import { NextResponse, connection } from "next/server";
import { rareToday } from "@/lib/live/rare-today";
import { readUptime } from "@/lib/ops/status";

// 首頁頁尾兩個即時小東西（TODO Q2，2026-11-28）：「● 正常運作」跟「今日は珍しい機体」。
// 原本是首頁的 Server Component 在伺服器端即時讀檔（connection()），首頁因此變成「靜態外殼＋之後補送」，
// 整棵元件樹在 HTML 裡送了兩次（683KB）。改成瀏覽器載入後抓這支 API，首頁就可以是純靜態頁。
// status：今天（台灣）uptime 檢查全過＝ok；有失敗的檢查＝down 約幾分鐘（watchdog 每 5 分鐘一次）；今天還沒紀錄＝null。
// rare：今天雷達收到的稀有機型名稱（只有機型，不回時間、數量、座標：雷達隱私）。
export async function GET() {
  await connection();
  const today = readUptime(1).at(-1);
  const status = !today || today.checks === 0 ? null : { downMinutes: (today.checks - today.up) * 5 };
  return NextResponse.json({ status, rare: rareToday().map((e) => e.name) }, { headers: { "cache-control": "no-store" } });
}
