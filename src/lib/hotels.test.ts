import { describe, expect, it } from "vitest";
import { CITIES, HOTELS, MEMBERSHIPS, hotelStats, hotelsByPlace } from "./hotels";
import { MAP_AREAS } from "@/components/ui/HotelMap";

describe("hotels", () => {
  it("78 間（使用者 2026-11-09 確認全部住過），沒有重複", () => {
    expect(HOTELS).toHaveLength(78);
    expect(new Set(HOTELS.map(([n]) => n)).size).toBe(HOTELS.length);
  });

  it("每間的城市都在 CITIES 裡，國家跟首頁足跡對得起來", () => {
    for (const [, city] of HOTELS) expect(CITIES[city], city).toBeDefined();
    const countries = new Set(HOTELS.map(([, c]) => CITIES[c].country));
    expect([...countries].sort()).toEqual(["台灣", "日本", "泰國", "美國", "越南", "韓國", "香港"].sort());
  });

  it("隱私：名稱裡沒有日期、時間、長串數字（訂房／會員編號）", () => {
    const names = [...HOTELS.map(([n]) => n), ...MEMBERSHIPS.flatMap((m) => [m.program, m.tier ?? ""])].join("\n");
    expect(names).not.toMatch(/\d{1,2}:\d{2}/); // 時間（權益裡的「16:00 退房」不算，所以只查名稱）
    const all = [names, ...MEMBERSHIPS.flatMap((m) => [m.perks ?? "", m.until ?? ""])].join("\n");
    expect(all).not.toMatch(/\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/); // 日期（效期只寫年份）
    expect(all).not.toMatch(/\d{6,}/); // 會員編號、訂房代碼
  });

  it("地圖：每個住過的城市（美國以外）都剛好屬於一個區塊", () => {
    const used = new Set(HOTELS.map(([, c]) => c).filter((c) => CITIES[c].country !== "美國"));
    const asia = MAP_AREAS.ASIA.flatMap((a) => a.cities);
    const tw = MAP_AREAS.TAIWAN.flatMap((a) => a.cities);
    for (const c of used) {
      expect(asia.filter((x) => x === c), `東亞圖 ${c}`).toHaveLength(1);
      if (CITIES[c].country === "台灣") expect(tw.filter((x) => x === c), `台灣圖 ${c}`).toHaveLength(1);
    }
  });

  it("統計跟分組加起來等於總數，「其他」排最後", () => {
    const s = hotelStats();
    expect(s.groups.reduce((n, [, c]) => n + c, 0)).toBe(78);
    expect(s.groups.at(-1)?.[0]).toBe("其他");
    expect(hotelsByPlace().flatMap(([, cities]) => cities.flatMap(([, h]) => h))).toHaveLength(78);
    expect(hotelsByPlace()[0][0]).toBe("台灣");
  });
});
