import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { KEEP_DAYS, logAsk, prune, readAskLog, redact, summarizeAsk } from "./ask-log";

let dir: string;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "ask-log-"));
  process.env.ASK_LOG_FILE = path.join(dir, "ask-log.jsonl");
});
afterEach(() => {
  delete process.env.ASK_LOG_FILE;
  fs.rmSync(dir, { recursive: true, force: true });
});

const entry = (q: string, extra: object = {}) => ({ q, a: "答", src: [], ms: 1000, turn: 1, ok: true, ...extra });

describe("redact（遮掉訪客可能打進問題的個資）", () => {
  it("email、電話、長數字、疑似金鑰", () => {
    expect(redact("寄到 someone@example.com 好嗎")).toBe("寄到 [email] 好嗎");
    expect(redact("我的電話 0912-345-678")).toBe("我的電話 [number]");
    expect(redact("call +886 912 345 678 now")).toBe("call [number] now");
    expect(redact(`key ${"Zq9".repeat(12)} ok`)).toBe("key [token] ok"); // 36 字元的英數字串（不用像真金鑰的範例，GitHub 會擋 push）
  });
  it("一般的數字、年份、版本號不動", () => {
    expect(redact("2026 年 N5，Next.js 16，YOLOv8")).toBe("2026 年 N5，Next.js 16，YOLOv8");
    expect(redact("3 個專案、72 小時")).toBe("3 個專案、72 小時");
  });
});

describe("logAsk／readAskLog", () => {
  it("記下來、新的在前；問題與答案都先遮掉個資", () => {
    logAsk(entry("第一題", { t: 1_000_000_000_000 }));
    logAsk(entry("我的信箱 a@b.co", { a: "好的 a@b.co", t: 1_000_000_001_000 }));
    const got = readAskLog({ now: 1_000_000_002_000 });
    expect(got.map((e) => e.q)).toEqual(["我的信箱 [email]", "第一題"]);
    expect(got[0].a).toBe("好的 [email]");
  });

  it("不記 IP：紀錄欄位只有約定的幾個", () => {
    logAsk(entry("題"));
    expect(Object.keys(readAskLog()[0]).toSorted()).toEqual(["a", "ms", "ok", "q", "src", "t", "turn"]);
  });

  it("超過保留天數的不回；limit 有效；壞掉的行略過", () => {
    const now = Date.now();
    logAsk(entry("很舊", { t: now - (KEEP_DAYS + 1) * 86400_000 }));
    logAsk(entry("新的一", { t: now - 2000 }));
    logAsk(entry("新的二", { t: now - 1000 }));
    fs.appendFileSync(process.env.ASK_LOG_FILE!, "{壞掉\n");
    expect(readAskLog({ now }).map((e) => e.q)).toEqual(["新的二", "新的一"]);
    expect(readAskLog({ now, limit: 1 })).toHaveLength(1);
  });

  it("檔案不存在回空陣列；長答案被截斷", () => {
    expect(readAskLog()).toEqual([]);
    logAsk(entry("題", { a: "字".repeat(5000) }));
    expect(readAskLog()[0].a.length).toBeLessThan(1300);
  });

  it("prune 刪掉過期的，留下的順序不變", () => {
    const now = Date.now();
    logAsk(entry("過期", { t: now - (KEEP_DAYS + 5) * 86400_000 }));
    logAsk(entry("甲", { t: now - 2000 }));
    logAsk(entry("乙", { t: now - 1000 }));
    prune(now);
    expect(fs.readFileSync(process.env.ASK_LOG_FILE!, "utf8").trim().split("\n")).toHaveLength(2);
    expect(readAskLog({ now }).map((e) => e.q)).toEqual(["乙", "甲"]);
  });
});

describe("summarizeAsk", () => {
  it("總數、近 7 天、沒答完、平均、無來源、重複被問", () => {
    const now = 10 * 86400_000;
    const list = [
      { t: now - 1000, q: "日語", a: "N5", src: [], ms: 2000, turn: 1, ok: true },
      { t: now - 2000, q: "日語", a: "N5", src: ["/x"], ms: 4000, turn: 1, ok: true },
      { t: now - 3000, q: "壞了", a: "", src: [], ms: 120000, turn: 1, ok: false },
      { t: now - 9 * 86400_000, q: "舊的", a: "a", src: ["/y"], ms: 3000, turn: 2, ok: true },
    ];
    const s = summarizeAsk(list, now);
    expect(s).toMatchObject({ total: 4, week: 3, failed: 1, avgMs: 3000, noSource: 1 });
    expect(s.top).toEqual([["日語", 2]]);
  });
  it("沒有紀錄時不會除以零", () => {
    expect(summarizeAsk([])).toMatchObject({ total: 0, avgMs: null });
  });
});
