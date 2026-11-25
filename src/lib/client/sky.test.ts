import { describe, expect, it } from "vitest";
import { isSakuraSeason, phaseAt, skyWeather, sunTimes } from "@/lib/client/sky";

const tw = (s: string) => new Date(`${s}+08:00`).getTime();
const twClock = (ms: number) => new Date(ms + 8 * 3600_000).toISOString().slice(11, 16);
const minutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3));

describe("sunTimes（高雄）", () => {
  it("11 月底：日出約 06:20、日落約 17:10（誤差 10 分鐘內）", () => {
    const { sunrise, sunset } = sunTimes(new Date(Date.UTC(2026, 10, 25)));
    expect(Math.abs(minutes(twClock(sunrise)) - minutes("06:20"))).toBeLessThan(10);
    expect(Math.abs(minutes(twClock(sunset)) - minutes("17:10"))).toBeLessThan(10);
  });
  it("夏至：日出約 05:22、日落約 18:48", () => {
    const { sunrise, sunset } = sunTimes(new Date(Date.UTC(2026, 5, 21)));
    expect(Math.abs(minutes(twClock(sunrise)) - minutes("05:22"))).toBeLessThan(10);
    expect(Math.abs(minutes(twClock(sunset)) - minutes("18:48"))).toBeLessThan(10);
  });
});

describe("phaseAt", () => {
  it("一天的四個時段", () => {
    expect(phaseAt(tw("2026-11-25T03:00:00"))).toBe("night");
    expect(phaseAt(tw("2026-11-25T06:15:00"))).toBe("dawn");
    expect(phaseAt(tw("2026-11-25T12:00:00"))).toBe("day");
    expect(phaseAt(tw("2026-11-25T17:05:00"))).toBe("dusk");
    expect(phaseAt(tw("2026-11-25T21:00:00"))).toBe("night");
  });
});

describe("skyWeather／isSakuraSeason", () => {
  it("WMO 代碼分類", () => {
    expect([0, 2, 45, 61, 81, 95].map(skyWeather)).toEqual(["clear", "cloud", "fog", "rain", "rain", "storm"]);
  });
  it("櫻花季 3/18～4/12", () => {
    expect(isSakuraSeason(tw("2026-03-30T12:00:00"))).toBe(true);
    expect(isSakuraSeason(tw("2026-04-13T12:00:00"))).toBe(false);
    expect(isSakuraSeason(tw("2026-11-25T12:00:00"))).toBe(false);
  });
});
