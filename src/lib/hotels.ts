// 住宿紀錄（/hotels 頁）。來源：使用者 2026-11-09 提供的 Google 地圖「已儲存 → 飯店」清單（Takeout 匯出），
// 使用者確認 78 間「全部都住過」。
//
// ⚠️ 隱私：跟 /flights 同一條規則——只留飯店名稱跟城市，不放日期、房型、價格、訂房資料。
// 城市是依飯店名稱判斷，再用 Google 地圖連結裡的 S2 cell（座標精度約幾公里）交叉確認；
// 地圖只標城市，不標飯店的實際位置（使用者選的）。
// 集團只分得出來的國際集團＋承億；不確定的一律歸「其他」，不要猜。
// 會籍：只寫計畫名稱＋等級（使用者選的），會員編號一律不放（hotels.test.ts 會擋長串數字）。

export type Group = "IHG" | "Marriott" | "Hilton" | "Accor" | "Four Seasons" | "承億" | "其他";

export interface City {
  name: string;
  country: string;
  lat: number; // 城市中心的公開座標，只用來畫地圖
  lon: number;
}

export const CITIES: Record<string, City> = {
  // 台灣
  taipei: { name: "台北", country: "台灣", lat: 25.04, lon: 121.56 },
  newtaipei: { name: "新北", country: "台灣", lat: 25.06, lon: 121.47 },
  taoyuan: { name: "桃園", country: "台灣", lat: 25.03, lon: 121.24 },
  taichung: { name: "台中", country: "台灣", lat: 24.15, lon: 120.67 },
  nantou: { name: "南投", country: "台灣", lat: 23.9, lon: 120.95 },
  chiayi: { name: "嘉義", country: "台灣", lat: 23.48, lon: 120.45 },
  alishan: { name: "阿里山", country: "台灣", lat: 23.51, lon: 120.8 },
  tainan: { name: "台南", country: "台灣", lat: 22.99, lon: 120.2 },
  kaohsiung: { name: "高雄", country: "台灣", lat: 22.62, lon: 120.3 },
  kenting: { name: "墾丁", country: "台灣", lat: 21.95, lon: 120.8 },
  taitung: { name: "台東", country: "台灣", lat: 22.76, lon: 121.14 },
  hualien: { name: "花蓮", country: "台灣", lat: 23.98, lon: 121.6 },
  penghu: { name: "澎湖", country: "台灣", lat: 23.57, lon: 119.58 },
  kinmen: { name: "金門", country: "台灣", lat: 24.44, lon: 118.37 },
  // 日本
  tokyo: { name: "東京", country: "日本", lat: 35.68, lon: 139.76 },
  yokohama: { name: "橫濱", country: "日本", lat: 35.45, lon: 139.64 },
  narita: { name: "成田", country: "日本", lat: 35.78, lon: 140.32 },
  osaka: { name: "大阪", country: "日本", lat: 34.69, lon: 135.5 },
  kyoto: { name: "京都", country: "日本", lat: 35.01, lon: 135.77 },
  nagoya: { name: "名古屋", country: "日本", lat: 35.17, lon: 136.88 },
  fukuoka: { name: "福岡", country: "日本", lat: 33.59, lon: 130.4 },
  sapporo: { name: "札幌", country: "日本", lat: 43.06, lon: 141.35 },
  akita: { name: "秋田", country: "日本", lat: 39.72, lon: 140.1 },
  naha: { name: "那霸", country: "日本", lat: 26.21, lon: 127.68 },
  // 其他
  seoul: { name: "首爾", country: "韓國", lat: 37.55, lon: 126.98 },
  hongkong: { name: "香港", country: "香港", lat: 22.3, lon: 114.17 },
  hanoi: { name: "河內", country: "越南", lat: 21.03, lon: 105.85 },
  bangkok: { name: "曼谷", country: "泰國", lat: 13.75, lon: 100.5 },
  houston: { name: "休士頓", country: "美國", lat: 29.76, lon: -95.37 },
};

// [名稱, 城市, 集團]。名稱照使用者清單，只去掉 Google 地圖上的 SEO 長尾跟重複的英文；順序就是原清單的順序
export const HOTELS: [name: string, city: keyof typeof CITIES, group: Group][] = [
  ["OWL Hostel 貓頭鷹旅店", "nantou", "其他"],
  ["承億文旅 桃城茶樣子", "chiayi", "承億"],
  ["禧榕軒大飯店", "tainan", "其他"],
  ["Sheraton Taitung Hotel", "taitung", "Marriott"],
  ["首爾江南沃科酒店", "seoul", "IHG"],
  ["THE 皇家花園酒店 ICONIC 那霸", "naha", "其他"],
  ["華泰瑞苑", "kenting", "其他"],
  ["煙波花蓮太魯閣 山闊館", "hualien", "其他"],
  ["首爾車站福朋喜來登朝鮮酒店", "seoul", "Marriott"],
  ["首爾四季酒店", "seoul", "Four Seasons"],
  ["橫濱 Pier8 洲際酒店", "yokohama", "IHG"],
  ["東京澀谷英迪格酒店", "tokyo", "IHG"],
  ["名古屋車站福朋喜來登快捷酒店", "nagoya", "Marriott"],
  ["河內地標 72 洲際酒店", "hanoi", "IHG"],
  ["Sofitel Legend Metropole Hanoi", "hanoi", "Accor"],
  ["河內西湖洲際飯店", "hanoi", "IHG"],
  ["台南晶英酒店", "tainan", "其他"],
  ["洲至奢選大阪麗嘉皇家酒店", "osaka", "IHG"],
  ["大阪梅田希爾頓嘉悅里酒店", "osaka", "Hilton"],
  ["臺中勤美洲際酒店", "taichung", "IHG"],
  ["札幌洲際酒店", "sapporo", "IHG"],
  ["福岡海鷹希爾頓飯店", "fukuoka", "Hilton"],
  ["Kimpton Tsim Sha Tsui Hong Kong", "hongkong", "IHG"],
  ["香港麗思卡爾頓酒店", "hongkong", "Marriott"],
  ["大阪市中心御堂筋智選假日酒店", "osaka", "IHG"],
  ["台北 W 飯店", "taipei", "Marriott"],
  ["和逸飯店‧台南西門館", "tainan", "其他"],
  ["阿里山英迪格酒店", "alishan", "IHG"],
  ["承億酒店", "kaohsiung", "承億"],
  ["歐特文旅", "kinmen", "其他"],
  ["福岡全日空皇冠假日酒店", "fukuoka", "IHG"],
  ["汐止福泰大飯店", "newtaipei", "其他"],
  ["台南大員皇冠假日酒店", "tainan", "IHG"],
  ["Vignette Collection Sindhorn Midtown Hotel Bangkok", "bangkok", "IHG"],
  ["曼谷素坤逸假日酒店", "bangkok", "IHG"],
  ["曼谷是樂園皇冠假日酒店", "bangkok", "IHG"],
  ["曼谷素坤逸洲際酒店", "bangkok", "IHG"],
  ["京都全日空皇冠假日酒店", "kyoto", "IHG"],
  ["大阪中央沃科酒店", "osaka", "IHG"],
  ["高雄洲際酒店", "kaohsiung", "IHG"],
  ["嘉義福容 voco 酒店", "chiayi", "IHG"],
  ["臺中逢甲智選假日酒店", "taichung", "IHG"],
  ["臺北車站智選假日酒店", "taipei", "IHG"],
  ["東京詩穎洲際酒店", "tokyo", "IHG"],
  ["嘉義智選假日酒店", "chiayi", "IHG"],
  ["高雄愛河智選假日酒店", "kaohsiung", "IHG"],
  ["Hotel Indigo Kaohsiung Central Park", "kaohsiung", "IHG"],
  ["Holiday Inn Express Taichung Park", "taichung", "IHG"],
  ["橫濱洲際渡假飯店", "yokohama", "IHG"],
  ["京都五條假日酒店", "kyoto", "IHG"],
  ["大阪本町御堂筋加納酒店", "osaka", "其他"],
  ["Club Quarters Hotel Houston", "houston", "其他"],
  ["旅居文旅 高雄一心館", "kaohsiung", "其他"],
  ["東橫 INN 大阪阪急十三站西口 1 號店", "osaka", "其他"],
  ["町．草休行館 CHO Stay（桃園機場膠囊旅館）", "taoyuan", "其他"],
  ["Garner Hotel 大阪本町駅", "osaka", "IHG"],
  ["成田全日空皇冠假日酒店", "narita", "IHG"],
  ["東京神田相鐵 FRESA INN", "tokyo", "其他"],
  ["秋田全日空皇冠假日酒店", "akita", "IHG"],
  ["承億文旅 墾丁雅客小半島", "kenting", "承億"],
  ["桃園智選假日飯店", "taoyuan", "IHG"],
  ["台北諾富特華航桃園機場飯店", "taoyuan", "Accor"],
  ["Hotel dùa", "kaohsiung", "其他"],
  ["雀客旅館 新北蘆洲", "newtaipei", "其他"],
  ["趣淘漫旅 台東", "taitung", "其他"],
  ["三好行旅 台中", "taichung", "其他"],
  ["承億文旅 花蓮山知道", "hualien", "承億"],
  ["台北六福萬怡酒店", "taipei", "Marriott"],
  ["桃禧航空城酒店 新館", "taoyuan", "其他"],
  ["沐品居太空旅棧", "taichung", "其他"],
  ["澎湖福朋喜來登酒店", "penghu", "Marriott"],
  ["東門 3 號膠囊旅店", "taipei", "其他"],
  ["承億文旅 淡水吹風", "newtaipei", "承億"],
  ["Moxy Taichung", "taichung", "Marriott"],
  ["璞邸城市膠囊旅店 台北車站總店", "taipei", "其他"],
  ["天閣酒店 台北劍潭館", "taipei", "其他"],
  ["台北橋黑熊好眠站膠囊旅館", "taipei", "其他"],
  ["台北大直英迪格酒店", "taipei", "IHG"],
];

export const GROUP_NAMES: Record<Group, string> = {
  IHG: "IHG 洲際酒店集團",
  Marriott: "萬豪 Marriott",
  Hilton: "希爾頓 Hilton",
  Accor: "雅高 Accor",
  "Four Seasons": "四季 Four Seasons",
  承億: "承億文旅",
  其他: "其他／獨立飯店",
};

// 會籍：使用者 2026-11-09 提供，只寫計畫名稱＋等級（使用者：「權益不用寫、寫等級就好」），名稱照官方寫法校過。會員編號一律不放。
// 有效期的（GHA 鈦金到 2026 年底、IHG 年度酒廊到 2027、華航金卡到 2028）reminders.json 有到期提醒，到時候問使用者等級有沒有變。
export type MembershipKind = "飯店" | "航空" | "機場貴賓室" | "郵輪" | "租車";
export interface Membership {
  program: string;
  tier?: string;
  kind: MembershipKind;
}
export const MEMBERSHIP_KINDS: MembershipKind[] = ["飯店", "航空", "機場貴賓室", "郵輪", "租車"];
export const MEMBERSHIPS: Membership[] = [
  { kind: "飯店", program: "IHG One Rewards", tier: "鑽石 Diamond" },
  { kind: "飯店", program: "InterContinental Ambassador", tier: "洲際大使" },
  { kind: "飯店", program: "GHA DISCOVERY", tier: "鈦金 Titanium" },
  { kind: "飯店", program: "Hilton Honors", tier: "金卡 Gold" },
  { kind: "飯店", program: "Marriott Bonvoy", tier: "金卡 Gold Elite" },
  { kind: "飯店", program: "Best Western Rewards", tier: "鑽石精選 Diamond Select" },
  { kind: "飯店", program: "Radisson Rewards 麗賞會", tier: "尊榮 Premium" }, // 美國運通簽帳白金卡（台灣）附贈的等級
  { kind: "航空", program: "中華航空 華夏會員", tier: "金卡（天合聯盟 Elite Plus）" },
  { kind: "機場貴賓室", program: "Priority Pass 新貴通", tier: "Prestige 無限次" },
  { kind: "機場貴賓室", program: "American Express The Centurion Lounge 百夫長貴賓室" },
  { kind: "郵輪", program: "MSC Voyagers Club 地中海郵輪", tier: "金卡 Gold" },
  { kind: "租車", program: "Avis Preferred", tier: "總裁級 President's Club" },
  { kind: "租車", program: "Hertz Gold Plus Rewards", tier: "金卡" },
];

export function membershipsByKind(): [MembershipKind, Membership[]][] {
  return MEMBERSHIP_KINDS.map((k) => [k, MEMBERSHIPS.filter((m) => m.kind === k)] as [MembershipKind, Membership[]]).filter(([, ms]) => ms.length > 0);
}

const COUNTRY_ORDER = ["台灣", "日本", "韓國", "香港", "越南", "泰國", "美國"];

/** 國家 → 城市 → 飯店，國家照固定順序、城市照間數多到少 */
export function hotelsByPlace(): [country: string, cities: [city: string, hotels: string[]][]][] {
  const byCity = new Map<string, string[]>();
  for (const [name, city] of HOTELS) byCity.set(city, [...(byCity.get(city) ?? []), name]);
  const countries = new Map<string, [string, string[]][]>();
  for (const [key, names] of byCity) {
    const c = CITIES[key];
    countries.set(c.country, [...(countries.get(c.country) ?? []), [c.name, names]]);
  }
  return [...countries.entries()]
    .sort((a, b) => COUNTRY_ORDER.indexOf(a[0]) - COUNTRY_ORDER.indexOf(b[0]))
    .map(([country, cities]) => [country, cities.sort((a, b) => b[1].length - a[1].length)]);
}

/** 每個城市住過幾間（地圖用） */
export function hotelCountByCity(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const [, city] of HOTELS) counts[city] = (counts[city] ?? 0) + 1;
  return counts;
}

export function hotelStats() {
  const groups = new Map<Group, number>();
  for (const [, , g] of HOTELS) groups.set(g, (groups.get(g) ?? 0) + 1);
  const cities = new Set(HOTELS.map(([, c]) => c));
  return {
    hotels: HOTELS.length,
    cities: cities.size,
    countries: new Set([...cities].map((c) => CITIES[c].country)).size,
    // 「其他」固定排最後，其餘依間數
    groups: [...groups.entries()].sort((a, b) =>
      a[0] === "其他" ? 1 : b[0] === "其他" ? -1 : b[1] - a[1],
    ) as [Group, number][],
  };
}
