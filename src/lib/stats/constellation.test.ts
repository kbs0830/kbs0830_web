import { describe, expect, it } from "vitest";
import { buildConstellation } from "@/lib/stats/constellation";

describe("buildConstellation", () => {
  const data: [string, number][] = [["TW", 900], ["JP", 40], ["US", 12], ["HK", 3], ["SG", 1]];
  it("一國一顆星、線數＝星數－1（連成一個星座）", () => {
    const c = buildConstellation(data);
    expect(c.stars).toHaveLength(5);
    expect(c.lines).toHaveLength(4);
  });
  it("越多人來越大", () => {
    const { stars } = buildConstellation(data);
    expect(stars[0].r).toBeGreaterThan(stars[4].r);
  });
  it("新國家加入時，舊的星星位置不變", () => {
    const a = buildConstellation(data).stars.find((s) => s.code === "JP")!;
    const b = buildConstellation([...data, ["KR", 5]]).stars.find((s) => s.code === "JP")!;
    expect([b.x, b.y]).toEqual([a.x, a.y]);
  });
  it("空的、只有一國都不會壞", () => {
    expect(buildConstellation([]).lines).toEqual([]);
    expect(buildConstellation([["TW", 1]]).lines).toEqual([]);
  });
});
