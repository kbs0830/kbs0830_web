import { describe, expect, it } from "vitest";
import { addHeroReport, parseHeroReport } from "@/lib/stats/hero-stats";

describe("hero-stats", () => {
  it("只收認得的版本；退回原因歸成幾類", () => {
    expect(parseHeroReport({ variant: "gl" })).toEqual({ variant: "gl", fallback: undefined });
    expect(parseHeroReport({ variant: "evil" })).toBeNull();
    expect(parseHeroReport({ fallback: "init: shader compile error" })).toEqual({ variant: undefined, fallback: "init" });
    expect(parseHeroReport({ fallback: "slow" })?.fallback).toBe("slow");
    expect(parseHeroReport({ fallback: "something weird" })?.fallback).toBe("other");
    expect(parseHeroReport("nope")).toBeNull();
  });
  it("累加次數", () => {
    let s = addHeroReport(null, { variant: "lite" }, "2026-11-25");
    s = addHeroReport(s, { variant: "lite" }, "2026-11-26");
    s = addHeroReport(s, { fallback: "slow" }, "2026-11-26");
    expect(s).toEqual({
      since: "2026-11-25",
      variants: { lite: 2 },
      fallbacks: { slow: 1 },
      days: { "2026-11-25": { lite: 1 }, "2026-11-26": { lite: 1, "退回:slow": 1 } },
    });
  });
});
