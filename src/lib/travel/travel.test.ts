import { describe, expect, it } from "vitest";
import { travelArcs, travelPlaces, travelStats } from "@/lib/travel/travel";
import { FLIGHTS } from "@/lib/travel/flights";
import { HOTELS } from "@/lib/travel/hotels";

describe("旅行地球的資料", () => {
  it("飯店數、起降次數都對得上原始資料", () => {
    const places = travelPlaces();
    expect(places.reduce((n, p) => n + p.hotels, 0)).toBe(HOTELS.length);
    expect(places.reduce((n, p) => n + p.flights, 0)).toBe(FLIGHTS.length * 2);
    expect(new Set(places.map((p) => p.id)).size).toBe(places.length);
  });

  it("機場併到附近的城市（成田 → 東京有住過的話）", () => {
    const places = travelPlaces();
    const fuk = places.filter((p) => p.name.startsWith("福岡"));
    expect(fuk).toHaveLength(1);
    expect(fuk[0].flights).toBeGreaterThan(0);
  });

  it("航線每條都有座標、統計數字合理；隱私：沒有日期", () => {
    const arcs = travelArcs();
    expect(arcs.length).toBeGreaterThan(5);
    for (const a of arcs) expect(a.from.concat(a.to).every(Number.isFinite)).toBe(true);
    expect(travelStats().countries).toBeGreaterThan(3);
    expect(JSON.stringify([travelPlaces(), arcs])).not.toMatch(/\d{4}-\d{2}-\d{2}/);
  });
});
