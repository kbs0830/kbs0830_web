import { describe, expect, it } from "vitest";
import { OVERRIDES, PRIVATE_PATTERN, groupByMonth, parseChangelog, readChangelog } from "./changelog";

const line = (sha: string, time: string, subject: string) => [sha, time, subject].join("\x1f");

describe("changelog", () => {
  it("只收 feat，分類轉中文，沒寫分類算「網站」", () => {
    const raw = [
      line("aaaaaaa", "2026-11-21T10:00:00+08:00", "feat(radar): 自家雷達獨立頁 /radar"),
      line("bbbbbbb", "2026-11-21T09:00:00+08:00", "fix: 修一個 bug"),
      line("ccccccc", "2026-11-20T09:00:00+08:00", "chore: 自動更新部署產生的檔案"),
      line("ddddddd", "2026-11-19T09:00:00+08:00", "feat: Markdown 表格"),
      line("eeeeeee", "2026-11-18T09:00:00+08:00", "feat(新分類): 沒對照的分類"),
    ].join("\n");
    expect(parseChangelog(raw)).toEqual([
      { sha: "aaaaaaa", date: "2026-11-21", scope: "自家雷達", text: "自家雷達獨立頁 /radar" },
      { sha: "ddddddd", date: "2026-11-19", scope: "網站", text: "Markdown 表格" },
      { sha: "eeeeeee", date: "2026-11-18", scope: "網站", text: "沒對照的分類" },
    ]);
  });

  it("日期用台灣時間（UTC 晚上算隔天）", () => {
    const [e] = parseChangelog(line("aaaaaaa", "2026-11-20T17:30:00Z", "feat: x"));
    expect(e.date).toBe("2026-11-21");
  });

  it("OVERRIDES 改寫或整則拿掉", () => {
    const hidden = Object.keys(OVERRIDES).find((k) => OVERRIDES[k] === null)!;
    const rewritten = Object.keys(OVERRIDES).find((k) => OVERRIDES[k])!;
    const raw = [
      line(hidden, "2026-11-05T10:00:00+08:00", "feat(seo): 隨便什麼"),
      line(rewritten, "2026-11-05T10:00:00+08:00", "feat(ops): 原文"),
    ].join("\n");
    expect(parseChangelog(raw).map((e) => e.text)).toEqual([OVERRIDES[rewritten]]);
  });

  it("保險：之後的 commit 寫到本名、信箱、內網 IP、金鑰，整則不列", () => {
    const raw = [
      "feat: 本名放進 JSON-LD",
      "feat: 通知改寄 otemon",
      "feat: 寄信給 someone@example.com",
      "feat(radar): 讀 192.168.1.2 的資料",
      "feat(ops): 新的 API token",
    ]
      .map((s, i) => line(`f${i}f${i}f${i}f`, "2026-11-21T10:00:00+08:00", s))
      .join("\n");
    expect(parseChangelog(raw)).toEqual([]);
  });

  it("真的 git log：有東西、沒有不能公開的字", () => {
    const entries = readChangelog();
    expect(entries.length).toBeGreaterThan(10);
    for (const e of entries) expect(e.text).not.toMatch(PRIVATE_PATTERN);
    expect(JSON.stringify(entries)).not.toContain("李秉威");
  });

  it("依月份分組，順序不變", () => {
    const groups = groupByMonth(
      parseChangelog(
        [
          line("aaaaaaa", "2026-11-21T10:00:00+08:00", "feat: a"),
          line("bbbbbbb", "2026-11-02T10:00:00+08:00", "feat: b"),
          line("ccccccc", "2026-10-15T10:00:00+08:00", "feat: c"),
        ].join("\n"),
      ),
    );
    expect(groups.map(([m, items]) => [m, items.map((e) => e.text)])).toEqual([
      ["2026-11", ["a", "b"]],
      ["2026-10", ["c"]],
    ]);
  });
});
