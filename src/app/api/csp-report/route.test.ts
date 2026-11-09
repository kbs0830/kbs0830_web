import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { NextRequest } from "next/server";

describe("csp-report API route", () => {
  let file: string;
  beforeEach(() => {
    file = path.join(os.tmpdir(), `csp-${Date.now()}-${Math.random()}.json`);
    process.env.CSP_REPORT_FILE = file;
    vi.resetModules();
  });
  afterEach(() => {
    fs.rmSync(file, { force: true });
    delete process.env.CSP_REPORT_FILE;
  });

  const post = (body: unknown, headers: Record<string, string> = { "cf-ipcountry": "TW" }) =>
    new NextRequest("http://localhost/api/csp-report", { method: "POST", body: JSON.stringify(body), headers });

  it("舊格式（report-uri）：只留網域跟路徑，不存 query string", async () => {
    const { POST, GET } = await import("./route");
    await POST(
      post({
        "csp-report": {
          "document-uri": "https://kbs0830.com/projects/foodlens-advisor?utm=x",
          "effective-directive": "img-src",
          "blocked-uri": "https://evil.example.com/a.png?token=secret",
        },
      }),
    );
    const body = await (await GET()).json();
    expect(body.reports).toEqual({ "img-src https://evil.example.com @ /projects/slug": 1 });
    expect(JSON.stringify(body)).not.toContain("secret");
  });

  it("新格式（Reporting API 陣列）也收；inline 原樣保留；同一筆累加", async () => {
    const { POST, GET } = await import("./route");
    const r = { type: "csp-violation", body: { documentURL: "https://kbs0830.com/", effectiveDirective: "script-src-elem", blockedURL: "inline" } };
    await POST(post([r, r]));
    expect((await (await GET()).json()).reports).toEqual({ "script-src-elem inline @ /": 2 });
  });

  it("沒經過 Cloudflare（CI、本機）不記", async () => {
    const { POST, GET } = await import("./route");
    const res = await POST(post({ "csp-report": { "blocked-uri": "https://x.com" } }, {}));
    expect(res.status).toBe(204);
    expect((await (await GET()).json()).total).toBe(0);
  });
});
