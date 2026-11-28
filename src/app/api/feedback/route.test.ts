import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("POST /api/feedback（B20）", () => {
  let file: string;
  beforeEach(() => {
    file = path.join(os.tmpdir(), `feedback-route-${process.pid}-${Math.random().toString(36).slice(2)}.json`);
    vi.stubEnv("FEEDBACK_FILE", file);
    vi.resetModules();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    fs.rmSync(file, { force: true });
  });

  const post = (body: unknown, opts: { cf?: boolean; ua?: string } = {}) =>
    new NextRequest("http://localhost/api/feedback", {
      method: "POST",
      headers: { "user-agent": opts.ua ?? "Mozilla/5.0 (Windows NT 10.0) Chrome/120", ...(opts.cf === false ? {} : { "cf-ipcountry": "TW", "cf-connecting-ip": "1.2.3.4" }) },
      body: JSON.stringify(body),
    });
  const stored = () => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null);

  it("真人從 Cloudflare 進來、文章存在 → 記一筆；本機、爬蟲不計（204 但不寫檔）", async () => {
    const { POST } = await import("./route");
    expect((await POST(post({ slug: "tailwind-v4-bracket-var", helpful: true }, { cf: false }))).status).toBe(204);
    expect((await POST(post({ slug: "tailwind-v4-bracket-var", helpful: true }, { ua: "Googlebot/2.1" }))).status).toBe(204);
    expect(stored()).toBeNull();
    expect((await POST(post({ slug: "tailwind-v4-bracket-var", helpful: false, reason: "outdated" }))).status).toBe(204);
    const day = Object.values(stored().days)[0] as Record<string, { yes: number; no: number; reasons: Record<string, number> }>;
    expect(day["tailwind-v4-bracket-var"]).toEqual({ yes: 0, no: 1, reasons: { outdated: 1 } });
  });

  it("擋掉不存在的文章、格式錯、亂寫的原因", async () => {
    const { POST } = await import("./route");
    for (const bad of [{ slug: "no-such-post", helpful: true }, { slug: "tailwind-v4-bracket-var" }, { slug: 1, helpful: true }, { slug: "tailwind-v4-bracket-var", helpful: false, reason: "xxx" }]) {
      expect((await POST(post(bad))).status).toBe(400);
    }
    expect(stored()).toBeNull();
  });

  it("同一個 IP 每分鐘最多 6 次，超過回 429", async () => {
    const { POST } = await import("./route");
    const codes: number[] = [];
    for (let i = 0; i < 8; i++) codes.push((await POST(post({ slug: "tailwind-v4-bracket-var", helpful: true }))).status);
    expect(codes.filter((c) => c === 204)).toHaveLength(6);
    expect(codes.filter((c) => c === 429)).toHaveLength(2);
  });
});
