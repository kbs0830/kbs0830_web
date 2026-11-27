import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { flightHours, greatCircleKm, hm } from "@/lib/tools/flight-calc";
import { allRouteSlugs, DESTINATIONS, ORIGINS, routeInfo, routeSlug } from "@/lib/tools/popular-routes";

describe("flight-calc", () => {
  it("大圓距離：同一點是 0；已知航線在合理範圍（桃園→福岡約 1,300 公里）", () => {
    const p = { lat: 25.078, lon: 121.233 };
    expect(greatCircleKm(p, p)).toBeCloseTo(0, 5);
    const km = greatCircleKm(p, { lat: 33.586, lon: 130.451 });
    expect(km).toBeGreaterThan(1250);
    expect(km).toBeLessThan(1350);
  });
  it("hm 不會出現 60 分（2.9999 小時 → 3 小時 0 分）", () => {
    expect(hm(2.9999)).toBe("3 小時 0 分");
    expect(hm(2.1667)).toBe("2 小時 10 分");
    expect(hm(0.5)).toBe("0 小時 30 分");
    expect(flightHours(800)).toBeCloseTo(1.5, 5);
  });
});

describe("熱門航線（V3）", () => {
  it("30 條、網址不重複、都解析得回來", () => {
    const slugs = allRouteSlugs();
    expect(slugs).toHaveLength(ORIGINS.length * DESTINATIONS.length);
    expect(new Set(slugs).size).toBe(30);
    for (const s of slugs) expect(routeInfo(s)?.slug).toBe(s);
  });

  it("座標跟 public/data/airports.json（工具用的那份）一致", () => {
    const rows = JSON.parse(fs.readFileSync("public/data/airports.json", "utf8")).airports as [string, string, string, string, number, number][];
    const byCode = new Map(rows.map((r) => [r[0], r]));
    for (const a of [...ORIGINS, ...DESTINATIONS]) {
      const r = byCode.get(a.code);
      expect(r, `${a.code} 不在 airports.json`).toBeTruthy();
      expect([a.lat, a.lon]).toEqual([r![4], r![5]]);
    }
  });

  it("第一句就是答案：有距離、英里、飛行時間；標題帶搜尋字", () => {
    const r = routeInfo("tpe-fuk")!;
    expect(r.answer).toMatch(/^台北（桃園，TPE）到福岡（FUK）的直線距離約 1,\d{3} 公里（\d{3} 英里），飛行約 \d 小時 \d+ 分。$/);
    expect(r.title).toContain("台北（桃園）到福岡飛行距離與時間");
    expect(r.description.startsWith(r.answer)).toBe(true);
    expect(routeSlug("KHH", "CTS")).toBe("khh-cts");
  });

  it("不存在的航線、格式怪的網址回 null", () => {
    for (const bad of ["fuk-tpe", "tpe-xxx", "tpe", "tpe-fuk-extra", "", "../x"]) expect(routeInfo(bad)).toBeNull();
  });
});
