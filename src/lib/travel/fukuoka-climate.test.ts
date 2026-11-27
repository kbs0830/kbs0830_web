import { describe, expect, it } from "vitest";
import { MONTHS, monthInfo, outfitFor, parseMonth, SOURCE, YEAR_RANGE } from "@/lib/travel/fukuoka-climate";
import data from "@/lib/travel/climate-data.json";

describe("climate-data.json（gen-climate.mjs 產生的）", () => {
  it("福岡、高雄各 12 個月，數字合理：最高 > 最低、雨天 0～31、福岡 1 月比 8 月冷", () => {
    for (const place of [data.fukuoka, data.kaohsiung]) {
      expect(place).toHaveLength(12);
      for (const m of place) {
        expect(m.high).toBeGreaterThan(m.low);
        expect(m.rainyDays).toBeGreaterThanOrEqual(0);
        expect(m.rainyDays).toBeLessThanOrEqual(31);
      }
    }
    expect(data.fukuoka[0].high).toBeLessThan(data.fukuoka[7].high);
    // 冬天高雄明顯比福岡暖（夏天不一定：8 月 ERA5 的福岡甚至比高雄熱，所以只檢查冬天）
    for (const i of [11, 0, 1]) expect(data.kaohsiung[i].high - data.fukuoka[i].high).toBeGreaterThan(8);
    expect(SOURCE).toContain("Open-Meteo");
    expect(YEAR_RANGE).toEqual([2015, 2024]);
  });
});

describe("穿著建議區間", () => {
  it("邊界：最高溫 12／17／22／27 切換；最低溫 < 5 一律冬季重裝", () => {
    expect(outfitFor(11.9, 6).tier).toBe("冬季重裝");
    expect(outfitFor(12, 6).tier).toBe("大衣・厚外套");
    expect(outfitFor(16.9, 10).tier).toBe("大衣・厚外套");
    expect(outfitFor(17, 10).tier).toBe("薄外套・長袖");
    expect(outfitFor(22, 15).tier).toBe("短袖加薄外套");
    expect(outfitFor(27, 20).tier).toBe("夏裝・防曬");
    expect(outfitFor(15, 4.9).tier).toBe("冬季重裝");
  });
});

describe("每月頁（V2）", () => {
  it("網址的月份只認 1～12，不認前導 0、超過範圍、奇怪字元", () => {
    expect(parseMonth("3")).toBe(3);
    expect(parseMonth("12")).toBe(12);
    for (const bad of ["0", "13", "03", "a", "", "1.5", "-1", "../x"]) expect(parseMonth(bad)).toBeNull();
    expect(monthInfo(0)).toBeNull();
  });

  it("第一句就是答案、標題帶搜尋字；福岡比高雄冷", () => {
    for (const m of MONTHS) {
      const info = monthInfo(m)!;
      expect(info.title).toContain(`福岡 ${m} 月穿搭`);
      expect(info.description.startsWith(info.answer)).toBe(true);
    }
    // 冬天寫「比高雄冷」；夏天差不到 2 度就寫「差不多」，不硬說福岡比較冷
    expect(monthInfo(1)!.answer).toMatch(/比高雄冷約 \d+ 度/);
    expect(monthInfo(8)!.answer).toContain("氣溫跟高雄差不多");
    expect(monthInfo(8)!.answer).not.toContain("比高雄冷");
    expect(monthInfo(1)!.outfit.tier).toBe("冬季重裝");
    expect(monthInfo(8)!.outfit.tier).toBe("夏裝・防曬");
  });

  it("雨的提醒：6、7 月講梅雨，8、9 月講颱風，4 月雨天不多就不寫梅雨颱風", () => {
    expect(monthInfo(6)!.rainNote).toContain("梅雨");
    expect(monthInfo(9)!.rainNote).toContain("颱風");
    expect(monthInfo(4)!.rainNote ?? "").not.toMatch(/梅雨|颱風/);
  });
});
