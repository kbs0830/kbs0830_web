import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readGoClicks, recordGoClick } from "@/lib/stats/go-clicks";
import { GO_LINKS, isGoCode } from "@/lib/site/go-links";

describe("go-clicks", () => {
  let file: string;
  beforeEach(() => {
    file = path.join(os.tmpdir(), `go-clicks-${process.pid}-${Math.random().toString(36).slice(2)}.json`);
    vi.stubEnv("GO_CLICKS_FILE", file);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    fs.rmSync(file, { force: true });
  });

  it("每天每個代號累加，區間內加總、多的在前", () => {
    const d1 = Date.UTC(2026, 10, 25, 6);
    const d2 = Date.UTC(2026, 10, 26, 6);
    recordGoClick("github", d1);
    recordGoClick("github", d2);
    recordGoClick("repo", d2);
    recordGoClick("github", d2);
    expect(readGoClicks("2026-11-25", "2026-11-26")).toEqual([["github", 3], ["repo", 1]]);
    expect(readGoClicks("2026-11-26", "2026-11-26")).toEqual([["github", 2], ["repo", 1]]);
    expect(readGoClicks("2026-11-01", "2026-11-24")).toBeNull();
  });

  it("沒有檔案就是 null", () => {
    expect(readGoClicks("2026-01-01", "2026-12-31")).toBeNull();
  });
});

describe("go-links", () => {
  it("代號格式：小寫英數連字號；轉址表的目標都是 https", () => {
    expect(isGoCode("github")).toBe(true);
    expect(isGoCode("../etc")).toBe(false);
    expect(isGoCode("GitHub")).toBe(false);
    for (const url of Object.values(GO_LINKS)) expect(url).toMatch(/^https:\/\//);
  });
});
