import { describe, expect, it } from "vitest";
import { growBonsai, seasonOf } from "@/lib/ops/bonsai";

const base = { deploys: 30, posts: 8, ageDays: 120, fallen: 3, scars: 5, month: 11 };

describe("growBonsai", () => {
  it("同樣的資料長出同一棵樹", () => {
    expect(growBonsai(base)).toEqual(growBonsai(base));
  });
  it("部署越多主枝越多（3～9 根）、葉團越大；落葉＝中斷天數、疤＝事故", () => {
    const b = growBonsai(base);
    expect(b.branches.length).toBeGreaterThanOrEqual(3);
    expect(b.branches.length).toBeLessThanOrEqual(9);
    expect(growBonsai({ ...base, deploys: 0 }).branches).toHaveLength(3);
    expect(growBonsai({ ...base, deploys: 5000 }).branches).toHaveLength(9);
    expect(growBonsai({ ...base, deploys: 200 }).pads.length).toBeGreaterThan(growBonsai({ ...base, deploys: 5 }).pads.length);
    expect(b.fallen).toHaveLength(3);
    expect(b.scars).toHaveLength(5);
  });
  it("文章越多葉越茂密", () => {
    const area = (p: number) => growBonsai({ ...base, posts: p }).pads.reduce((s, x) => s + x.r * x.r, 0);
    expect(area(25)).toBeGreaterThan(area(0));
  });
  it("季節", () => {
    expect([1, 4, 7, 11].map(seasonOf)).toEqual(["winter", "spring", "summer", "autumn"]);
    expect(growBonsai(base).season).toBe("autumn");
  });
});
