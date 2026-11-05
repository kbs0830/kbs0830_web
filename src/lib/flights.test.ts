import { describe, expect, it } from "vitest";
import { AIRLINES, AIRPORTS, FLIGHTS, distanceKm, flightStats, routes } from "./flights";

describe("flights", () => {
  it("每一班的機場、航空公司都查得到（打錯代碼會在這裡抓到）", () => {
    for (const [code, from, to] of FLIGHTS) {
      expect(AIRPORTS[from], `${code} ${from}`).toBeDefined();
      expect(AIRPORTS[to], `${code} ${to}`).toBeDefined();
      expect(AIRLINES[code.slice(0, 2)], code).toBeDefined();
      expect(from, code).not.toBe(to);
    }
  });

  it("使用者說沒搭到／重複的那兩班不能出現", () => {
    const codes = FLIGHTS.map(([c]) => c);
    expect(codes).not.toContain("JX206");
    expect(codes).not.toContain("GK17");
  });

  it("隱私：資料裡只有代碼跟機場，沒有任何日期或時間", () => {
    const text = JSON.stringify(FLIGHTS);
    expect(text).not.toMatch(/\d{4}-\d{2}-\d{2}|\d{1,2}:\d{2}/);
  });

  it("距離計算對得上公開數據：桃園–成田約 2,180 km、桃園–舊金山約 10,380 km、高雄–福岡約 1,570 km", () => {
    expect(distanceKm("TPE", "NRT")).toBeCloseTo(2180, -2);
    expect(distanceKm("TPE", "SFO")).toBeCloseTo(10380, -2);
    expect(distanceKm("KHH", "FUK")).toBeCloseTo(1570, -2);
  });

  it("航線不分方向合併、統計數字對得上", () => {
    const r = routes();
    expect(r.reduce((n, x) => n + x.count, 0)).toBe(FLIGHTS.length);
    expect(new Set(r.map((x) => `${x.a}-${x.b}`)).size).toBe(r.length);
    expect(flightStats().flights).toBe(FLIGHTS.length);
  });
});
