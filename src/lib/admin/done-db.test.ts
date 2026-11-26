import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __closeDb, addDone, listDone, recentEvents } from "@/lib/admin/db";
import { parseDone } from "../../../scripts/lib/parse-done";

const md = [
  "# DONE — 前言不要",
  "前言",
  "### 2026-11-26 後台入口（G5）",
  "- [x] 第一項",
  "  - 子項目",
  "### 2026-11-04～05 已完成（人名搜尋）",
  "- [x] 第二項",
  "## 🧭 2026-11-03 — 自動化／新技術",
  "背景：…",
  "### A. 自動化",
  "- [x] 這個 ### 屬於上面的 ##",
  "## 🔴 高優先（已完成的）",
  "- [x] 沒日期的分類",
].join("\r\n");

describe("parseDone", () => {
  it("## 開一筆、被 ## 包住的 ### 算內文、前言丟掉", () => {
    const e = parseDone(md);
    expect(e.map((x: { title: string }) => x.title)).toEqual(["後台入口（G5）", "已完成（人名搜尋）", "自動化／新技術", "高優先（已完成的）"]);
    expect(e[2].body).toContain("### A. 自動化");
    expect(e[2].body).toContain("這個 ### 屬於上面的 ##");
  });

  it("日期取標題第一個 YYYY-MM-DD，沒有就是 null；順序用 sort 記", () => {
    const e = parseDone(md);
    expect(e.map((x: { day: string | null }) => x.day)).toEqual(["2026-11-26", "2026-11-04", "2026-11-03", null]);
    expect(e.map((x: { sort: number }) => x.sort)).toEqual([10, 20, 30, 40]);
    expect(e[0].body).toBe("- [x] 第一項\n  - 子項目");
  });
});

describe("done_log", () => {
  beforeEach(() => vi.stubEnv("ADMIN_DB_FILE", ":memory:"));
  afterEach(() => { __closeDb(); vi.unstubAllEnvs(); });

  it("新增的放最前面、預設日期是台灣今天、操作有紀錄", () => {
    addDone("舊的", "a", "2026-11-01", 1000);
    addDone("新的", "b", null, Date.UTC(2026, 10, 26, 17, 0)); // UTC 17:00 ＝ 台灣 11/27 01:00
    const rows = listDone();
    expect(rows.map((r) => r.title)).toEqual(["新的", "舊的"]);
    expect(rows[0].day).toBe("2026-11-27");
    expect(recentEvents().map((e) => e.action)).toEqual(["done.add", "done.add"]);
  });
});
