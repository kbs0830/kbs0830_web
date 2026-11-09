import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";

const day = (uniques: number, pageViews: number, requests: number) => ({ uniques, pageViews, requests });

describe("cloudflare-analytics", () => {
  let file: string;

  beforeEach(() => {
    file = path.join(os.tmpdir(), `cf-daily-${Date.now()}-${Math.random()}.json`);
    process.env.CLOUDFLARE_STATS_FILE = file;
    process.env.CLOUDFLARE_ANALYTICS_TOKEN = "test-token";
    vi.resetModules(); // inFlight／lastAttempt 是 module 狀態，每個測試重新載入
  });

  afterEach(() => {
    fs.rmSync(file, { force: true });
    delete process.env.CLOUDFLARE_STATS_FILE;
    delete process.env.CLOUDFLARE_ANALYTICS_TOKEN;
    vi.unstubAllGlobals();
  });

  it("summarize：近 30 天只算 29 天前（UTC）以後，累計算全部", async () => {
    const { summarize } = await import("./cloudflare-analytics");
    const s = summarize(
      { "2026-06-16": day(5, 10, 100), "2026-10-07": day(1, 1, 1), "2026-10-08": day(2, 3, 4), "2026-11-06": day(10, 20, 30) },
      new Date("2026-11-06T12:00:00Z"),
    );
    expect(s).toEqual({
      since: "2026-06-16",
      last30: { uniques: 12, pageViews: 23, requests: 34 },
      total: { uniques: 18, pageViews: 34, requests: 135 },
    });
    expect(summarize({})).toBeNull();
  });

  it("lastNDays：剛好 n 天、日期連續到今天，沒資料的日子補 0（/stats 趨勢圖）", async () => {
    const { lastNDays } = await import("./cloudflare-analytics");
    const rows = lastNDays({ "2026-11-04": day(1, 2, 3), "2026-11-06": day(4, 5, 6), "2026-10-01": day(9, 9, 9) }, 3, new Date("2026-11-06T12:00:00Z"));
    expect(rows).toEqual([
      { date: "2026-11-04", ...day(1, 2, 3) },
      { date: "2026-11-05", uniques: 0, pageViews: 0, requests: 0 },
      { date: "2026-11-06", ...day(4, 5, 6) },
    ]);
  });

  it("mergeDays：新抓的日期覆蓋（當天數字會長），舊的保留", async () => {
    const { mergeDays } = await import("./cloudflare-analytics");
    const merged = mergeDays({ "2026-01-01": day(1, 1, 1), "2026-11-06": day(2, 2, 2) }, [
      { date: "2026-11-06", ...day(9, 9, 9) },
    ]);
    expect(merged).toEqual({ "2026-01-01": day(1, 1, 1), "2026-11-06": day(9, 9, 9) });
  });

  it("沒有資料檔時抓一年、寫檔；一小時內不再抓", async () => {
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const { variables } = JSON.parse(String(init.body));
      expect(variables.s).toBe("2025-11-07"); // 364 天前
      return new Response(
        JSON.stringify({
          data: { viewer: { zones: [{ httpRequests1dGroups: [
            { dimensions: { date: "2026-11-05" }, sum: { requests: 50, pageViews: 7 }, uniq: { uniques: 3 } },
          ] }] } },
        }),
      );
    });
    vi.stubGlobal("fetch", fetchMock);
    const { refreshCloudflareIfStale, readCloudflareSummary } = await import("./cloudflare-analytics");

    const now = new Date("2026-11-06T12:00:00Z");
    await refreshCloudflareIfStale(now);
    expect(readCloudflareSummary()?.total).toEqual({ uniques: 3, pageViews: 7, requests: 50 });

    await refreshCloudflareIfStale(new Date(now.getTime() + 30 * 60 * 1000));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("Cloudflare 回錯誤時保留舊數字，10 分鐘內不重試", async () => {
    fs.writeFileSync(file, JSON.stringify({ updatedAt: "2026-11-01T00:00:00Z", days: { "2026-11-01": day(1, 2, 3) } }));
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ errors: [{ message: "no permission" }] })));
    vi.stubGlobal("fetch", fetchMock);
    const { refreshCloudflareIfStale, readCloudflareSummary } = await import("./cloudflare-analytics");

    const now = new Date("2026-11-06T12:00:00Z");
    await refreshCloudflareIfStale(now);
    await refreshCloudflareIfStale(new Date(now.getTime() + 60 * 1000));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(readCloudflareSummary()?.total).toEqual({ uniques: 1, pageViews: 2, requests: 3 });
  });

  it("沒設金鑰就完全不打 Cloudflare", async () => {
    delete process.env.CLOUDFLARE_ANALYTICS_TOKEN;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { refreshCloudflareIfStale } = await import("./cloudflare-analytics");
    await refreshCloudflareIfStale();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
