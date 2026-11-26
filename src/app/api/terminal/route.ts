import { NextResponse, connection } from "next/server";
import { readSiteFacts } from "@/lib/ops/colophon";

// 首頁終端機（` 鍵）的 neofetch／uptime／status 指令用（TODO B2，2026-11-26）。
// 只回 /colophon、/status 已經公開的數字（執行時間、記憶體、可用率、上次部署、雷達在不在線），不回 log、路徑、IP。
export async function GET() {
  await connection(); // Cache Components：讀檔＋process 狀態要每次即時，不然 build 時凍結
  const f = readSiteFacts();
  return NextResponse.json(
    {
      uptimeSec: f.processUptime,
      memoryMB: f.memoryMB,
      node: process.versions.node,
      uptime30: f.uptime30,
      lastDeploy: f.lastDeploy,
      deploys90: f.deploys90,
      rollbacks90: f.rollbacks90,
      radar: f.radar,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
