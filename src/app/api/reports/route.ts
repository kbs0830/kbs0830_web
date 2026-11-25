import { NextResponse, type NextRequest } from "next/server";
import { buildReport, reportText, resolveRange, type Period } from "@/lib/stats/reports";

// 日報／週報／月報的資料（2026-11-25）。給 scripts/report-mail.ps1 在桌機上拿純文字版寄信用：
//   GET http://localhost:3000/api/reports?period=week&anchor=2026-11-17&format=text
// 只收本機的請求：經過 Cloudflare 進來的一定帶 cf-ipcountry／cf-connecting-ip（Cloudflare 自己加，外面拿不掉），有就 404。
// 網頁版是 /reports（同一份 lib/stats/reports.ts）。
export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  if (req.headers.get("cf-ipcountry") || req.headers.get("cf-connecting-ip")) return new NextResponse(null, { status: 404 });
  const q = req.nextUrl.searchParams;
  const p = q.get("period");
  const period: Period = p === "week" || p === "month" ? p : "day";
  const report = buildReport(resolveRange(period, q.get("anchor") ?? undefined));
  if (q.get("format") === "text") {
    return new NextResponse(reportText(report), { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
  }
  return NextResponse.json(report, { headers: { "cache-control": "no-store" } });
}
