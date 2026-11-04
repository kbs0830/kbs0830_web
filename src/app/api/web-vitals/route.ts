import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// 真實訪客的 Core Web Vitals（WebVitals.tsx 用 sendBeacon 回報）。用來回答「首頁 LCP 要不要
// 為了分數縮短 Hero 進場動畫」這類問題——Lighthouse 是模擬值，這裡是訪客實際的體驗。
// 只存「指標名稱＋頁面路徑＋數值」，不存 IP、UA 或任何能識別人的東西（同 visitor-stats）。
// 檔案路徑、同步 read-modify-write 的理由都跟 api/visitor-stats/route.ts 一樣。
const vitalsFile =
  process.env.WEB_VITALS_FILE ||
  path.join(/* turbopackIgnore: true */ process.cwd(), "data", "web-vitals.json");

const BOT_UA_PATTERN = /bot|spider|crawl|slurp|facebookexternalhit|preview|curl|wget|python-requests|axios|scrapy|headless/i;
const METRICS = new Set(["LCP", "INP", "CLS", "FCP", "TTFB"]);
// 每個「頁面 × 指標」只留最近幾筆，檔案不會無限長大；算 p75 這樣就夠
const KEEP = 200;
// 只收站上真的有的路徑形狀，擋掉亂打的字串把檔案灌爆
const PATH_PATTERN = /^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)?)?$/;

type Vitals = Record<string, Record<string, number[]>>; // path → metric → 最近的數值

function readVitals(): Vitals {
  try {
    return JSON.parse(fs.readFileSync(vitalsFile, "utf8"));
  } catch {
    return {};
  }
}

const p75 = (values: number[]) => [...values].sort((a, b) => a - b)[Math.floor((values.length - 1) * 0.75)];

// GET：每頁每個指標的樣本數跟 p75（Google 判斷 Core Web Vitals 及格與否用的就是 p75）
export async function GET() {
  const vitals = readVitals();
  const summary = Object.fromEntries(
    Object.entries(vitals).map(([page, metrics]) => [
      page,
      Object.fromEntries(Object.entries(metrics).map(([name, values]) => [name, { n: values.length, p75: p75(values) }])),
    ])
  );
  return NextResponse.json(summary);
}

export async function POST(req: NextRequest) {
  // 只收從 Cloudflare 進來的（真實訪客一定經過 Tunnel，cf-ipcountry 是 Cloudflare edge 加的）。
  // 本機測試、CI 的 E2E 直接打 localhost，沒有這個 header——2026-11-04 上線幾分鐘就被 E2E 灌了
  // 40 幾筆（Playwright 的 Desktop Chrome UA 不含 headless，UA 過濾擋不到）
  if (!req.headers.get("cf-ipcountry") || BOT_UA_PATTERN.test(req.headers.get("user-agent") || "")) {
    return new NextResponse(null, { status: 204 });
  }

  let body: unknown;
  try {
    body = JSON.parse(await req.text());
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const { name, value, page } = (body ?? {}) as Record<string, unknown>;
  if (
    typeof name !== "string" || !METRICS.has(name) ||
    typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 60_000 ||
    typeof page !== "string" || !PATH_PATTERN.test(page)
  ) {
    return new NextResponse(null, { status: 400 });
  }

  // await 都在上面；從這裡開始到寫檔是同步的，不會跟其他 request 交錯（見 visitor-stats）
  const vitals = readVitals();
  const values = ((vitals[page] ??= {})[name] ??= []);
  values.push(name === "CLS" ? Math.round(value * 1000) / 1000 : Math.round(value));
  if (values.length > KEEP) values.splice(0, values.length - KEEP);

  try {
    fs.mkdirSync(path.dirname(vitalsFile), { recursive: true });
    fs.writeFileSync(vitalsFile, JSON.stringify(vitals));
  } catch {
    // 寫檔失敗就算了，少一筆樣本不影響什麼
  }
  return new NextResponse(null, { status: 204 });
}
