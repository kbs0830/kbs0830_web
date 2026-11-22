import { cached, fetchJson, fetchText } from "./live-cache";

// 日圓匯率作品的「線上版」（TODO D2，2026-11-22）。照作品本身（school repo 的「大數據倉儲」期末專題）的做法：
//   - 銀行牌價看「現金賣出」（去銀行換日幣現鈔的價格），最低的是「最佳」
//   - 決策：目標匯率＝台幣預算 ÷ 商品日圓價格；銀行現金賣出 ≤ 目標 → 「✅ 現在就買」，否則「❌ 再等等」（utils.py 的 determine_purchase_decision）
//   - 走勢：Yahoo Finance 的 JPYTWD=X（市場中價，不是銀行牌價），近 90 天
//   - 合理範圍 0.1～0.5（config.py 的 RATE_MIN／MAX_THRESHOLD），超出就當成解析錯誤丟掉
// 作品爬 6 家銀行；2026-11-22 從桌機實測只剩 2 家抓得到（台銀官方 CSV、玉山網頁裡的結構化資料），
// 第一銀行 404、華南要跑 JS、國泰連不上、元大 500——網站版就只放這 2 家，不硬爬。

export interface BankRate {
  id: "bot" | "esun";
  name: string;
  cashBuy: number | null;
  cashSell: number | null;
  spotBuy: number | null;
  spotSell: number | null;
  /** 這家的資料是什麼時候抓的（ms） */
  at: number;
  /** 最近一次重抓失敗，現在給的是上一次成功的（LKG） */
  stale: boolean;
}

export interface JpyRate {
  banks: BankRate[];
  trend: { date: string; rate: number }[];
}

const RATE_MIN = 0.1;
const RATE_MAX = 0.5;
const valid = (n: number | null | undefined): number | null => (typeof n === "number" && Number.isFinite(n) && n >= RATE_MIN && n <= RATE_MAX ? n : null);

type Quote = Pick<BankRate, "cashBuy" | "cashSell" | "spotBuy" | "spotSell">;

/** 台銀 https://rate.bot.com.tw/xrt/flcsv/0/day：JPY,本行買入,現金,即期,遠期×7,本行賣出,現金,即期,… */
export function parseBotCsv(csv: string): Quote {
  const line = csv.split(/\r?\n/).find((l) => l.startsWith("JPY,"));
  if (!line) throw new Error("台銀 CSV 找不到 JPY");
  const c = line.split(",");
  const sellAt = c.indexOf("本行賣出");
  if (c[1] !== "本行買入" || sellAt < 0) throw new Error("台銀 CSV 欄位跟以前不一樣");
  const q = { cashBuy: valid(+c[2]), spotBuy: valid(+c[3]), cashSell: valid(+c[sellAt + 1]), spotSell: valid(+c[sellAt + 2]) };
  if (q.cashSell === null) throw new Error("台銀 CSV 的現金賣出不合理");
  return q;
}

/** 玉山外匯頁裡的 JSON-LD：{"name":"日圓 現金匯率 銀行賣出", … "price":"0.2122"} */
export function parseEsun(html: string): Quote {
  const get = (kind: "現金" | "即期", side: "買入" | "賣出") => {
    const m = html.match(new RegExp(`"name":"日圓 ${kind}匯率 銀行${side}"[^}]*?"price":"([\\d.]+)"`));
    return valid(m ? Number(m[1]) : null);
  };
  const q = { cashBuy: get("現金", "買入"), cashSell: get("現金", "賣出"), spotBuy: get("即期", "買入"), spotSell: get("即期", "賣出") };
  if (q.cashSell === null) throw new Error("玉山頁面找不到日圓現金賣出");
  return q;
}

/** Yahoo chart API → 每天一筆（台灣日期），去掉沒有收盤價的日子 */
export function parseYahoo(raw: unknown): { date: string; rate: number }[] {
  const r = (raw as { chart?: { result?: { timestamp?: number[]; indicators?: { quote?: { close?: (number | null)[] }[] } }[] } })?.chart?.result?.[0];
  const ts = r?.timestamp ?? [];
  const close = r?.indicators?.quote?.[0]?.close ?? [];
  const byDate = new Map<string, number>();
  ts.forEach((t, i) => {
    const v = valid(close[i]);
    if (v !== null) byDate.set(new Date(t * 1000 + 8 * 3600_000).toISOString().slice(0, 10), Math.round(v * 10000) / 10000);
  });
  const out = [...byDate].map(([date, rate]) => ({ date, rate })).sort((a, b) => a.date.localeCompare(b.date));
  if (out.length < 10) throw new Error("Yahoo 走勢資料太少");
  return out;
}

/** 作品的決策引擎：目標匯率＝預算 ÷ 日圓價格，現金賣出 ≤ 目標 → 現在就買 */
export function purchaseDecision(cashSell: number, budgetTwd: number, priceJpy: number): "buy" | "wait" | null {
  if (!(budgetTwd > 0) || !(priceJpy > 0)) return null;
  return cashSell <= budgetTwd / priceJpy ? "buy" : "wait";
}

const BANKS = [
  { id: "bot" as const, name: "台灣銀行", load: async () => parseBotCsv(await fetchText("https://rate.bot.com.tw/xrt/flcsv/0/day")) },
  {
    id: "esun" as const,
    name: "玉山銀行",
    load: async () => parseEsun(await fetchText("https://www.esunbank.com.tw/bank/personal/deposit/rate/forex/foreign-exchange-rates")),
  },
];

/** 牌價 10 分鐘抓一次（作品是 5 分鐘），走勢 6 小時一次。每家各自快取：一家壞了另一家照常、壞的那家給上次的 */
export async function getJpyRate(): Promise<JpyRate | null> {
  const [banks, trend] = await Promise.all([
    Promise.all(BANKS.map(async (b) => ({ b, c: await cached(`jpy:${b.id}`, 10 * 60_000, b.load, { failRetryMs: 5 * 60_000 }) }))),
    cached(
      "jpy:yahoo",
      6 * 3600_000,
      async () => parseYahoo(await fetchJson("https://query1.finance.yahoo.com/v8/finance/chart/JPYTWD=X?range=90d&interval=1d")),
      { failRetryMs: 10 * 60_000 },
    ),
  ]);
  const list: BankRate[] = banks.flatMap(({ b, c }) => (c ? [{ id: b.id, name: b.name, ...c.value, at: c.at, stale: c.stale }] : []));
  if (!list.length && !trend) return null;
  // Yahoo 的 range=90d 實際回傳約 4 個月（2026-11-22 看到從 7/20 開始），自己切最近 90 天
  const since = new Date(Date.now() + 8 * 3600_000 - 90 * 86400_000).toISOString().slice(0, 10);
  return { banks: list, trend: (trend?.value ?? []).filter((p) => p.date >= since) };
}
