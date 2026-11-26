import { describe, expect, it } from "vitest";
import { wavePath } from "@/components/fun/FlowLines";

const points = (d: string) => d.split(" ").map((p) => p.slice(1).split(",").map(Number) as [number, number]);

describe("wavePath", () => {
  it("兩個週期：起點跟 x=1000、x=2000 的高度相同（往左移半個寬度才能無縫循環）", () => {
    const pts = points(wavePath(50, 8, 1.3));
    const at = (x: number) => pts.find(([px]) => px === x)![1];
    expect(pts[0][0]).toBe(0);
    expect(pts.at(-1)![0]).toBe(2000);
    expect(at(0)).toBeCloseTo(at(1000), 1);
    expect(at(1000)).toBeCloseTo(at(2000), 1);
  });
  it("振幅不超過設定值", () => {
    for (const [, y] of points(wavePath(50, 8, 0))) expect(Math.abs(y - 50)).toBeLessThanOrEqual(8.01);
  });
});
