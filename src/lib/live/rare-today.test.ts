import { describe, expect, it } from "vitest";
import { rareFromState } from "@/lib/live/rare-today";


const NOW = Date.UTC(2026, 10, 26, 6); // 台灣 11/26 14:00

describe("rareFromState", () => {
  it("今天收到的稀有機型（747-8、A380）才算，一般機型不算", () => {
    const state = { days: { "2026-11-26": { types: { A321: 30, B748: 1, A388: 2, B738: 5 } } } };
    expect(rareFromState(state, NOW).map((e) => e.code).sort()).toEqual(["A388", "B748"]);
  });
  it("昨天收到的不算；沒有資料、數量 0 都是空的", () => {
    expect(rareFromState({ days: { "2026-11-25": { types: { B748: 3 } } } }, NOW)).toEqual([]);
    expect(rareFromState({ days: { "2026-11-26": { types: { B748: 0 } } } }, NOW)).toEqual([]);
    expect(rareFromState(null, NOW)).toEqual([]);
  });
});
