import data from "@/lib/travel/climate-data.json";

// 福岡每月穿搭（TODO V2，2026-11-27）：/tools/fukuoka-weather/3 這類 12 頁。
// 數字全部來自 climate-data.json（scripts/gen-climate.mjs 從 Open-Meteo 歷史天氣 API 抓 2015～2024 十年算出來的，不手寫）。
// 穿著建議是照「平均最高溫、平均最低溫」分幾個區間給的一般建議，不是預報；梅雨、颱風的說明是九州的一般氣候常識。
// ⚠️ 這是 ERA5 再分析（約 25 公里格點）的平均，跟氣象站實測會差一兩度，頁面上要寫清楚資料來源，不寫成氣象局的官方統計。

export type Month = { high: number; low: number; rainyDays: number };

export const SOURCE = data.source;
export const YEAR_RANGE = data.years as [number, number];

const fukuoka = data.fukuoka as Month[];
const kaohsiung = data.kaohsiung as Month[];

export const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

/** 網址的月份（1～12，不能有前導 0 或其他字元）→ 數字；不合法回 null */
export function parseMonth(s: string): number | null {
  if (!/^(?:[1-9]|1[0-2])$/.test(s)) return null;
  return Number(s);
}

export type Outfit = { tier: string; summary: string; items: string[] };

/** 依平均最高溫分區間；平均最低溫很低（< 5°C）時一律當冬季重裝 */
export function outfitFor(high: number, low: number): Outfit {
  if (high < 12 || low < 5) {
    return {
      tier: "冬季重裝",
      summary: "很冷，要穿厚外套。",
      items: ["羽絨外套或厚大衣", "發熱衣加毛衣（洋蔥式穿法，室內暖氣很強，要能一層一層脫）", "圍巾、手套、毛帽", "室內外溫差大，帶好脫的外層"],
    };
  }
  if (high < 17) {
    return {
      tier: "大衣・厚外套",
      summary: "偏冷，大衣或厚夾克加針織衫。",
      items: ["大衣或厚夾克", "長袖加針織衫或薄毛衣", "早晚更冷，圍巾很好用"],
    };
  }
  if (high < 22) {
    return {
      tier: "薄外套・長袖",
      summary: "舒服但早晚涼，長袖加薄外套。",
      items: ["長袖上衣", "薄外套、襯衫外搭或輕便風衣", "晚上帶一件，白天可以脫"],
    };
  }
  if (high < 27) {
    return {
      tier: "短袖加薄外套",
      summary: "白天偏暖，短袖就夠，室內冷氣、晚上帶一件薄的。",
      items: ["短袖或薄長袖", "輕薄外套（室內冷氣、夜晚用）", "防曬"],
    };
  }
  return {
    tier: "夏裝・防曬",
    summary: "很熱，輕薄透氣、防曬、補水。",
    items: ["短袖、透氣材質", "帽子、墨鏡、防曬乳", "隨身水壺，中午別在戶外太久"],
  };
}

export type MonthInfo = {
  month: number;
  fukuoka: Month;
  kaohsiung: Month;
  /** 高雄平均最高溫減福岡（正的＝福岡比高雄冷；夏天可能是負的） */
  highGap: number;
  lowGap: number;
  outfit: Outfit;
  rainNote: string | null;
  title: string;
  description: string;
  answer: string;
};

const r1 = (n: number) => Math.round(n * 10) / 10;

/** 雨的提醒：雨天多、或剛好是九州的梅雨（6 月～7 月中）、颱風季（8、9 月）的一般氣候 */
function rainNoteFor(month: number, rainyDays: number): string | null {
  const notes: string[] = [];
  if (month === 6 || month === 7) notes.push("九州 6 月到 7 月中是梅雨季，常常整天陰雨");
  if (month === 8 || month === 9) notes.push("8、9 月是颱風季，出發前看一下預報");
  if (rainyDays >= 15) notes.push(`平均一個月有 ${rainyDays} 天下雨（日降水量 1 mm 以上），帶摺疊傘或輕便雨衣`);
  else if (rainyDays >= 11) notes.push(`平均一個月約 ${rainyDays} 天下雨，包包放一把摺疊傘比較安心`);
  return notes.length ? `${notes.join("；")}。` : null;
}

export function monthInfo(month: number): MonthInfo | null {
  if (!MONTHS.includes(month)) return null;
  const f = fukuoka[month - 1];
  const k = kaohsiung[month - 1];
  const outfit = outfitFor(f.high, f.low);
  const highGap = r1(k.high - f.high);
  const lowGap = r1(k.low - f.low);
  // 夏天福岡白天可能跟高雄差不多熱、甚至更熱（8 月資料就是），差距不到 2 度就不寫「比高雄冷」
  const vsKaohsiung =
    highGap >= 2
      ? `比高雄冷約 ${Math.round(highGap)} 度（白天）到 ${Math.round(Math.max(lowGap, 0))} 度（早晚）。`
      : "氣溫跟高雄差不多，不用特別換季。";
  const answer = `福岡 ${month} 月平均最低 ${f.low}°C、最高 ${f.high}°C，穿「${outfit.tier}」：${outfit.summary}${vsKaohsiung}`;
  return {
    month,
    fukuoka: f,
    kaohsiung: k,
    highGap,
    lowGap,
    outfit,
    rainNote: rainNoteFor(month, f.rainyDays),
    title: `福岡 ${month} 月穿搭：平均 ${f.low}～${f.high}°C，該穿什麼？`,
    description: `${answer}近 10 年平均，不是預報。`,
    answer,
  };
}
