// 機體図鑑的「全部格子」（2026-11-25）：在台灣南部天空比較可能收到的機型。收到過的點亮，沒收到的是灰色剪影。
// 收到了但不在這份清單裡的，頁面最後另外列（只有代碼）。軍機不列（跟 /radar 的「現在收到的航班」同一條規則，見 scripts/lib/radar.js flightsNow）。
// kind 決定剪影：narrow 窄體雙發、wide 廣體雙發、jumbo 四發、prop 螺旋槳、biz 商務機、heli 直升機

export type DexKind = "narrow" | "wide" | "jumbo" | "prop" | "biz" | "heli";
export interface DexEntry {
  code: string; // ICAO 機型代碼
  name: string;
  kind: DexKind;
  /** 少見（四發、特殊機）：收到時特別標「珍しい」 */
  rare?: boolean;
}

export const DEX_GROUPS: { title: string; en: string; entries: DexEntry[] }[] = [
  {
    title: "空中巴士 窄體",
    en: "Airbus narrowbody",
    entries: [
      { code: "A319", name: "Airbus A319", kind: "narrow" },
      { code: "A320", name: "Airbus A320", kind: "narrow" },
      { code: "A20N", name: "Airbus A320neo", kind: "narrow" },
      { code: "A321", name: "Airbus A321", kind: "narrow" },
      { code: "A21N", name: "Airbus A321neo", kind: "narrow" },
    ],
  },
  {
    title: "空中巴士 廣體",
    en: "Airbus widebody",
    entries: [
      { code: "A332", name: "Airbus A330-200", kind: "wide" },
      { code: "A333", name: "Airbus A330-300", kind: "wide" },
      { code: "A339", name: "Airbus A330-900neo", kind: "wide" },
      { code: "A359", name: "Airbus A350-900", kind: "wide" },
      { code: "A35K", name: "Airbus A350-1000", kind: "wide" },
      { code: "A388", name: "Airbus A380", kind: "jumbo", rare: true },
    ],
  },
  {
    title: "波音 窄體",
    en: "Boeing narrowbody",
    entries: [
      { code: "B737", name: "Boeing 737-700", kind: "narrow" },
      { code: "B738", name: "Boeing 737-800", kind: "narrow" },
      { code: "B739", name: "Boeing 737-900", kind: "narrow" },
      { code: "B38M", name: "Boeing 737 MAX 8", kind: "narrow" },
      { code: "B39M", name: "Boeing 737 MAX 9", kind: "narrow" },
      { code: "B752", name: "Boeing 757-200", kind: "narrow", rare: true },
    ],
  },
  {
    title: "波音 廣體",
    en: "Boeing widebody",
    entries: [
      { code: "B763", name: "Boeing 767-300", kind: "wide" },
      { code: "B772", name: "Boeing 777-200", kind: "wide" },
      { code: "B77L", name: "Boeing 777-200LR／777F", kind: "wide" },
      { code: "B773", name: "Boeing 777-300", kind: "wide" },
      { code: "B77W", name: "Boeing 777-300ER", kind: "wide" },
      { code: "B788", name: "Boeing 787-8", kind: "wide" },
      { code: "B789", name: "Boeing 787-9", kind: "wide" },
      { code: "B78X", name: "Boeing 787-10", kind: "wide" },
      { code: "B744", name: "Boeing 747-400", kind: "jumbo", rare: true },
      { code: "B748", name: "Boeing 747-8", kind: "jumbo", rare: true },
    ],
  },
  {
    title: "螺旋槳、區域線",
    en: "Regional",
    entries: [
      { code: "AT75", name: "ATR 72-500", kind: "prop" },
      { code: "AT76", name: "ATR 72-600", kind: "prop" },
      { code: "DH8D", name: "Dash 8-400", kind: "prop" },
      { code: "DHC6", name: "DHC-6 Twin Otter", kind: "prop" },
      { code: "F50", name: "Fokker 50", kind: "prop", rare: true },
      { code: "E190", name: "Embraer E190", kind: "narrow" },
      { code: "E195", name: "Embraer E195", kind: "narrow" },
    ],
  },
  {
    title: "商務機、直升機",
    en: "Business & rotor",
    entries: [
      { code: "FA7X", name: "Dassault Falcon 7X", kind: "biz" },
      { code: "GLEX", name: "Bombardier Global Express", kind: "biz" },
      { code: "GLF6", name: "Gulfstream G650", kind: "biz" },
      { code: "A169", name: "Leonardo AW169", kind: "heli" },
    ],
  },
];

/** 軍機代碼：收到了也不列（見檔案開頭） */
export const DEX_HIDDEN = new Set(["P3", "C130", "C30J", "F16", "E2", "HAWK", "K35R"]);

export const DEX_CATALOG = new Map(DEX_GROUPS.flatMap((g) => g.entries.map((e) => [e.code, e] as const)));
