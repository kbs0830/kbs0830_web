import { describe, expect, it } from "vitest";
import { decodeMetar, METAR_EXAMPLE } from "./metar";

const text = (raw: string) => decodeMetar(raw).summary.join("\n");
const field = (raw: string, f: string) => decodeMetar(raw).tokens.filter((t) => t.field === f).map((t) => t.zh);

describe("decodeMetar（高雄機場的真實電報）", () => {
  const r = decodeMetar(METAR_EXAMPLE);
  it("機場、時間、類型", () => {
    expect(r.station).toBe("RCKH");
    expect(r.stationName).toContain("高雄");
    expect(r.time).toEqual({ day: 28, hour: 18, minute: 0 });
    expect(field(METAR_EXAMPLE, "觀測時間")[0]).toContain("29 日 02:00"); // 台灣時間隔天 02:00
  });
  it("風、風向擺動、能見度、雲、氣溫、氣壓、趨勢", () => {
    const s = text(METAR_EXAMPLE);
    expect(s).toContain("從西南偏南（200°）吹來，風速 4 節");
    expect(s).toContain("160° 到 280° 之間擺動");
    expect(s).toContain("能見度 10 公里以上");
    expect(s).toContain("少量雲");
    expect(s).toContain("雲底 2,000 呎");
    expect(s).toContain("裂雲");
    expect(s).toContain("氣溫 23°C，露點 15°C（相對濕度約 61%）");
    expect(s).toContain("QNH 1021 hPa");
    expect(s).toContain("NOSIG");
    expect(r.category).toBe("VFR");
    expect(r.unknown).toEqual([]);
  });
  it("RMK 之後的東西原樣當備註，不會被當成別的欄位", () => {
    expect(r.tokens.at(-1)?.raw).toBe("A3016");
    expect(r.tokens.at(-1)?.zh).toContain("30.16 inHg");
    expect(r.tokens.some((t) => t.raw === "RMK")).toBe(true);
  });
});

describe("decodeMetar：其他寫法", () => {
  it("TEMPO 的預報不會蓋掉現在的風", () => {
    const raw = "METAR RJFF 281830Z AUTO 30015KT 260V330 9999 FEW044 SCT049 BKN050 10/01 Q1021 TEMPO 30020G30KT";
    const s = text(raw);
    expect(s).toContain("風速 15 節");
    expect(s).not.toContain("陣風到 30 節");
    expect(s).toContain("自動站");
    expect(field(raw, "風（預報）")[0]).toContain("陣風到 30 節");
  });
  it("美式：英里、華氏之外的 inHg、陣風、零下", () => {
    const s = text("METAR KJFK 121651Z 31015G25KT 10SM FEW250 M05/M12 A3012");
    expect(s).toContain("西北（310°）");
    expect(s).toContain("陣風到 25 節");
    expect(s).toContain("10 英里");
    expect(s).toContain("氣溫 -5°C，露點 -12°C");
    expect(s).toContain("30.12 inHg");
  });
  it("天氣現象：小雨、雷雨、陣雨、霧、附近有陣雨", () => {
    expect(field("METAR RCTP 010000Z 05005KT 8000 -RA BKN010 20/19 Q1015", "天氣")[0]).toContain("小雨");
    expect(field("METAR RCTP 010000Z 05005KT 3000 +TSRA BKN010CB 20/19 Q1015", "天氣")[0]).toContain("大雷暴伴隨雨");
    expect(field("METAR RCTP 010000Z 05005KT 4000 SHRA BKN020 20/19 Q1015", "天氣")[0]).toContain("陣性雨");
    expect(field("METAR RCTP 010000Z 00000KT 0400 FG VV001 12/12 Q1015", "天氣")[0]).toContain("霧");
    expect(field("METAR RCTP 010000Z 05005KT 9999 VCSH FEW020 20/19 Q1015", "天氣")[0]).toContain("附近有陣性降水");
  });
  it("雲：積雨雲、垂直能見度、CAVOK、靜風", () => {
    expect(field("METAR RCTP 010000Z 05005KT 3000 TSRA BKN010CB 20/19 Q1015", "雲")[0]).toContain("積雨雲");
    expect(text("METAR RCTP 010000Z 00000KT 0400 FG VV001 12/12 Q1015")).toContain("垂直能見度 100 呎");
    const c = decodeMetar("METAR RCKH 010000Z 00000KT CAVOK 25/20 Q1012");
    expect(c.summary.join("\n")).toContain("無風");
    expect(c.summary.join("\n")).toContain("CAVOK");
    expect(c.category).toBe("VFR");
  });
  it("飛航天氣分類：用能見度與雲幕取比較差的那個", () => {
    expect(decodeMetar("METAR RCTP 010000Z 05005KT 9999 BKN008 20/19 Q1015").category).toBe("IFR"); // 雲幕 800 呎
    expect(decodeMetar("METAR RCTP 010000Z 05005KT 6000 BKN020 20/19 Q1015").category).toBe("MVFR"); // 能見度 6 公里
    expect(decodeMetar("METAR RCTP 010000Z 05005KT 1200 OVC003 20/19 Q1015").category).toBe("LIFR");
    expect(decodeMetar("METAR RCTP 010000Z 05005KT 9999 FEW030 20/19 Q1015").category).toBe("VFR");
  });
  it("跑道視程、空白與等號、小寫不影響", () => {
    expect(field("METAR RJTT 010000Z 02005KT 0800 R34L/1200V1800U FG VV002 12/12 Q1015", "跑道視程")[0]).toContain("34L");
    expect(decodeMetar("  METAR RCKH 281800Z 20004KT 9999 FEW020 23/15 Q1021=  \n").station).toBe("RCKH");
  });
  it("空白、看不懂的欄位", () => {
    expect(decodeMetar("   ").empty).toBe(true);
    const r = decodeMetar("METAR RCKH 281800Z 20004KT 9999 FEW020 23/15 Q1021 ABCDEF");
    expect(r.unknown).toEqual(["ABCDEF"]);
  });
});
