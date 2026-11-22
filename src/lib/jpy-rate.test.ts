import { describe, expect, it } from "vitest";
import { parseBotCsv, parseEsun, parseYahoo, purchaseDecision } from "./jpy-rate";

// 2026-11-22 從台銀、玉山、Yahoo 實際抓到的格式（截短）
const BOT = [
  "幣別,匯率,現金,即期,遠期10天,遠期30天,遠期60天,遠期90天,遠期120天,遠期150天,遠期180天,匯率,現金,即期,遠期10天,遠期30天,遠期60天,遠期90天,遠期120天,遠期150天,遠期180天",
  "USD,本行買入,32.54000,32.86500,32.87000,32.80400,32.70500,32.61400,32.53000,32.43700,32.35400,本行賣出,33.21000,33.01500,32.97400,32.91600,32.82400,32.74200,32.66700,32.58100,32.50800,",
  "JPY,本行買入,0.19860,0.20540,0.20500,0.20490,0.20480,0.20480,0.20480,0.20480,0.20480,本行賣出,0.21140,0.21040,0.20910,0.20930,0.20920,0.20920,0.20920,0.20930,0.20930,",
].join("\r\n");

const ESUN =
  '[{"@type":"ExchangeRateSpecification","name":"日圓 即期匯率 銀行買入","description":"日圓 即期匯率 銀行買入","currency":"JPY","currentExchangeRate":{"@type":"UnitPriceSpecification","price":"0.2062","priceCurrency":"JPY"}},' +
  '{"@type":"ExchangeRateSpecification","name":"日圓 即期匯率 銀行賣出","currency":"JPY","currentExchangeRate":{"price":"0.2102"}},' +
  '{"@type":"ExchangeRateSpecification","name":"日圓 現金匯率 銀行買入","currency":"JPY","currentExchangeRate":{"price":"0.2052"}},' +
  '{"@type":"ExchangeRateSpecification","name":"日圓 現金匯率 銀行賣出","currency":"JPY","currentExchangeRate":{"price":"0.2122"}},' +
  '{"@type":"ExchangeRateSpecification","name":"美元 現金匯率 銀行賣出","currency":"USD","currentExchangeRate":{"price":"33.2"}}]';

describe("parseBotCsv", () => {
  it("抓 JPY 那行的現金／即期買入賣出", () => {
    expect(parseBotCsv(BOT)).toEqual({ cashBuy: 0.1986, spotBuy: 0.2054, cashSell: 0.2114, spotSell: 0.2104 });
  });
  it("格式變了、或數字不合理（0.1～0.5 以外）就丟錯，不要顯示錯的價格", () => {
    expect(() => parseBotCsv("<html>Challenge Validation</html>")).toThrow();
    expect(() => parseBotCsv(BOT.replace("0.21140", "21.14"))).toThrow();
  });
});

describe("parseEsun", () => {
  it("從 JSON-LD 抓日圓（不會抓到美元那筆）", () => {
    expect(parseEsun(ESUN)).toEqual({ cashBuy: 0.2052, cashSell: 0.2122, spotBuy: 0.2062, spotSell: 0.2102 });
  });
  it("找不到就丟錯", () => {
    expect(() => parseEsun("<html></html>")).toThrow();
  });
});

describe("parseYahoo", () => {
  it("每天一筆（台灣日期）、去掉沒有收盤價的", () => {
    const day = 86400;
    const t0 = Date.parse("2026-08-01T00:00:00Z") / 1000;
    const timestamp = Array.from({ length: 12 }, (_, i) => t0 + i * day);
    const close = timestamp.map((_, i) => (i === 3 ? null : 0.2 + i / 1000));
    const out = parseYahoo({ chart: { result: [{ timestamp, indicators: { quote: [{ close }] } }] } });
    expect(out).toHaveLength(11);
    expect(out[0]).toEqual({ date: "2026-08-01", rate: 0.2 });
    expect(out.find((p) => p.date === "2026-08-04")).toBeUndefined();
  });
});

describe("purchaseDecision（作品的決策引擎）", () => {
  it("目標匯率＝預算 ÷ 日圓價格；現金賣出 ≤ 目標就買", () => {
    expect(purchaseDecision(0.2114, 2600, 12000)).toBe("buy"); // 目標 0.2167
    expect(purchaseDecision(0.2114, 2500, 12000)).toBe("wait"); // 目標 0.2083
    expect(purchaseDecision(0.2114, 0, 12000)).toBeNull();
  });
});
