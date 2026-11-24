import { NextResponse, type NextRequest } from "next/server";
import { cached } from "@/lib/live-cache";
import { CRAWLERS, parseRobots, verdict } from "@/lib/robots";
import { fetchPublicText, normalizeHost } from "@/lib/safe-fetch";

// AI 爬蟲檢查（TODO J12，2026-11-24）：GET /api/tools/robots?domain=example.com
// 抓對方的 robots.txt（＋看有沒有 llms.txt），判斷各家爬蟲能不能抓首頁。
// 防濫用：網域驗證＋連線時檢查 IP（lib/safe-fetch.ts）、每個 IP 10 分鐘 15 次、全站每小時 300 次、同一網域 10 分鐘快取。
// 不記錄誰查了什麼網域（只在記憶體算次數，重啟就清空）。
export const dynamic = "force-dynamic";

const perIp = new Map<string, number[]>();
let recent: number[] = [];

function limited(ip: string, now: number): boolean {
  recent = recent.filter((t) => now - t < 3600_000);
  const mine = (perIp.get(ip) ?? []).filter((t) => now - t < 600_000);
  if (recent.length >= 300 || mine.length >= 15) return true;
  mine.push(now);
  recent.push(now);
  if (perIp.size > 5000) perIp.clear();
  perIp.set(ip, mine);
  return false;
}

const isText = (r: { status: number; text: string } | null) => !!r && r.status >= 200 && r.status < 300 && !/<html/i.test(r.text.slice(0, 500));

async function check(host: string) {
  const [robots, llms] = await Promise.all([
    fetchPublicText(host, "/robots.txt"),
    fetchPublicText(host, "/llms.txt", { maxBytes: 2000 }).catch(() => null),
  ]);
  const found = isText(robots);
  const groups = found ? parseRobots(robots.text) : [];
  return {
    host,
    robots: { status: robots.status, found },
    llmsTxt: isText(llms),
    crawlers: CRAWLERS.map((c) => ({ ...c, ...verdict(groups, c.token) })),
  };
}

export async function GET(req: NextRequest) {
  const host = normalizeHost(req.nextUrl.searchParams.get("domain") ?? "");
  if (!host) return NextResponse.json({ error: "網域格式不對（例：example.com），不收 IP 跟內網名稱" }, { status: 400 });

  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
  if (limited(ip, Date.now())) return NextResponse.json({ error: "查太多次了，10 分鐘後再試" }, { status: 429 });

  let reason = "";
  const result = await cached(
    `robots:${host}`,
    10 * 60_000,
    () =>
      check(host).catch((e: unknown) => {
        reason = e instanceof Error ? e.message : String(e);
        throw e;
      }),
    { failRetryMs: 30_000 },
  );
  if (!result) return NextResponse.json({ error: `抓不到 ${host} 的 robots.txt${reason ? `（${reason}）` : ""}` }, { status: 502 });
  return NextResponse.json({ ...result.value, checkedAt: result.at }, { headers: { "cache-control": "no-store" } });
}
