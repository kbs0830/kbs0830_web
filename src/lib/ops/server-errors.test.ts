import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatServerError, readServerErrors, recordServerError } from "@/lib/ops/server-errors";

describe("server-errors", () => {
  let dir: string;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "srv-err-"));
    vi.stubEnv("LOGS_DIR", dir);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("formatServerError：路徑去掉查詢字串、訊息壓成一行並截斷、帶 digest", () => {
    const e = Object.assign(new Error("boom\n  at x"), { digest: "123" });
    const f = formatServerError(e, { path: "/blog/a?token=secret&x=1", method: "GET" }, { routeType: "render" }, Date.UTC(2026, 10, 27));
    expect(f).toEqual({ t: "2026-11-27T00:00:00.000Z", path: "/blog/a", method: "GET", kind: "render", message: "boom at x", digest: "123" });
    expect(formatServerError("x".repeat(500), { path: "/", method: "POST" }, {}).message).toHaveLength(300);
  });

  it("寫進 errors.log、讀回來新的在前；壞掉的行略過", () => {
    recordServerError(formatServerError(new Error("first"), { path: "/a", method: "GET" }, { routeType: "route" }, 1000));
    fs.appendFileSync(path.join(dir, "errors.log"), "not json\n");
    recordServerError(formatServerError(new Error("second"), { path: "/b", method: "GET" }, { routeType: "render" }, 2000));
    expect(readServerErrors().map((e) => e.message)).toEqual(["second", "first"]);
  });

  it("超過 1MB（訊息截 300 字，約 3000 筆）只留最後 500 行；沒有檔案回空陣列", () => {
    expect(readServerErrors()).toEqual([]);
    const big = "x".repeat(900);
    for (let i = 0; i < 3000; i++) recordServerError(formatServerError(new Error(`${i} ${big}`), { path: "/", method: "GET" }, {}, i));
    const file = path.join(dir, "errors.log");
    const lines = fs.readFileSync(file, "utf8").split("\n").filter(Boolean);
    // 超過 1MB 就縮成最後 500 行，之後再慢慢長：所以檔案大小一直被壓在 1MB 附近、筆數遠少於 3000
    expect(fs.statSync(file).size).toBeLessThan(1_001_000);
    expect(lines.length).toBeLessThan(2000);
    expect(readServerErrors(1)[0].message.startsWith("2999 ")).toBe(true);
  });
});
