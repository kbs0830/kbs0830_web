import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { NextRequest } from "next/server";

// 隔離方式同 visitor-stats：每個測試用自己的暫存檔（WEB_VITALS_FILE）＋ resetModules
describe("web-vitals API route", () => {
  let vitalsFile: string;

  beforeEach(() => {
    vitalsFile = path.join(os.tmpdir(), `web-vitals-test-${Date.now()}-${Math.random()}.json`);
    process.env.WEB_VITALS_FILE = vitalsFile;
    vi.resetModules();
  });

  afterEach(() => {
    if (fs.existsSync(vitalsFile)) fs.unlinkSync(vitalsFile);
    delete process.env.WEB_VITALS_FILE;
  });

  const post = (body: unknown, ua = "Mozilla/5.0", viaCloudflare = true) =>
    new NextRequest("http://localhost/api/web-vitals", {
      method: "POST",
      headers: { "user-agent": ua, ...(viaCloudflare && { "cf-ipcountry": "TW" }) },
      body: typeof body === "string" ? body : JSON.stringify(body),
    });

  it("沒經過 Cloudflare 的（本機測試、CI 的 E2E）不計入", async () => {
    const { POST, GET } = await import("./route");
    expect((await POST(post({ name: "LCP", value: 1000, page: "/" }, "Mozilla/5.0", false))).status).toBe(204);
    expect(await (await GET()).json()).toEqual({});
  });

  it("收下合法樣本，GET 回傳每頁每個指標的樣本數與 p75", async () => {
    const { POST, GET } = await import("./route");
    for (const value of [1000, 2000, 3000, 4000]) {
      expect((await POST(post({ name: "LCP", value, page: "/" }))).status).toBe(204);
    }
    await POST(post({ name: "CLS", value: 0.12345, page: "/projects/slug" }));

    const body = await (await GET()).json();
    expect(body["/"].LCP).toEqual({ n: 4, p75: 3000 });
    expect(body["/projects/slug"].CLS).toEqual({ n: 1, p75: 0.123 });
  });

  it("擋掉不認得的指標、不合理的數值、奇怪的路徑跟壞掉的 JSON", async () => {
    const { POST, GET } = await import("./route");
    const bad = [
      { name: "FID", value: 10, page: "/" },
      { name: "LCP", value: -1, page: "/" },
      { name: "LCP", value: 999_999, page: "/" },
      { name: "LCP", value: 1000, page: "/../../etc/passwd" },
      { name: "LCP", value: 1000, page: "/a/b/c" },
      "not json",
    ];
    for (const b of bad) expect((await POST(post(b))).status).toBe(400);
    expect(await (await GET()).json()).toEqual({});
  });

  it("爬蟲／headless 瀏覽器的回報不計入", async () => {
    const { POST, GET } = await import("./route");
    await POST(post({ name: "LCP", value: 1000, page: "/" }, "Mozilla/5.0 HeadlessChrome/140"));
    await POST(post({ name: "LCP", value: 1000, page: "/" }, "Googlebot/2.1"));
    expect(await (await GET()).json()).toEqual({});
  });

  it("同一頁同一指標只留最近 200 筆", async () => {
    const { POST, GET } = await import("./route");
    for (let i = 0; i < 205; i++) await POST(post({ name: "TTFB", value: i, page: "/blog" }));
    const body = await (await GET()).json();
    expect(body["/blog"].TTFB.n).toBe(200);
  });
});
