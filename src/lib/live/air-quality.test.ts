import { describe, expect, it } from "vitest";
import { aqiStatus, computeAirQuality, subIndex } from "@/lib/live/air-quality";

describe("subIndex（環境部 114 年版對照表）", () => {
  it("段落邊界跟內插", () => {
    expect(subIndex("pm25", 12.4)).toBe(50);
    expect(subIndex("pm25", 12.5)).toBe(51);
    expect(subIndex("pm25", 30.4)).toBe(100);
    expect(subIndex("pm25", 35)).toBe(112);
    expect(subIndex("pm25", 12.44)).toBe(50); // 先照有效位數四捨五入，不會掉進 12.4～12.5 的縫
    expect(subIndex("no2", 21)).toBe(50);
    expect(subIndex("o3_8h", 0.06)).toBe(67);
    expect(subIndex("pm10", 30.4)).toBe(50);
  });
  it("O3 小時值只在 0.101 ppm 以上才算；超過表格上限就給最高值", () => {
    expect(subIndex("o3_1h", 0.08)).toBeNull();
    expect(subIndex("o3_1h", 0.101)).toBe(101);
    expect(subIndex("pm25", 900)).toBe(500);
  });
});

describe("aqiStatus", () => {
  it("六個等級", () => {
    expect([0, 50, 51, 100, 101, 150, 151, 200, 201, 300, 301].map(aqiStatus)).toEqual([
      "良好", "良好", "普通", "普通", "對敏感族群不健康", "對敏感族群不健康", "對所有族群不健康", "對所有族群不健康", "非常不健康", "非常不健康", "危害",
    ]);
  });
});

describe("computeAirQuality", () => {
  const hours = Array.from({ length: 24 }, (_, i) => `2026-11-22T${String(i).padStart(2, "0")}:00`);
  const fill = (v: number) => hours.map(() => v);
  const base = { time: hours, pm2_5: fill(20), pm10: fill(25), ozone: fill(40), nitrogen_dioxide: fill(10), sulphur_dioxide: fill(5), carbon_monoxide: fill(300) };

  it("PM2.5 用 12＋4 小時移動平均、取最大的副指標、標出指標污染物", () => {
    const r = computeAirQuality(base, "2026-11-22T17:00");
    expect(r.time).toBe("2026-11-22T17:00");
    expect(r.aqi).toBe(72); // PM2.5 20 → 72
    expect(r.status).toBe("普通");
    expect(r.main).toBe("PM2.5");
    expect(r.pollutants.find((p) => p.key === "pm25")).toMatchObject({ value: 20, index: 72 });
  });

  it("最近 4 小時變髒，權重一半：比單純 12 小時平均反應快", () => {
    const pm = fill(10);
    for (let i = 14; i <= 17; i++) pm[i] = 40;
    const r = computeAirQuality({ ...base, pm2_5: pm }, "2026-11-22T17:00");
    // 前 12 小時平均 (8×10+4×40)/12 = 20，前 4 小時 40 → 0.5×20+0.5×40 = 30
    expect(r.pollutants[0].value).toBe(30);
  });

  it("AQI ≤ 50 不標指標污染物；資料不夠 12 小時就丟錯", () => {
    expect(computeAirQuality({ ...base, pm2_5: fill(5) }, "2026-11-22T17:00").main).toBeNull();
    expect(() => computeAirQuality(base, "2026-11-22T05:00")).toThrow();
  });
});
