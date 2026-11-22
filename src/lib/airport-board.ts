import { cached, fetchJson } from "./live-cache";

// 機場即時時刻表 /airports（TODO D6，2026-11-22，使用者：「順便做一個即時時刻表（小港機場／福岡機場）」）。
// 伺服器 3 分鐘抓一次、記憶體快取（lib/live-cache.ts），訪客的瀏覽器不連機場網站。
//   - 小港 KHH：高雄國際航空站的政府開放資料（data.gov.tw 33655／33656，國內線同一個路徑換檔名），JSON、不用金鑰
//     國際／國內 × 出發／抵達 四個檔案；不會把聯營航班重複列
//   - 福岡 FUK：福岡空港官網自己的航班頁讀的 JSON（/api/flight_schedule/flight_schedule.json，今天全部航班，約 700 KB）。
//     不是正式的開放資料，官網改版就會壞 → 抓不到時那一塊不顯示。聯營（コードシェア便）另外列一行，這裡併進主航班
// 時間：小港是台灣時間、福岡是日本時間，各自顯示當地時間。

export interface Flight {
  code: string; // 主航班代碼（CI110）
  codeshares: string[];
  airline: string;
  place: string; // 對方機場（中文；福岡國內線是日文漢字）
  placeCode: string;
  dir: "dep" | "arr";
  intl: boolean;
  sched: string; // HH:MM 當地時間
  changed: string | null; // 跟表定不同的時間（預計／實際），一樣就是 null
  status: string; // 中文狀態
  kind: "done" | "active" | "delayed" | "cancelled" | "scheduled";
  gate: string | null;
  aircraft: string | null; // 只有小港的資料有
  note: string | null; // 延誤原因之類
}

export interface Board {
  airport: "KHH" | "FUK";
  flights: Flight[];
}

const hhmm = (s: string | null | undefined): string | null => {
  if (!s) return null;
  const m = s.match(/(\d{2}):?(\d{2})$/);
  return m ? `${m[1]}:${m[2]}` : null;
};

// ── 小港 ────────────────────────────────────────────────────────────
type KhhRow = {
  expectTime: string;
  realTime: string;
  airLineName: string;
  airLineNum: string;
  goalAirportCode?: string;
  goalAirportName?: string;
  upAirportCode?: string;
  upAirportName?: string;
  airPlaneType?: string;
  airBoardingGate?: string;
  airFlyStatus: string;
  airFlyDelayCause?: string;
};

const KHH_STATUS: Record<string, [string, Flight["kind"]]> = {
  離站: ["已起飛", "done"],
  抵達: ["已抵達", "done"],
  登機: ["登機中", "active"],
  準時: ["準時", "scheduled"],
  延遲: ["延誤", "delayed"],
  延誤: ["延誤", "delayed"],
  取消: ["取消", "cancelled"],
};

export function parseKhh(rows: KhhRow[], dir: Flight["dir"], intl: boolean): Flight[] {
  return rows.map((r) => {
    const sched = hhmm(r.expectTime) ?? "--:--";
    const real = hhmm(r.realTime);
    const [status, kind] = KHH_STATUS[r.airFlyStatus] ?? [r.airFlyStatus || "–", "scheduled"];
    return {
      code: r.airLineNum.trim(),
      codeshares: [],
      airline: r.airLineName,
      place: (dir === "dep" ? r.goalAirportName : r.upAirportName) ?? "",
      placeCode: (dir === "dep" ? r.goalAirportCode : r.upAirportCode) ?? "",
      dir,
      intl,
      sched,
      changed: real && real !== sched ? real : null,
      status,
      kind,
      gate: r.airBoardingGate?.trim() || null,
      aircraft: r.airPlaneType?.trim() || null,
      note: r.airFlyDelayCause?.trim() || null,
    };
  });
}

// ── 福岡 ────────────────────────────────────────────────────────────
type FukRow = {
  deparv_div: "A" | "D";
  intdom_div: "I" | "D";
  airline_2cd: string;
  flt_num_no: string;
  flt_sfx?: string;
  appointed_time: string;
  estimated_ymdhm?: string;
  true_ymdhm?: string;
  airline_name?: string;
  airline_name2?: string;
  tofrom_cd: string;
  tofrom_name: string;
  spot_num?: string;
  remarks?: string;
  remarks2?: string;
  share_airlines?: { airline_2cd: string; flt_num_no: string; flt_sfx?: string }[] | null;
};

// 福岡國際線的城市官網只有日文（片假名），換成中文；國內線是漢字，直接用
const FUK_PLACES: Record<string, string> = {
  ICN: "首爾/仁川", GMP: "首爾/金浦", PUS: "釜山", TAE: "大邱", CJJ: "清州", CJU: "濟州",
  TPE: "台北/桃園", KHH: "高雄", HKG: "香港", PVG: "上海/浦東", PEK: "北京/首都",
  MNL: "馬尼拉", BKK: "曼谷/素萬那普", DMK: "曼谷/廊曼", SGN: "胡志明市", HAN: "河內",
  KUL: "吉隆坡", BKI: "亞庇", SIN: "新加坡", HND: "東京/羽田", NRT: "東京/成田", ITM: "大阪/伊丹", KIX: "大阪/關西",
};

// 用英文那欄判斷（日文那欄有「早着予定」這種比較難對應的）
const FUK_STATUS: Record<string, [string, Flight["kind"]]> = {
  Arrived: ["已抵達", "done"],
  "Baggage Available": ["行李提領中", "done"],
  Departed: ["已起飛", "done"],
  Delayed: ["延誤", "delayed"],
  "Late Aircraft Arrival": ["來機晚到", "delayed"],
  Cancelled: ["取消", "cancelled"],
  "Arrive Soon": ["即將抵達", "active"],
  Arriving: ["抵達中", "active"],
  "Check in Close": ["報到結束", "active"],
  "Now Boarding": ["登機中", "active"],
  "Final Call": ["最後登機", "active"],
  "Gate Closed": ["登機結束", "active"],
  "Go To Gate": ["請往登機門", "active"],
  "Check in": ["報到中", "active"],
  "On Time": ["準時", "scheduled"],
  "New Time": ["時間變更", "scheduled"],
};

const fukCode = (cd: string, no: string, sfx = "") => `${cd}${String(Number(no))}${sfx}`;

export function parseFuk(raw: Record<string, FukRow>): Flight[] {
  return Object.values(raw)
    .filter((r) => r && r.remarks2 !== "Code Share") // 聯營的那一行：主航班的 share_airlines 已經有
    .map((r) => {
      const sched = hhmm(r.appointed_time) ?? "--:--";
      const t = hhmm(r.true_ymdhm) ?? hhmm(r.estimated_ymdhm);
      const [status, kind] = FUK_STATUS[r.remarks2 ?? ""] ?? [r.remarks || "–", "scheduled"];
      return {
        code: fukCode(r.airline_2cd, r.flt_num_no, r.flt_sfx),
        codeshares: (r.share_airlines ?? []).map((s) => fukCode(s.airline_2cd, s.flt_num_no, s.flt_sfx)),
        airline: r.airline_name2 || r.airline_name || r.airline_2cd,
        place: FUK_PLACES[r.tofrom_cd] ?? r.tofrom_name,
        placeCode: r.tofrom_cd,
        dir: r.deparv_div === "D" ? "dep" : "arr",
        intl: r.intdom_div === "I",
        sched,
        changed: t && t !== sched ? t : null,
        status,
        kind,
        gate: r.spot_num?.trim() || null,
        aircraft: null,
        note: null,
      } satisfies Flight;
    });
}

// ── 顯示用 ──────────────────────────────────────────────────────────
const minutes = (hm: string) => Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3, 5));

/** 依表定時間排；「接下來」＝還沒結束的，加上 30 分鐘內剛起飛／抵達／取消的（取消的也會過去，不然早上取消的班機整天卡在最上面）。nowHm：當地時間 HH:MM */
export function upcoming(flights: Flight[], nowHm: string, limit = 30): Flight[] {
  const now = minutes(nowHm);
  return flights
    .filter((f) => (f.kind !== "done" && f.kind !== "cancelled") || minutes(f.changed ?? f.sched) >= now - 30)
    .sort((a, b) => minutes(a.sched) - minutes(b.sched) || a.code.localeCompare(b.code))
    .slice(0, limit);
}

/** 高雄 ⇄ 福岡：小港出發往 FUK、福岡出發往 KHH（今天的全部，含已經飛走的） */
export function khhFuk(khh: Flight[] | null, fuk: Flight[] | null) {
  const sort = (xs: Flight[]) => xs.sort((a, b) => minutes(a.sched) - minutes(b.sched));
  return {
    toFuk: sort((khh ?? []).filter((f) => f.dir === "dep" && f.placeCode === "FUK")),
    toKhh: sort((fuk ?? []).filter((f) => f.dir === "dep" && f.placeCode === "KHH")),
  };
}

const KHH_BASE = "https://www.kia.gov.tw/Announce/NewsArea/InstantSchedule_";

export async function getBoards() {
  const [khh, fuk] = await Promise.all([
    cached(
      "board:khh",
      3 * 60_000,
      async () => {
        const files = [["INTDEP", "dep", true], ["INTARR", "arr", true], ["DOMDEP", "dep", false], ["DOMARR", "arr", false]] as const;
        const parts = await Promise.all(files.map(async ([f, dir, intl]) => parseKhh(await fetchJson<KhhRow[]>(`${KHH_BASE}${f}.json`), dir, intl)));
        const all = parts.flat();
        if (!all.length) throw new Error("小港沒有任何航班");
        return all;
      },
      { failRetryMs: 2 * 60_000 },
    ),
    cached(
      "board:fuk",
      3 * 60_000,
      async () => {
        const all = parseFuk(await fetchJson<Record<string, FukRow>>("https://www.fukuoka-airport.jp/api/flight_schedule/flight_schedule.json", 15_000));
        if (!all.length) throw new Error("福岡沒有任何航班");
        return all;
      },
      { failRetryMs: 2 * 60_000 },
    ),
  ]);
  return { khh, fuk };
}
