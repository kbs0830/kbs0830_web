import { afterEach, describe, expect, it } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { classify, shouldCount, recordRawHit, readRawTraffic } from "./raw-traffic.js";

const CHROME =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36";
const req = (url: string, headers: Record<string, string> = {}, method = "GET") => ({
  method,
  url,
  headers: { "cf-ipcountry": "TW", "user-agent": CHROME, ...headers },
});

describe("classify", () => {
  it.each([
    ["Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)", "ai", "GPTBot"],
    ["Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)", "ai", "ClaudeBot"],
    ["Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)", "ai", "PerplexityBot"],
    ["Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)", "search", "Googlebot"],
    ["Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)", "search", "bingbot"],
    // Applebot-Extended 是 AI 訓練用，要先比 AI 清單，不能被 Applebot（搜尋）搶走
    ["Mozilla/5.0 (compatible; Applebot-Extended/0.1)", "ai", "Applebot-Extended"],
  ])("%s → %s", (ua, kind, name) => {
    expect(classify(ua)).toEqual({ kind, name });
  });

  it.each(["curl/8.4.0", "python-requests/2.31", "", "Go-http-client/1.1", "Mozilla/5.0 (compatible; SemrushBot/7)"])(
    "其他機器人：%j",
    (ua) => expect(classify(ua)).toEqual({ kind: "bot" }),
  );

  it("一般瀏覽器", () => {
    expect(classify(CHROME)).toEqual({ kind: "browser" });
  });
});

describe("shouldCount", () => {
  it("一般頁面、.md、llms.txt 都算", () => {
    expect(shouldCount(req("/"))).toBe(true);
    expect(shouldCount(req("/blog/foo?x=1"))).toBe(true);
    expect(shouldCount(req("/index.md"))).toBe(true);
    expect(shouldCount(req("/llms.txt"))).toBe(true);
    expect(shouldCount(req("/wp-login.php"))).toBe(true); // 掃描器也算，這份就是不清洗
  });

  it("沒經過 Cloudflare、自己的監控、預先載入、靜態資源、API 不算", () => {
    expect(shouldCount({ method: "GET", url: "/", headers: { "user-agent": CHROME } })).toBe(false);
    expect(shouldCount(req("/", { "user-agent": "Mozilla/5.0 (Windows NT; Windows NT 10.0; zh-TW) WindowsPowerShell/5.1.26100" }))).toBe(false);
    expect(shouldCount(req("/", { "user-agent": "kbs0830-uptime (+https://github.com/kbs0830/kbs0830_web)" }))).toBe(false);
    expect(shouldCount(req("/blog", { "next-router-prefetch": "1" }))).toBe(false);
    expect(shouldCount(req("/blog", { "sec-purpose": "prefetch" }))).toBe(false);
    expect(shouldCount(req("/_next/static/chunks/a.js"))).toBe(false);
    expect(shouldCount(req("/image/大頭貼.jpg"))).toBe(false);
    expect(shouldCount(req("/api/visitor-stats"))).toBe(false);
    expect(shouldCount(req("/", {}, "POST"))).toBe(false);
  });
});

describe("recordRawHit", () => {
  const file = path.join(os.tmpdir(), `raw-traffic-unit-${Date.now()}-${Math.random()}.json`);
  afterEach(() => fs.rmSync(file, { force: true }));

  it("依分類累加，認得名字的爬蟲另外記次數", () => {
    recordRawHit(file, req("/"));
    recordRawHit(file, req("/", { "user-agent": "Mozilla/5.0 (compatible; ClaudeBot/1.0)" }));
    recordRawHit(file, req("/blog", { "user-agent": "Mozilla/5.0 (compatible; ClaudeBot/1.0)" }));
    recordRawHit(file, req("/", { "user-agent": "curl/8" }));
    recordRawHit(file, req("/_next/static/x.js")); // 不算

    const stats = readRawTraffic(file)!;
    expect(stats).toMatchObject({ total: 4, browser: 1, ai: 2, search: 0, bot: 1, names: { ClaudeBot: 2 } });
    expect(stats.since).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
