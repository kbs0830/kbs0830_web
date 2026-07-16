import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const statsFile = path.join(process.cwd(), "data", "visitor-stats.json");

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
