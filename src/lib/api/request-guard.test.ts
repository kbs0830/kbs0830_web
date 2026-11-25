import { describe, expect, it } from "vitest";
import { RateLimiter, readLimitedJson, readLimitedText } from "@/lib/api/request-guard";

const post = (body: string, headers: Record<string, string> = {}) => new Request("http://x/api", { method: "POST", body, headers });

describe("readLimitedText", () => {
  it("上限內照常讀", async () => {
    expect(await readLimitedText(post("hello"), 10)).toBe("hello");
  });
  it("超過上限回 null（不管有沒有帶 content-length）", async () => {
    expect(await readLimitedText(post("x".repeat(50)), 10)).toBeNull();
    expect(await readLimitedText(post("x", { "content-length": "999999" }), 10)).toBeNull();
  });
  it("中文按位元組算", async () => {
    expect(await readLimitedText(post("中文字"), 6)).toBeNull(); // 9 bytes
  });
});

describe("readLimitedJson", () => {
  it("壞 JSON、太大都回 undefined", async () => {
    expect(await readLimitedJson(post('{"a":1}'), 100)).toEqual({ a: 1 });
    expect(await readLimitedJson(post("{壞掉"), 100)).toBeUndefined();
    expect(await readLimitedJson(post('{"a":"' + "x".repeat(200) + '"}'), 100)).toBeUndefined();
  });
});

describe("RateLimiter", () => {
  it("每個 key 的上限、視窗過了就重置", () => {
    const rl = new RateLimiter(1000, 2);
    expect(rl.limited("a", 0)).toBe(false);
    expect(rl.limited("a", 10)).toBe(false);
    expect(rl.limited("a", 20)).toBe(true);
    expect(rl.limited("b", 20)).toBe(false);
    expect(rl.limited("a", 1500)).toBe(false);
  });
  it("全部加起來的上限", () => {
    const rl = new RateLimiter(1000, 10, 3);
    expect([rl.limited("a", 0), rl.limited("b", 0), rl.limited("c", 0), rl.limited("d", 0)]).toEqual([false, false, false, true]);
  });
});
