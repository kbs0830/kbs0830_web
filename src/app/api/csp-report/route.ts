import { NextRequest, NextResponse, connection } from "next/server";
import { dataFile, readJsonFile, writeJsonFile } from "@/lib/data-file";

// Content-Security-Policy 先 report-only（TODO 點子，2026-11-09）：瀏覽器照常載入，只是把「如果正式開會被擋的東西」
// 回報到這裡。累積一陣子確認沒有誤擋，再把 next.config.ts 的 header 從 -Report-Only 改成正式的。
//
// 只存「被擋的指令 + 來源網域 + 頁面路徑 → 次數」，不存 IP、UA、完整網址（query string 可能有個資）。
// 跟 /api/web-vitals 一樣只收經過 Cloudflare 的（有 cf-ipcountry），CI／本機測試不算。
// 看結果：curl https://kbs0830.com/api/csp-report
const reportFile = () => dataFile("CSP_REPORT_FILE", "csp-reports.json");

const MAX_KEYS = 300;

type Counts = Record<string, number>;

const read = (): Counts => readJsonFile<Counts>(reportFile()) ?? {};

/** blocked-uri 只留到網域（inline／eval／data 這種關鍵字原樣保留） */
export function blockedSource(uri: string): string {
  if (!uri) return "(none)";
  try {
    const u = new URL(uri);
    return u.protocol === "http:" || u.protocol === "https:" ? u.origin : `${u.protocol}`;
  } catch {
    return uri.slice(0, 40);
  }
}

/** 舊格式（report-uri：{"csp-report": {...}}）跟新格式（Reporting API：[{type, body}]）都收 */
export function parseReports(json: unknown): { directive: string; blocked: string; page: string }[] {
  const items = Array.isArray(json) ? json.map((r) => r?.body) : [(json as { "csp-report"?: unknown })?.["csp-report"]];
  return items
    .filter((r): r is Record<string, string> => !!r && typeof r === "object")
    .map((r) => {
      const directive = String(r["effective-directive"] ?? r.effectiveDirective ?? r["violated-directive"] ?? "?").split(" ")[0];
      const blocked = blockedSource(String(r["blocked-uri"] ?? r.blockedURL ?? ""));
      let page = "?";
      try {
        page = new URL(String(r["document-uri"] ?? r.documentURL ?? "")).pathname.replace(/^\/(projects|blog)\/[^/]+$/, "/$1/slug");
      } catch {}
      return { directive: directive.slice(0, 40), blocked, page: page.slice(0, 60) };
    });
}

export async function POST(req: NextRequest) {
  if (!req.headers.get("cf-ipcountry")) return new NextResponse(null, { status: 204 });
  const text = await req.text();
  if (text.length > 20_000) return new NextResponse(null, { status: 413 });

  let reports: ReturnType<typeof parseReports> = [];
  try {
    reports = parseReports(JSON.parse(text));
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  // 同步 read-modify-write，理由同 /api/visitor-stats（單一 process、中間沒有 await）
  const counts = read();
  for (const r of reports) {
    const key = `${r.directive} ${r.blocked} @ ${r.page}`;
    if (counts[key] === undefined && Object.keys(counts).length >= MAX_KEYS) continue;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  writeJsonFile(reportFile(), counts);
  return new NextResponse(null, { status: 204 });
}

export async function GET() {
  await connection(); // Cache Components：同步讀檔不算「即時」，不加這行 build 時會把當下的數字凍結（TODO C13）
  const sorted = Object.entries(read()).sort((a, b) => b[1] - a[1]);
  return NextResponse.json({ total: sorted.reduce((n, [, c]) => n + c, 0), reports: Object.fromEntries(sorted) });
}
