import { NextResponse, connection } from "next/server";
import { getMetarRaw } from "@/lib/live/metar";

// 機場最新 METAR 電報原文（小工具 /tools/metar 的「載入最新」用）。?icao=RCKH，只支援 lib/tools/metar.ts 裡列的機場。
// 回 { icao, raw, at }；抓不到回 503。解碼在瀏覽器做，這裡只給原文。
export async function GET(req: Request) {
  await connection();
  const icao = (new URL(req.url).searchParams.get("icao") ?? "RCKH").toUpperCase();
  const m = /^[A-Z]{4}$/.test(icao) ? await getMetarRaw(icao) : null;
  if (!m) return NextResponse.json({ error: "沒有這個機場的電報" }, { status: 503, headers: { "cache-control": "no-store" } });
  return NextResponse.json({ icao, raw: m.raw, at: m.at }, { headers: { "cache-control": "no-store" } });
}
