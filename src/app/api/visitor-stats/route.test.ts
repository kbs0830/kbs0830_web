import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { NextRequest } from "next/server";

// route.ts 在 module 頂層用 process.env.VISITOR_STATS_FILE（沒設就 fallback
// process.cwd()）決定資料檔路徑，所以每個測試要在 import 之前先設好環境變數、
// 並用 vi.resetModules() 強制重新載入 module，才會讀到各自獨立的暫存檔，
// 不會互相污染、也不會動到 data/visitor-stats.json 這份正式資料。
describe("visitor-stats API route", () => {
  let statsFile: string;
  let rawFile: string;
  let detailFile: string;
  let featureFile: string;

  beforeEach(() => {
    const id = `${Date.now()}-${Math.random()}`;
    statsFile = path.join(os.tmpdir(), `visitor-stats-test-${id}.json`);
    rawFile = path.join(os.tmpdir(), `raw-traffic-test-${id}.json`);
    // 訪客分析明細也要指到暫存檔：2026-11-12 第一版漏了，跑測試就往正式的 data/visits-detail.json 寫了 8 筆「(其他)」
    detailFile = path.join(os.tmpdir(), `visits-detail-test-${id}.json`);
    process.env.VISITOR_STATS_FILE = statsFile;
    process.env.RAW_TRAFFIC_FILE = rawFile;
    process.env.VISITS_DETAIL_FILE = detailFile;
    featureFile = path.join(os.tmpdir(), `feature-release-test-${id}.json`);
    process.env.FEATURE_RELEASE_FILE = featureFile;
    // 不能讀到正式的 data/cloudflare-daily.json，也不能真的打 Cloudflare
    process.env.CLOUDFLARE_STATS_FILE = path.join(os.tmpdir(), `cf-test-${id}.json`);
    delete process.env.CLOUDFLARE_ANALYTICS_TOKEN;
    vi.resetModules();
  });

  afterEach(() => {
    for (const f of [statsFile, rawFile, detailFile, featureFile]) if (fs.existsSync(f)) fs.unlinkSync(f);
    delete process.env.FEATURE_RELEASE_FILE;
    delete process.env.VISITOR_STATS_FILE;
    delete process.env.RAW_TRAFFIC_FILE;
    delete process.env.VISITS_DETAIL_FILE;
  });

  it("GET 帶出未過濾流量，爬蟲名稱依次數排序取前 5", async () => {
    fs.writeFileSync(
      rawFile,
      JSON.stringify({
        since: "2026-11-06", total: 20, browser: 5, ai: 9, search: 4, bot: 2,
        names: { GPTBot: 2, ClaudeBot: 6, Googlebot: 4, PerplexityBot: 1, bingbot: 0, Amazonbot: 3 },
      }),
    );
    const { GET } = await import("./route");
    const body = await (await GET()).json();
    expect(body.raw).toEqual({
      since: "2026-11-06", total: 20, browser: 5, ai: 9, search: 4, bot: 2,
      topBots: [["ClaudeBot", 6], ["Googlebot", 4], ["Amazonbot", 3], ["GPTBot", 2], ["PerplexityBot", 1]],
    });
  });

  it("POST 帶 body 會寫訪客分析明細（寫到暫存檔，不碰正式資料）", async () => {
    const { POST } = await import("./route");
    await POST(
      new NextRequest("http://localhost/api/visitor-stats", {
        method: "POST",
        headers: { "cf-ipcountry": "TW", "user-agent": "Mozilla/5.0 (Windows NT 10.0) Chrome/142.0.0.0 Safari/537.36" },
        body: JSON.stringify({ path: "/blog", ref: "https://www.google.com/", newSession: true, newVisitor: true }),
      }),
    );
    const detail = JSON.parse(fs.readFileSync(detailFile, "utf8"));
    expect(detail.pages).toEqual({ "/blog": 1 });
    expect(detail.referrers).toEqual({ "google.com": 1 });
  });

  it("新功能上線 12 小時內回傳 newFeature（只有到期時間），過期就是 null", async () => {
    const until = new Date(Date.now() + 3600_000).toISOString();
    fs.writeFileSync(featureFile, JSON.stringify({ until, title: "feat: 祕密的 commit 訊息", commit: "abc1234" }));
    const { GET } = await import("./route");
    const body = await (await GET()).json();
    expect(body.newFeature).toEqual({ until });
    expect(JSON.stringify(body)).not.toContain("祕密");

    fs.writeFileSync(featureFile, JSON.stringify({ until: new Date(Date.now() - 1000).toISOString() }));
    expect((await (await GET()).json()).newFeature).toBeNull();
  });

  it("GET 在資料檔還不存在時回傳空統計，不會噴錯", async () => {
    const { GET } = await import("./route");
    const body = await (await GET()).json();
    expect(body).toEqual({ total: 0, countryCount: 0, top: [], raw: null, cloudflare: null, newFeature: null });
  });

  it("POST 依 cf-ipcountry 累加次數，GET 讀得到剛寫入的結果", async () => {
    const { POST, GET } = await import("./route");
    const req = new NextRequest("http://localhost/api/visitor-stats", {
      method: "POST",
      headers: { "cf-ipcountry": "jp", "user-agent": "Mozilla/5.0" },
    });
    await POST(req);

    const body = await (await GET()).json();
    expect(body.total).toBe(1);
    expect(body.countryCount).toBe(1);
    expect(body.top).toEqual([["JP", 1]]);
  });

  it("同一國家連續兩次 POST 會累加成 2，不是互相覆蓋成 1", async () => {
    const { POST, GET } = await import("./route");
    const makeReq = () =>
      new NextRequest("http://localhost/api/visitor-stats", {
        method: "POST",
        headers: { "cf-ipcountry": "TW", "user-agent": "Mozilla/5.0" },
      });
    await POST(makeReq());
    await POST(makeReq());

    const body = await (await GET()).json();
    expect(body.top).toEqual([["TW", 2]]);
  });

  it("bot UA 的 POST 不會被計入統計", async () => {
    const { POST, GET } = await import("./route");
    const req = new NextRequest("http://localhost/api/visitor-stats", {
      method: "POST",
      headers: { "cf-ipcountry": "JP", "user-agent": "curl/8.0" },
    });
    await POST(req);

    const body = await (await GET()).json();
    expect(body.total).toBe(0);
  });

  it("沒有 cf-ipcountry header（沒經過 Cloudflare，例如 CI E2E）完全不寫入", async () => {
    const { POST, GET } = await import("./route");
    const req = new NextRequest("http://localhost/api/visitor-stats", {
      method: "POST",
      headers: { "user-agent": "Mozilla/5.0" },
    });
    await POST(req);

    expect(fs.existsSync(statsFile)).toBe(false);
    const body = await (await GET()).json();
    expect(body.total).toBe(0);
  });

  it("Cloudflare 認不出國家送 XX 時有記錄，但 summarize 不計入 total/top", async () => {
    const { POST, GET } = await import("./route");
    const req = new NextRequest("http://localhost/api/visitor-stats", {
      method: "POST",
      headers: { "cf-ipcountry": "XX", "user-agent": "Mozilla/5.0" },
    });
    await POST(req);

    expect(JSON.parse(fs.readFileSync(statsFile, "utf8"))).toEqual({ XX: 1 });
    const body = await (await GET()).json();
    expect(body.total).toBe(0);
    expect(body.countryCount).toBe(0);
  });
});
