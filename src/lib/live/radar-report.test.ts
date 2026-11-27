import { describe, expect, it } from "vitest";
import { acceptReport, factsText, reportFacts, templateReport } from "./radar-report";

// 狀態的形狀跟 data/radar.json 一樣：days[日期] = { polls, online, peak, unique, airlines, types, hourPeak[24] }
const hourPeak = Array.from({ length: 24 }, (_, h) => (h === 8 ? 9 : h === 14 ? 6 : 2));
const state = {
  days: {
    "2026-11-20": { unique: 100, peak: 5, polls: 10, online: 10 },
    "2026-11-21": { unique: 140, peak: 6, polls: 10, online: 10 },
    "2026-11-26": { unique: 150, peak: 9, polls: 100, online: 97, hourPeak, airlines: { EVA: 30, CAL: 20, JAL: 10 }, types: { A321: 25, B77W: 10, B744: 1 } },
    "2026-11-27": { unique: 3, peak: 1, polls: 5, online: 5 },
  },
};

describe("reportFacts", () => {
  it("算出昨天的數字：最忙時段、最多的航空公司與機型、珍しい機型、前 7 天平均、在線率", () => {
    const f = reportFacts(state, "2026-11-26")!;
    expect(f).toMatchObject({ unique: 150, peak: 9, busiestHour: 8, avg7: 120, uptime: 97 });
    expect(f.airline?.n).toBe(30);
    expect(f.type?.n).toBe(25);
    expect(f.rare.join()).toContain("747"); // B744 是圖鑑標的珍しい
  });
  it("那天沒資料、或一架都沒收到就回 null；沒有前幾天就沒有平均", () => {
    expect(reportFacts(state, "2026-11-25")).toBeNull();
    expect(reportFacts({ days: { "2026-11-26": { unique: 0 } } }, "2026-11-26")).toBeNull();
    expect(reportFacts(null, "2026-11-26")).toBeNull();
    expect(reportFacts({ days: { "2026-11-26": { unique: 5, peak: 2, polls: 1, online: 1 } } }, "2026-11-26")?.avg7).toBeNull();
  });
});

describe("templateReport／factsText", () => {
  it("固定句型：有數字、有比較，不提位置", () => {
    const f = reportFacts(state, "2026-11-26")!;
    const t = templateReport(f);
    expect(t).toContain("150 架");
    expect(t).toContain("比前 7 天平均的 120 架多");
    expect(t).toContain("8 點到 9 點");
    expect(t).not.toMatch(/位置|距離|機場|座標/);
    expect(factsText(f)).toContain("最忙的時段：8 點到 9 點");
  });
  it("在線率偏低才提醒", () => {
    const low = reportFacts({ days: { "2026-11-26": { unique: 5, peak: 2, polls: 100, online: 40 } } }, "2026-11-26")!;
    expect(templateReport(low)).toContain("40%");
    expect(templateReport(reportFacts(state, "2026-11-26")!)).not.toContain("在線");
  });
});

describe("acceptReport（檢查模型寫的日報）", () => {
  const facts = factsText(reportFacts(state, "2026-11-26")!);
  const ok = "11 月 26 日收到 150 架不同的飛機，同時最多 9 架，早上 8 點到 9 點最忙，以長榮航空最常出現。";

  it("合格的原樣通過（換行會接起來）", () => {
    expect(acceptReport(ok, facts)).toBe(ok);
    expect(acceptReport(`${ok.slice(0, 20)}\n${ok.slice(20)}`, facts)).toBe(ok);
  });
  it("冒出事實裡沒有的數字就退回（模型最常犯的錯）", () => {
    expect(acceptReport(ok.replace("150", "180"), facts)).toBeNull();
    expect(acceptReport(`${ok}比上週多了 35%。`, facts)).toBeNull();
  });
  it("開場白、標題、條列、太短、太長退回", () => {
    expect(acceptReport(`好的，這是日報：${ok}`, facts)).toBeNull();
    expect(acceptReport(`以下是日報。${ok}`, facts)).toBeNull();
    expect(acceptReport(`**日報**\n${ok}`, facts)).toBeNull();
    expect(acceptReport("收到 150 架。", facts)).toBeNull();
    expect(acceptReport(ok.repeat(6), facts)).toBeNull();
  });
  it("提到位置、距離、機場、地名就退回；航空公司名稱裡的地名不算", () => {
    expect(acceptReport("11 月 26 日收到 150 架飛機，多半是從南邊的方向飛過來的，同時最多 9 架。", facts)).toBeNull();
    expect(acceptReport("11 月 26 日收到 150 架飛機，離機場很近所以特別多，同時最多 9 架。", facts)).toBeNull();
    const jal = "11 月 26 日收到 150 架飛機，日本航空最常出現，同時最多 9 架，最忙是 8 點到 9 點。";
    expect(acceptReport(jal, facts)).toBeNull();
    expect(acceptReport(jal, facts, ["日本航空"])).toBe(jal);
  });
});
