import { describe, expect, it, vi } from "vitest";

// year-review.ts 有 import "server-only"：測試環境把它換掉
vi.mock("server-only", () => ({}));

describe("radarTotals", () => {
  it("累計架次、機型種類、最忙的一天", async () => {
    const { radarTotals } = await import("./year-review");
    const r = radarTotals({ a: { unique: 10, types: { A320: 5, B738: 2 } }, b: { unique: 30, types: { A320: 1, A359: 4 } } });
    expect(r).toEqual({ days: 2, aircraft: 40, types: 3, busiest: 30 });
  });
  it("沒資料不會變成 -Infinity", async () => {
    const { radarTotals } = await import("./year-review");
    expect(radarTotals({})).toEqual({ days: 0, aircraft: 0, types: 0, busiest: 0 });
  });
});
