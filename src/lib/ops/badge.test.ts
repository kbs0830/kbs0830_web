import { describe, expect, it } from "vitest";
import { badgeSvg, uptimeBadge } from "@/lib/ops/badge";

describe("badge", () => {
  it("可用率四捨五入、低於 99% 換警示色", () => {
    expect(uptimeBadge(1)).toEqual({ message: "100%", color: "#2d5a8e" });
    expect(uptimeBadge(0.99812)).toEqual({ message: "99.81%", color: "#2d5a8e" });
    expect(uptimeBadge(0.9712)).toEqual({ message: "97.1%", color: "#b45309" });
    expect(uptimeBadge(null).message).toBe("no data");
  });
  it("SVG 會跳脫文字、寬度隨字數變", () => {
    const svg = badgeSvg("a<b", "x&y", "#000");
    expect(svg).toContain("a&lt;b");
    expect(svg).toContain("x&amp;y");
    expect(Number(badgeSvg("uptime", "100%", "#000").match(/width="(\d+)"/)![1])).toBeGreaterThan(Number(badgeSvg("up", "1%", "#000").match(/width="(\d+)"/)![1]));
  });
});
