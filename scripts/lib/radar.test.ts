import { describe, expect, it } from "vitest";
import { airlineOf, applySample, detail, lookupTypes, summarize, twDate } from "./radar.js";

type Plane = { hex: string; flight?: string; seen?: number; alt?: number | string };
const T0 = Date.parse("2026-11-21T02:00:00Z"); // 台灣 10:00
const ok = (aircraft: Plane[]) => ({ reachable: true, rxConnected: true, shutdown: false, aircraft });

describe("airlineOf", () => {
  it("航空公司呼號取前三碼，其他格式回 null", () => {
    expect(airlineOf("CAL123  ")).toBe("CAL");
    expect(airlineOf("eva2195a")).toBe("EVA");
    expect(airlineOf("B18908")).toBeNull(); // 註冊號
    expect(airlineOf("")).toBeNull();
    expect(airlineOf(undefined)).toBeNull();
    expect(airlineOf("RCH")).toBeNull();
  });
});

describe("twDate", () => {
  it("用台灣時間換日", () => {
    expect(twDate(Date.parse("2026-11-20T15:59:00Z"))).toBe("2026-11-20");
    expect(twDate(Date.parse("2026-11-20T16:00:00Z"))).toBe("2026-11-21");
  });
});

describe("applySample", () => {
  it("同一架只算一次；呼號晚到會補記航空公司；60 秒前的不算現在", () => {
    let s = applySample(null, ok([{ hex: "8990F2", seen: 1 }, { hex: "abc123", flight: "EVA12", seen: 2 }, { hex: "old", seen: 200 }]), T0);
    s = applySample(s, ok([{ hex: "8990f2", flight: "CAL31", seen: 1 }]), T0 + 30_000);
    const day = s.days["2026-11-21"];
    expect(day.unique).toBe(2);
    expect(day.peak).toBe(2);
    expect(day.airlines).toEqual({ EVA: 1, CAL: 1 });
    expect(s.status.aircraftNow).toBe(1);
  });

  it("換日後重新數，前一天的識別碼不留", () => {
    let s = applySample(null, ok([{ hex: "a1", flight: "CAL1", seen: 0 }]), T0);
    s = applySample(s, ok([{ hex: "a1", flight: "CAL1", seen: 0 }]), T0 + 86400_000);
    expect(s.days["2026-11-21"].unique).toBe(1);
    expect(s.days["2026-11-22"].unique).toBe(1);
    expect(Object.keys(s.today.seen)).toEqual(["a1"]);
    expect(s.today.date).toBe("2026-11-22");
  });

  it("接收器斷線／卡在關機：不算飛機、記離線、lastOkAt 不前進", () => {
    let s = applySample(null, ok([{ hex: "a1", seen: 0 }]), T0);
    s = applySample(s, { reachable: true, rxConnected: false, shutdown: true, aircraft: [{ hex: "a2", seen: 0 }] }, T0 + 60_000);
    expect(s.days["2026-11-21"]).toMatchObject({ polls: 2, online: 1, unique: 1 });
    expect(s.status.lastOkAt).toBe(T0);
    expect(s.status.shutdown).toBe(true);
  });

  it("只留 120 天", () => {
    let s = applySample(null, ok([]), T0);
    s = applySample(s, ok([]), T0 + 121 * 86400_000);
    expect(Object.keys(s.days)).toEqual([twDate(T0 + 121 * 86400_000)]);
  });
});

describe("summarize", () => {
  it("公開資料只有數字跟航空公司：沒有識別碼、座標、IP、金鑰", () => {
    const s = applySample(null, ok([{ hex: "8990f2", flight: "CAL31", seen: 0 }, { hex: "x9", flight: "ZZZ9", seen: 0 }]), T0);
    const out = summarize(s, T0 + 10_000);
    expect(out).toMatchObject({ configured: true, online: true, aircraftNow: 2, today: { unique: 2, peak: 2 } });
    expect(out.today?.airlines).toEqual([
      { code: "CAL", name: "中華航空", n: 1 },
      { code: "ZZZ", name: "ZZZ", n: 1 },
    ]);
    const json = JSON.stringify(out);
    expect(json).not.toMatch(/8990f2|x9|192\.168|fr24key|lat|lon/i);
  });

  it("資料超過 3 分鐘沒更新就算離線（server 沒在讀）", () => {
    const s = applySample(null, ok([{ hex: "a1", seen: 0 }]), T0);
    expect(summarize(s, T0 + 4 * 60_000)).toMatchObject({ online: false, aircraftNow: 0 });
  });

  it("還沒設定雷達", () => {
    expect(summarize(null, T0)).toEqual({ configured: false });
  });
});

describe("detail（/radar 頁）", () => {
  it("每小時記最多同時幾架（台灣時間），離線的那次不記", () => {
    let s = applySample(null, ok([{ hex: "a", seen: 0 }, { hex: "b", seen: 0 }]), T0); // 台灣 10 點
    s = applySample(s, ok([{ hex: "a", seen: 0 }]), T0 + 60_000);
    s = applySample(s, { reachable: false, rxConnected: false, shutdown: false, aircraft: [] }, T0 + 3600_000); // 11 點離線
    const hp = s.days["2026-11-21"].hourPeak;
    expect(hp[10]).toBe(2);
    expect(hp[11]).toBeNull();
    expect(hp).toHaveLength(24);
  });

  it("近 30 天、每小時平均、近 7 天航空公司、累計；沒資料的日子是 null", () => {
    let s = applySample(null, ok([{ hex: "a", flight: "CAL1", seen: 0 }, { hex: "b", flight: "EVA2", seen: 0 }]), T0 - 86400_000);
    s = applySample(s, ok([{ hex: "c", flight: "CAL3", seen: 0 }]), T0);
    const d = detail(s, T0 + 1000);
    if (!("daily" in d)) throw new Error("detail 沒有 daily");
    expect(d.daily).toHaveLength(30);
    expect(d.daily.at(-1)).toMatchObject({ date: "2026-11-21", unique: 1, peak: 1, uptime: 100 });
    expect(d.daily.at(-2)).toMatchObject({ date: "2026-11-20", unique: 2 });
    expect(d.daily[0].unique).toBeNull();
    expect(d.hours[10]).toBe(1.5); // 兩天 10 點：2 架、1 架
    expect(d.hours[3]).toBeNull();
    expect(d.weekAirlines).toEqual([
      { code: "CAL", name: "中華航空", n: 2 },
      { code: "EVA", name: "長榮航空", n: 1 },
    ]);
    expect(d.total).toEqual({ unique: 3, peak: 2, days: 2 });
    expect(JSON.stringify(d)).not.toMatch(/"a"|"b"|"c"|lat|lon|192\.168/);
  });

  it("舊資料（沒有 hourPeak 的日子）也不會壞", () => {
    const s = applySample(null, ok([]), T0);
    delete s.days["2026-11-21"].hourPeak;
    const d = detail(s, T0);
    if (!("hours" in d)) throw new Error("detail 沒有 hours");
    expect(d.hours.every((h: number | null) => h === null)).toBe(true);
  });
});

describe("機型（TODO D4）", () => {
  it("快取查到才算、每架只算一次；查不到的不算也不重算；公開資料沒有識別碼", () => {
    const types: Record<string, { t?: string; miss?: number; at: number }> = { a: { t: "A21N", at: T0 }, b: { miss: 1, at: T0 } };
    let s = applySample(null, ok([{ hex: "a", seen: 0 }, { hex: "b", seen: 0 }, { hex: "c", seen: 0 }]), T0, types);
    s = applySample(s, ok([{ hex: "a", seen: 0 }]), T0 + 30_000, types);
    expect(s.days["2026-11-21"].types).toEqual({ A21N: 1 });
    types.c = { t: "B738", at: T0 }; // c 晚一點才查到
    s = applySample(s, ok([]), T0 + 60_000, types);
    expect(s.days["2026-11-21"].types).toEqual({ A21N: 1, B738: 1 });
    const d = detail(s, T0 + 90_000);
    if (!("weekTypes" in d)) throw new Error("detail 沒有 weekTypes");
    expect(d.weekTypes).toEqual([
      { code: "A21N", name: "A321neo", n: 1 },
      { code: "B738", name: "737-800", n: 1 },
    ]);
    expect(JSON.stringify(d)).not.toMatch(/"a"|"b"|"c"/);
  });

  it("lookupTypes：只查沒查過的、每輪最多 4 架、網路錯誤就停、查不到的 30 天後再試", async () => {
    let s = applySample(null, ok("abcdefg".split("").map((hex) => ({ hex, seen: 0 }))), T0);
    const types: Record<string, { t?: string; miss?: number; at: number }> = { a: { t: "A333", at: T0 }, b: { miss: 1, at: T0 - 31 * 86400_000 } };
    const asked: string[] = [];
    await lookupTypes(s, types, T0, async (hex: string, now: number) => (asked.push(hex), hex === "d" ? { miss: 1, at: now } : { t: "A20N", at: now }));
    expect(asked).toEqual(["b", "c", "d", "e"]);
    expect(types.d).toMatchObject({ miss: 1 });
    asked.length = 0;
    await lookupTypes(s, types, T0, async (hex: string) => (asked.push(hex), null));
    expect(asked).toEqual(["f"]); // 第一個就失敗 → 這輪停
    s = applySample(s, ok([]), T0 + 1000, types);
    expect(s.days["2026-11-21"].types).toEqual({ A333: 1, A20N: 3 });
  });
});

describe("flightsNow（Q1：現在收到的航班）", () => {
  it("只留航班代碼、機型、四捨五入的高度；沒有識別碼；沒呼號的不列；高的排前面", () => {
    const s = applySample(
      null,
      ok([
        { hex: "8990f2", flight: "CAL31  ", seen: 0, alt: 34975 },
        { hex: "abc123", flight: "EVA12", seen: 1, alt: 3480 },
        { hex: "nocall", seen: 0, alt: 12000 },
        { hex: "gnd001", flight: "TTW705", seen: 0, alt: "ground" },
      ]),
      T0,
      { "8990f2": { t: "A359" } },
    );
    expect(s.status.flightsNow).toEqual([
      { flight: "CAL31", airline: "CAL", alt: 35000, type: "A359" },
      { flight: "EVA12", airline: "EVA", alt: 3000, type: null },
      { flight: "TTW705", airline: "TTW", alt: 0, type: null },
    ]);
    expect(JSON.stringify(s.status.flightsNow)).not.toMatch(/8990f2|abc123|lat|lon/);
  });
  it("公開 API（summarize）不含現在的航班，只有 /radar 頁的 detail 有", () => {
    const s = applySample(null, ok([{ hex: "8990f2", flight: "CAL31", seen: 0, alt: 35000 }]), T0);
    expect(JSON.stringify(summarize(s, T0))).not.toContain("CAL31");
    const d = detail(s, T0);
    if (!("flightsNow" in d)) throw new Error("detail 沒有 flightsNow");
    expect(d.flightsNow[0]).toMatchObject({ flight: "CAL31", airlineName: expect.any(String) });
  });
});
