import { describe, expect, it } from "vitest";
import { twDate, twHour } from "./tw-time.js";
import { isBrowserUA } from "./bot-patterns.js";

describe("tw-time", () => {
  it("UTC 16:00 是台灣隔天 0 點", () => {
    const ms = Date.parse("2026-11-24T16:00:00Z");
    expect(twDate(ms)).toBe("2026-11-25");
    expect(twHour(ms)).toBe(0);
    expect(twDate(ms - 1)).toBe("2026-11-24");
    expect(twHour(ms - 1)).toBe(23);
  });
});

describe("isBrowserUA", () => {
  it.each([
    ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36", true],
    ["Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1", true],
    ["Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)", false],
    ["Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2)", false],
    ["Mozilla/5.0 (X11; Linux x86_64) HeadlessChrome/142.0", false],
    ["curl/8.4.0", false],
    ["", false],
  ])("%s → %s", (ua, ok) => expect(isBrowserUA(ua)).toBe(ok));
});
