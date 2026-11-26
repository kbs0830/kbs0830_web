import { describe, expect, it } from "vitest";
import { blipPositions } from "@/components/live/RadarLive";

describe("blipPositions", () => {
  it("數量＝架數，上限 24，負數／0 沒有點", () => {
    expect(blipPositions(0)).toHaveLength(0);
    expect(blipPositions(-3)).toHaveLength(0);
    expect(blipPositions(7)).toHaveLength(7);
    expect(blipPositions(99)).toHaveLength(24);
  });
  it("位置固定（同一個架數永遠同一個排列）、都在圓盤裡", () => {
    expect(blipPositions(5)).toEqual(blipPositions(5));
    for (const b of blipPositions(24)) expect(Math.hypot(b.x - 100, b.y - 100)).toBeLessThanOrEqual(87);
  });
});
