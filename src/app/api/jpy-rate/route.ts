import { NextResponse } from "next/server";
import { getJpyRate } from "@/lib/jpy-rate";

// 日圓匯率作品頁的即時牌價＋近 90 天走勢（TODO D2）。伺服器端抓、記憶體快取（lib/jpy-rate.ts）。
export const dynamic = "force-dynamic";

export async function GET() {
  const r = await getJpyRate();
  return NextResponse.json(r ?? { banks: [], trend: [] }, { headers: { "cache-control": "no-store" } });
}
