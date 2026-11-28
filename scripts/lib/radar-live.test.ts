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

describe("buildFrame（延遲＋不外流識別碼）", () => {
  const track = () => {
    let t = recordTrack(null, ok([plane()]), T0);
    t = recordTrack(t, ok([plane({ lat: 22.58 })]), T0 + 30_000);
    return recordTrack(t, ok([plane({ lat: 22.59 })]), T0 + 60_000);
  };
  it("比 now - DELAY_MS 新的取樣不會出現", () => {
    const f = buildFrame(track(), null, names, T0 + 30_000 + DELAY_MS); // 只有前兩筆夠舊
    expect(f.samples.map((s: { t: number }) => s.t)).toEqual([T0, T0 + 30_000]);
    expect(buildFrame(track(), null, names, T0 + DELAY_MS - 1).samples).toHaveLength(0);
  });
  it("地面與 1,000 ft 以下不出現，座標粗化到 3 位小數", () => {
    let t = recordTrack(null, ok([plane({ hex: "low1", flight: "CAL9", alt: 500 }), plane({ hex: "gnd1", flight: "CAL8", alt: "ground" }), plane({ hex: "unk1", flight: "CAL7", alt: undefined }), plane()]), T0);
    t = recordTrack(t, ok([plane()]), T0 + 30_000);
    const f = buildFrame(t, null, names, T0 + 30_000 + DELAY_MS);
    expect(f.samples[0].p).toHaveLength(1);
    expect(f.samples[0].p[0][1]).toBe(22.574);
    expect(f.samples[0].p[0][2]).toBe(120.439);
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

describe("剛剛經過", () => {
  it("已經離開畫面的才算，最多 5 班、同班號只留最新、時間在延遲之後的不出現、低空不收", () => {
    let t = null as ReturnType<typeof recordTrack> | null;
    // 6 班不同航班，依序只出現在一個取樣；另一班（CAL1）一直在畫面上
    ["CAL11", "CAL12", "CAL13", "CAL14", "CAL15", "CAL16"].forEach((f, i) => {
      t = recordTrack(t, ok([plane({ hex: `h${i}`, flight: f }), plane({ hex: "stay", flight: "CAL1" })]), T0 + i * 30_000);
    });
    t = recordTrack(t, ok([plane({ hex: "low", flight: "CAL99", alt: 400 })]), T0 + 6 * 30_000);
    for (let i = 7; i < 12; i++) t = recordTrack(t, ok([plane({ hex: "stay", flight: "CAL1" })]), T0 + i * 30_000);
    const now = T0 + 11 * 30_000 + DELAY_MS;
    const f = buildFrame(t, null, names, now);
    const flights = f.recent.map((r: { f: string }) => r.f);
    expect(flights).toEqual(["CAL16", "CAL15", "CAL14", "CAL13", "CAL12"]); // 最新的在前、只有 5 班
    expect(flights).not.toContain("CAL1"); // 還在畫面上
    expect(flights).not.toContain("CAL99"); // 低空不收
    expect(JSON.stringify(f.recent)).not.toMatch(/h\d|stay/); // 沒有 hex
    // 畫面時間之後才離開的不算（還沒「發生」）
    expect(buildFrame(t, null, names, T0 + DELAY_MS).recent).toEqual([]);
  });
});

describe("飛機詳細資料", () => {
  it("註冊號、製造商、全名、所屬公司、國別會帶進 info；沒有的欄位不出現；hex 不外流", () => {
    const t = recordTrack(null, ok([plane()]), T0);
    const types = { ab12cd: { t: "A321", v: 2, r: "B-16201", m: "Airbus", n: "A321 211", o: "EVA Air", c: "TW" } };
    const f = buildFrame(t, types, names, T0 + DELAY_MS + 1000);
    const id = f.samples[0].p[0][0];
    expect((f.info as Record<string, unknown>)[id]).toMatchObject({ rg: "B-16201", mf: "Airbus", ft: "A321 211", ow: "EVA Air", cc: "TW" });
    expect(JSON.stringify(f)).not.toMatch(/ab12cd/i);
    const bare = buildFrame(t, { ab12cd: { t: "A321" } }, names, T0 + DELAY_MS + 1000);
    expect(Object.keys((bare.info as Record<string, object>)[id])).not.toContain("rg");
  });
  it("沒有正常航班代碼的飛機（私人機、軍機）不帶任何詳細資料", () => {
    const t = recordTrack(null, ok([plane({ hex: "pr1", flight: "N123AB" })]), T0);
    const f = buildFrame(t, { pr1: { t: "C172", v: 2, r: "N123AB", o: "John Doe", c: "US" } }, names, T0 + DELAY_MS + 1000);
    const id = f.samples[0].p[0][0];
    expect((f.info as Record<string, object>)[id]).toEqual({ f: "", al: null, an: null, ty: "C172", tn: "C172" });
    expect(JSON.stringify(f)).not.toMatch(/John Doe|N123AB/);
  });

  it("剛剛經過也不含私人機：沒有正常班號的不進清單、也不帶註冊號與所屬人", () => {
    let t = recordTrack(null, ok([plane({ hex: "pr1", flight: "N123AB", alt: 5000 }), plane({ hex: "ok1", flight: "EVA145" })]), T0);
    t = recordTrack(t, ok([]), T0 + 30_000);
    const types = { pr1: { t: "C172", v: 2, r: "N123AB", o: "John Doe", c: "US" }, ok1: { t: "A321", v: 2, r: "B-16201", o: "EVA Air", c: "TW" } };
    const f = buildFrame(t, types, names, T0 + 30_000 + DELAY_MS + 120_000);
    expect(f.recent.map((r: { f: string }) => r.f)).toEqual(["EVA145"]);
    expect(JSON.stringify(f)).not.toMatch(/John Doe|N123AB/);
  });
});
