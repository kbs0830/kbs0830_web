import { describe, expect, it } from "vitest";
import { khhFuk, parseFuk, parseKhh, upcoming, type Flight } from "@/lib/travel/airport-board";

// 2026-11-22 從小港開放資料、福岡空港官網實際抓到的格式（挑幾筆、欄位截短）
const KHH_DEP = [
  { expectTime: "15:30", realTime: "15:38", airLineName: "長榮航空", airLineNum: "BR120", goalAirportCode: "FUK", goalAirportName: "福岡", airPlaneType: "A321", airBoardingGate: "25", airFlyStatus: "離站", airFlyDelayCause: "" },
  { expectTime: "18:10", realTime: "18:10", airLineName: "台灣虎航", airLineNum: "IT284", goalAirportCode: "KIX", goalAirportName: "大阪/關西", airPlaneType: "A20N", airBoardingGate: "23", airFlyStatus: "準時", airFlyDelayCause: "" },
];
const KHH_DOM_ARR = [
  { expectTime: "17:50", realTime: "18:20", airLineName: "立榮航空", airLineNum: "B7 9012", upAirportCode: "KNH", upAirportName: "金門", airPlaneType: "AT76", airBoardingGate: "", airFlyStatus: "延遲", airFlyDelayCause: "來機晚到" },
];

const FUK = {
  "FIS-A-CAL-0110": {
    deparv_div: "A", intdom_div: "I", airline_2cd: "CI", flt_num_no: "0110", flt_sfx: "", appointed_time: "1000",
    estimated_ymdhm: "202611220956", true_ymdhm: "202611221002", airline_name: "チャイナエアライン", airline_name2: "China Airlines",
    tofrom_cd: "TPE", tofrom_name: "台北/桃園", spot_num: "57", remarks: "到着済み", remarks2: "Arrived",
    share_airlines: [{ airline_2cd: "JL", flt_num_no: "5126", flt_sfx: "" }],
  },
  "FIS-A-JAL-5126": {
    deparv_div: "A", intdom_div: "I", airline_2cd: "JL", flt_num_no: "5126", appointed_time: "1000", tofrom_cd: "TPE", tofrom_name: "台北/桃園",
    remarks: "コードシェア便", remarks2: "Code Share",
  },
  "FIS-D-EVA-0119": {
    deparv_div: "D", intdom_div: "I", airline_2cd: "BR", flt_num_no: "0119", appointed_time: "1955", estimated_ymdhm: "", true_ymdhm: "",
    airline_name2: "EVA Air", tofrom_cd: "KHH", tofrom_name: "高雄", spot_num: "", remarks: "出国手続き中", remarks2: "Go To Gate", share_airlines: [],
  },
  "FIS-D-ANA-0262": {
    deparv_div: "D", intdom_div: "D", airline_2cd: "NH", flt_num_no: "0262", appointed_time: "2030", estimated_ymdhm: "202611222100",
    airline_name2: "ANA", tofrom_cd: "HND", tofrom_name: "東京", remarks: "おくれ", remarks2: "Delayed",
  },
  "FIS-A-AAR-0132": {
    deparv_div: "A", intdom_div: "I", airline_2cd: "OZ", flt_num_no: "0132", appointed_time: "0735", tofrom_cd: "ICN", tofrom_name: "ソウル/仁川",
    remarks: "欠航", remarks2: "Cancelled",
  },
} as const;

describe("parseKhh", () => {
  it("時間、狀態翻成中文、表定跟實際不同才記 changed", () => {
    const [br, it] = parseKhh(KHH_DEP, "dep", true);
    expect(br).toMatchObject({ code: "BR120", place: "福岡", placeCode: "FUK", sched: "15:30", changed: "15:38", status: "已起飛", kind: "done", aircraft: "A321", gate: "25" });
    expect(it).toMatchObject({ changed: null, status: "準時", kind: "scheduled" });
  });
  it("抵達用出發地、延誤原因、空的登機門是 null", () => {
    const [b7] = parseKhh(KHH_DOM_ARR, "arr", false);
    expect(b7).toMatchObject({ code: "B7 9012", place: "金門", intl: false, status: "延誤", kind: "delayed", note: "來機晚到", gate: null });
  });
});

describe("parseFuk", () => {
  const flights = parseFuk(FUK as never);
  const by = (code: string) => flights.find((f) => f.code === code)!;

  it("聯營那一行不另外列，併進主航班的 codeshares", () => {
    expect(flights.map((f) => f.code).sort()).toEqual(["BR119", "CI110", "NH262", "OZ132"]);
    expect(by("CI110")).toMatchObject({ codeshares: ["JL5126"], sched: "10:00", changed: "10:02", status: "已抵達", kind: "done", gate: "57", place: "台北/桃園" });
  });
  it("國際線片假名城市換中文、國內線照原本的漢字；沒有實際時間就用預計時間", () => {
    expect(by("OZ132")).toMatchObject({ place: "首爾/仁川", status: "取消", kind: "cancelled" });
    expect(by("NH262")).toMatchObject({ intl: false, place: "東京/羽田", changed: "21:00", kind: "delayed" });
    expect(by("BR119")).toMatchObject({ dir: "dep", placeCode: "KHH", changed: null, status: "請往登機門", kind: "active", gate: null });
  });
});

describe("upcoming／khhFuk", () => {
  const f = (code: string, sched: string, kind: Flight["kind"], changed: string | null = null): Flight => ({
    code, sched, kind, changed, codeshares: [], airline: "", place: "", placeCode: "FUK", dir: "dep", intl: true, status: "", gate: null, aircraft: null, note: null,
  });

  it("還沒結束的都列、已經結束（含取消）的只留 30 分鐘內的，依表定時間排", () => {
    const list = [f("A", "15:00", "done"), f("B", "17:40", "done", "17:45"), f("C", "16:00", "delayed"), f("D", "19:00", "scheduled"), f("E", "17:50", "cancelled"), f("F", "08:55", "cancelled")];
    expect(upcoming(list, "18:00").map((x) => x.code)).toEqual(["C", "B", "E", "D"]);
    expect(upcoming(list, "18:00", 2)).toHaveLength(2);
  });

  it("高雄 ⇄ 福岡：小港出發往 FUK、福岡出發往 KHH，含已經飛走的", () => {
    const khh = parseKhh(KHH_DEP, "dep", true);
    const fuk = parseFuk(FUK as never);
    const d = khhFuk(khh, fuk);
    expect(d.toFuk.map((x) => x.code)).toEqual(["BR120"]);
    expect(d.toKhh.map((x) => x.code)).toEqual(["BR119"]);
    expect(khhFuk(null, null)).toEqual({ toFuk: [], toKhh: [] });
  });
});
