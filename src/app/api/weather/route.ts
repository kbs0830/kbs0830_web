import { NextResponse } from "next/server";
import { getWeather } from "@/lib/weather";

// 頁尾 LocalClock 讀的高雄／福岡天氣（TODO D3）。伺服器 30 分鐘跟 Open-Meteo 抓一次（lib/weather.ts）。
export const dynamic = "force-dynamic";

export async function GET() {
  const w = await getWeather();
  return NextResponse.json(w ? { cities: w.value, at: w.at } : { cities: [] }, { headers: { "cache-control": "no-store" } });
}
