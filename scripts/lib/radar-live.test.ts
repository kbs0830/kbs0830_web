import { describe, expect, it } from "vitest";
import { DELAY_MS, buildFrame, recordTrack } from "./radar-live.js";

const T0 = Date.parse("2026-11-27T04:00:00Z");
const plane = (o = {}) => ({ hex: "AB12CD", flight: "EVA145  ", lat: 22.5742513, lon: 120.438995, seen_pos: 1, alt: 1275, speed: 151, track: 273, ...o });
const ok = (aircraft: object[]) => ({ reachable: true, rxConnected: true, shutdown: false, aircraft });
const names = { airlines: { EVA: "長榮航空" }, types: { A321: "A321" } };

describe("recordTrack", () => {
  it("座標進位到 4 位、呼號整理、沒座標／位置太舊的不記", () => {
    const t = recordTrack(null, ok([plane(), plane({ hex: "x1", lat: undefined }), plane({ hex: "x2", seen_pos: 120 })]), T0);
    expect(t.samples).toHaveLength(1);
    expect(t.samples[0].ac).toHaveLength(1);
    expect(t.samples[0].ac[0]).toMatchObject({ h: "ab12cd", f: "EVA145", la: 22.5743, lo: 120.439 });
  });
  it("20 分鐘以前的取樣會丟掉；離線記空取樣", () => {
    let t = recordTrack(null, ok([plane()]), T0);
    t = recordTrack(t, { reachable: false, rxConnected: false, shutdown: false, aircraft: [] }, T0 + 30 * 60_000);
    expect(t.samples).toHaveLength(1);
    expect(t.samples[0]).toMatchObject({ ok: false, ac: [] });
  });
});

describe("buildFrame（延遲 5 分鐘＋不外流識別碼）", () => {
  const track = () => {
    let t = recordTrack(null, ok([plane()]), T0);
    t = recordTrack(t, ok([plane({ lat: 22.58 })]), T0 + 30_000);
    return recordTrack(t, ok([plane({ lat: 22.59 })]), T0 + 60_000);
  };
  it("比 now - 5 分鐘新的取樣不會出現", () => {
    const f = buildFrame(track(), null, names, T0 + 30_000 + DELAY_MS); // 只有前兩筆夠舊
    expect(f.samples.map((s: { t: number }) => s.t)).toEqual([T0, T0 + 30_000]);
    expect(buildFrame(track(), null, names, T0 + DELAY_MS - 1).samples).toHaveLength(0);
  });
  it("輸出沒有 hex，id 同一天固定、換日會變", () => {
    const f = buildFrame(track(), { ab12cd: { t: "A321" } }, names, T0 + 60_000 + DELAY_MS);
    const json = JSON.stringify(f);
    expect(json).not.toMatch(/ab12cd/i);
    const id = f.samples[0].p[0][0];
    expect(f.samples[2].p[0][0]).toBe(id);
    expect((f.info as Record<string, unknown>)[id]).toMatchObject({ f: "EVA145", al: "EVA", an: "長榮航空", ty: "A321", tn: "A321" });
    const nextDay = buildFrame(recordTrack(null, ok([plane()]), T0 + 86400_000), null, names, T0 + 86400_000 + DELAY_MS);
    expect(nextDay.samples[0].p[0][0]).not.toBe(id);
  });
});
