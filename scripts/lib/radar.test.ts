import { describe, expect, it } from "vitest";
import { airlineOf, applySample, detail, summarize, twDate } from "./radar.js";

type Plane = { hex: string; flight?: string; seen?: number };
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
