import { NextResponse, type NextRequest } from "next/server";
import { readLimitedJson } from "@/lib/api/request-guard";
import { addHeroReport, heroStatsFile, parseHeroReport, readHeroStats } from "@/lib/stats/hero-stats";
import { writeJsonFile } from "@/lib/data-file";
import { isBrowserUA } from "../../../../scripts/lib/bot-patterns.js";
import { twDate } from "../../../../scripts/lib/tw-time.js";

// 首頁 3D 背景版本回報（決策表 B13）。HeroBackground 每個工作階段送一次 { variant }，WebGPU 退回時另外送 { fallback }。
// 跟 /api/visitor-stats 同樣的過濾：沒經過 Cloudflare（本機、CI）、機器人 UA 都不記。
// read-modify-write 中間沒有 await（同步 fs、單一 process），不會互相蓋掉，理由同 visitor-stats。

export async function POST(req: NextRequest) {
  const ua = req.headers.get("user-agent") || "";
  if (!req.headers.get("cf-ipcountry") || !isBrowserUA(ua)) return new NextResponse(null, { status: 204 });
  const report = parseHeroReport(await readLimitedJson(req, 300));
  if (!report) return new NextResponse(null, { status: 204 });

  writeJsonFile(heroStatsFile(), addHeroReport(readHeroStats(), report, twDate()));
  return new NextResponse(null, { status: 204 });
}
