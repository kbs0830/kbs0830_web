import { NextResponse } from "next/server";
import { getAirQuality } from "@/lib/air-quality";

// 空氣品質作品頁的「高雄現在」（TODO D5）。伺服器 30 分鐘跟 Open-Meteo 抓一次，用環境部公式算 AQI（lib/air-quality.ts）。
export const dynamic = "force-dynamic";

export async function GET() {
  const r = await getAirQuality();
  return NextResponse.json(r ? { ...r.value, fetchedAt: r.at, stale: r.stale } : { aqi: null }, { headers: { "cache-control": "no-store" } });
}
