import { describe, expect, it } from "vitest";
import { parseContributions } from "./github-contrib";

// 做一份像 GitHub 的假頁面：每天一個 <td> 加一個 tool-tip
function fake(n: number) {
  let h = "";
  const t0 = Date.UTC(2025, 10, 23);
  for (let i = 0; i < n; i++) {
    const d = new Date(t0 + i * 86400_000).toISOString().slice(0, 10);
    const c = i % 7 === 0 ? 0 : i % 5;
    h += `<td data-date="${d}" id="contribution-day-component-${i % 7}-${Math.floor(i / 7)}" data-level="${Math.min(4, c)}" role="gridcell" class="ContributionCalendar-day"></td>`;
    h += `<tool-tip for="contribution-day-component-${i % 7}-${Math.floor(i / 7)}" popover="manual">${c === 0 ? "No contributions" : `${c} contributions`} on ${d}.</tool-tip>`;
  }
  return h;
}

describe("parseContributions", () => {
  it("每天一筆、有日期、次數跟等級", () => {
    const days = parseContributions(fake(371));
    expect(days).toHaveLength(371);
    expect(days[0]).toEqual({ date: "2025-11-23", level: 0, count: 0 });
    expect(days[1].count).toBe(1);
    expect(days.at(-1)!.date > days[0].date).toBe(true);
  });
  it("格式改了（解析不到幾天）就丟例外，不回空資料", () => {
    expect(() => parseContributions("<html>nope</html>")).toThrow();
  });
});
