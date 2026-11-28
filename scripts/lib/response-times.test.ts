import { afterEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { bucketOf, createRecorder, kindOf, mergeCells, percentile } from "./response-times.js";

const CHROME = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/142.0.0.0 Safari/537.36";
const req = (url: string, headers: Record<string, string> = {}, method = "GET") => ({
  method,
  url,
  headers: { "cf-ipcountry": "TW", "user-agent": CHROME, ...headers },
});

const tmp: string[] = [];
afterEach(() => {
  for (const f of tmp.splice(0)) fs.rmSync(f, { force: true, recursive: true });
});

describe("kindOf", () => {
  it("頁面、API 分開；靜態檔／預先載入／自己人／沒經過 Cloudflare 的不算", () => {
    expect(kindOf(req("/blog"))).toBe("page");
    expect(kindOf(req("/api/radar?x=1"))).toBe("api");
    expect(kindOf(req("/_next/static/a.js"))).toBeNull();
    expect(kindOf(req("/logo.png"))).toBeNull();
    expect(kindOf(req("/blog", { "next-router-prefetch": "1" }))).toBeNull();
    expect(kindOf(req("/", { "user-agent": "kbs0830-warmup" }))).toBeNull();
    expect(kindOf(req("/", { "user-agent": "WindowsPowerShell/5.1" }))).toBeNull();
    expect(kindOf({ method: "GET", url: "/", headers: {} })).toBeNull();
    expect(kindOf(req("/api/x", {}, "POST"))).toBeNull();
  });
});

describe("直方圖與百分位數", () => {
  it("bucketOf：落在第一個 >= 它的格子，超過最大的是最後一格", () => {
    expect(bucketOf(1)).toBe(0);
    expect(bucketOf(5)).toBe(0);
    expect(bucketOf(6)).toBe(1);
    expect(bucketOf(5000)).toBe(9);
    expect(bucketOf(5001)).toBe(10);
  });

  it("p50／p95：100 筆，95 筆 8ms、5 筆 3000ms → p50 10、p95 10 / p99 5000 以內", () => {
    const rec = createRecorder(undefined);
    const now = Date.parse("2026-11-29T10:00:00+08:00");
    for (let i = 0; i < 95; i++) rec.record(req("/"), 8, now);
    for (let i = 0; i < 5; i++) rec.record(req("/"), 3000, now);
    const cell = mergeCells(Object.values(rec.snapshot()).map((h) => h.page));
    expect(cell.n).toBe(100);
    expect(percentile(cell, 0.5)).toBe(10);
    expect(percentile(cell, 0.95)).toBe(10);
    expect(percentile(cell, 0.99)).toBe(3000); // 落在最後的格子之一，不超過 max
    expect(percentile({ n: 0, max: 0, h: [] }, 0.5)).toBeNull();
  });
});

describe("createRecorder", () => {
  it("寫檔後重開會接著累積，不歸零", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rt-"));
    tmp.push(dir);
    const file = path.join(dir, "rt.json");
    const now = Date.parse("2026-11-29T10:05:00+08:00");
    const a = createRecorder(file);
    a.record(req("/a"), 12, now);
    expect(a.flush()).toBe(true);
    expect(a.flush()).toBe(false); // 沒有新資料不重寫
    const b = createRecorder(file);
    b.record(req("/b"), 40, now);
    const key = "2026-11-29T10";
    expect(b.snapshot()[key].page.n).toBe(2);
    expect(b.snapshot()[key].page.max).toBe(40);
  });

  it("不算的請求回 false、不會留下空檔", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rt-"));
    tmp.push(dir);
    const file = path.join(dir, "rt.json");
    const r = createRecorder(file);
    expect(r.record({ method: "GET", url: "/", headers: {} }, 5)).toBe(false);
    expect(r.flush()).toBe(false);
    expect(fs.existsSync(file)).toBe(false);
  });
});
