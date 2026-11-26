import { describe, expect, it } from "vitest";
import { applyHealth, decodeThrottled, nextState, parseHealth } from "./radar-health.js";

// 2026-11-26 換完電源後實際讀到的輸出
const SAMPLE = `up=186
thr=0x0
temp=68.8
disk=23
mount=rw
ioerr=0
fs=clean
writes=41 GB
mem=758
wifi=-71
sd=SB16G
sddate=10/2025
feed=active
`;

describe("decodeThrottled", () => {
  it("0x50005＝現在欠壓＋降頻、開機後也發生過（11/23 斷線那次）", () => {
    const t = decodeThrottled("0x50005")!;
    expect(t.now).toEqual({ undervoltage: true, capped: false, throttled: true, softTemp: false });
    expect(t.since).toEqual({ undervoltage: true, capped: false, throttled: true, softTemp: false });
  });
  it("0x50000＝現在沒事、但開機後曾經欠壓", () => {
    const t = decodeThrottled("0x50000")!;
    expect(t.now.undervoltage).toBe(false);
    expect(t.since.undervoltage).toBe(true);
  });
  it("不是十六進位就回 null", () => {
    expect(decodeThrottled("")).toBeNull();
    expect(decodeThrottled(undefined as unknown as string)).toBeNull();
  });
});

describe("parseHealth", () => {
  it("把 key=value 轉成數字與旗標", () => {
    const h = parseHealth(SAMPLE);
    expect(h).toMatchObject({
      uptimeS: 186, tempC: 68.8, diskPct: 23, readOnly: false, ioErrors: 0, fsState: "clean",
      lifetimeWrites: "41 GB", memAvailMB: 758, wifiDbm: -71, sd: { name: "SB16G", date: "10/2025" }, feedActive: true,
    });
    expect(h.throttled?.raw).toBe("0x0");
  });
  it("缺欄位的變 null（例如 sudo 不能用時沒有 fs）", () => {
    const h = parseHealth("up=10\r\nthr=0x0\r\nfs=\r\n");
    expect(h.uptimeS).toBe(10);
    expect(h.fsState).toBeNull();
    expect(h.tempC).toBeNull();
    expect(h.sd).toBeNull();
  });
});

describe("applyHealth", () => {
  const ok = (c: number) => ({ ok: true, health: { ...parseHealth(SAMPLE), tempC: c } });
  it("記 24 小時最高溫，超過 24 小時的丟掉", () => {
    const t0 = Date.UTC(2026, 10, 26);
    let s = applyHealth(null, ok(75), t0);
    s = applyHealth(s, ok(60), t0 + 3600_000);
    expect(s.maxTemp24h).toBe(75);
    s = applyHealth(s, ok(61), t0 + 25 * 3600_000);
    expect(s.maxTemp24h).toBe(61);
  });
  it("讀不到時保留上一次的數字跟最後成功時間，但 ok=false", () => {
    const t0 = Date.UTC(2026, 10, 26);
    const prev = applyHealth(null, ok(66), t0);
    const s = applyHealth(prev, { ok: false, error: "SSH 連不上" }, t0 + 300_000);
    expect(s.ok).toBe(false);
    expect(s.error).toBe("SSH 連不上");
    expect(s.lastOkAt).toBe(t0);
    expect(s.health?.tempC).toBe(66);
  });
});

describe("problems（watchdog 寄信用）", () => {
  const t0 = Date.UTC(2026, 10, 26);
  const state = (txt: string) => nextState(null, { ok: true, health: parseHealth(txt) }, t0, true);
  const active = (s: ReturnType<typeof nextState>) => s.problems.filter((p) => p.active).map((p) => p.key);

  it("正常的樣本沒有問題", () => {
    expect(active(state(SAMPLE))).toEqual([]);
  });
  it("75°C 以上寄、降到 70–75 之間還不算恢復、70 以下才恢復（遲滯）", () => {
    const hot = nextState(null, { ok: true, health: { ...parseHealth(SAMPLE), tempC: 76 } }, t0, true);
    expect(active(hot)).toEqual(["pi-hot"]);
    const warm = nextState(hot, { ok: true, health: { ...parseHealth(SAMPLE), tempC: 72 } }, t0 + 300_000, true);
    expect(active(warm)).toEqual(["pi-hot"]);
    const cool = nextState(warm, { ok: true, health: { ...parseHealth(SAMPLE), tempC: 69 } }, t0 + 600_000, true);
    expect(active(cool)).toEqual([]);
    // 沒寄過的話 72 不會觸發
    expect(active(nextState(null, { ok: true, health: { ...parseHealth(SAMPLE), tempC: 72 } }, t0, true))).toEqual([]);
  });
  it("欠壓（現在或開機後曾經）、記憶卡錯誤、空間、記憶體", () => {
    expect(active(state(SAMPLE.replace("thr=0x0", "thr=0x50000")))).toEqual(["pi-power"]);
    expect(active(state(SAMPLE.replace("ioerr=0", "ioerr=3")))).toEqual(["pi-sd"]);
    expect(active(state(SAMPLE.replace("mount=rw", "mount=ro")))).toEqual(["pi-sd"]);
    expect(active(state(SAMPLE.replace("disk=23", "disk=93")))).toEqual(["pi-disk"]);
    expect(active(state(SAMPLE.replace("mem=758", "mem=50")))).toEqual(["pi-mem"]);
  });
  it("SSH 一小時連不上才寄；雷達本身也讀不到時不寄（雷達離線信已經會寄）", () => {
    const ok = state(SAMPLE);
    const fail = (dt: number, reach: boolean) => nextState(ok, { ok: false, error: "SSH 連不上" }, t0 + dt, reach);
    expect(active(fail(30 * 60_000, true))).toEqual([]);
    expect(active(fail(61 * 60_000, true))).toEqual(["pi-ssh"]);
    expect(active(fail(61 * 60_000, false))).toEqual([]);
  });
});
