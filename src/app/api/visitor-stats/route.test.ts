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

  beforeEach(() => {
    statsFile = path.join(os.tmpdir(), `visitor-stats-test-${Date.now()}-${Math.random()}.json`);
    process.env.VISITOR_STATS_FILE = statsFile;
    vi.resetModules();
  });

  afterEach(() => {
    if (fs.existsSync(statsFile)) fs.unlinkSync(statsFile);
    delete process.env.VISITOR_STATS_FILE;
  });

  it("GET 在資料檔還不存在時回傳空統計，不會噴錯", async () => {
    const { GET } = await import("./route");
    const body = await (await GET()).json();
    expect(body).toEqual({ total: 0, countryCount: 0, top: [] });
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
