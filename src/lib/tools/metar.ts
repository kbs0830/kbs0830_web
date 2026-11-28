// METAR 翻譯機（2026-11-29，使用者：「做一個 METAR 翻譯機，放在正式站的小工具，本地分析」）。
// METAR＝機場的例行天氣電報，例如：METAR RCKH 281800Z 20004KT 160V280 9999 FEW020 SCT045 BKN180 23/15 Q1021 NOSIG
// 這支只做「解碼」：純函式、不連網、不用 AI——貼進來的電報在瀏覽器裡逐個欄位比對，結果一定跟電報對得上。
// 依 ICAO Annex 3 / WMO 49 的寫法；美式（SM、A2992）跟國際式（公尺、Q1013）都看得懂。看不懂的欄位原樣列出，不亂猜。

export interface Token {
  raw: string;
  /** 白話（繁體中文） */
  zh: string;
  /** 欄位名稱，例如「風」「能見度」 */
  field: string;
}

export type FlightCategory = "VFR" | "MVFR" | "IFR" | "LIFR";

export interface MetarResult {
  empty: boolean;
  raw: string;
  station: string | null;
  stationName: string | null;
  /** 觀測時間：日、時、分（UTC） */
  time: { day: number; hour: number; minute: number } | null;
  tokens: Token[];
  /** 整份電報的白話摘要（一行一項） */
  summary: string[];
  category: FlightCategory | null;
  categoryReason: string | null;
  /** 看不懂的欄位 */
  unknown: string[];
}

const STATIONS: Record<string, string> = {
  RCKH: "高雄國際機場（小港）", RCTP: "桃園國際機場", RCSS: "台北松山機場", RCMQ: "台中機場", RCNN: "台南機場", RCYU: "花蓮機場", RCFN: "台東機場",
  RCQC: "澎湖馬公機場", RCBS: "金門機場", RCKU: "嘉義機場",
  RJFF: "福岡機場", RJTT: "東京羽田機場", RJAA: "東京成田機場", RJBB: "大阪關西機場", RJOO: "大阪伊丹機場", RJGG: "名古屋中部機場", RJCC: "札幌新千歲機場", ROAH: "沖繩那霸機場",
  RKSI: "首爾仁川機場", VHHH: "香港國際機場", VMMC: "澳門國際機場", WSSS: "新加坡樟宜機場", RPLL: "馬尼拉機場", VTBS: "曼谷素萬那普機場", VVTS: "胡志明市機場",
  KLAX: "洛杉磯國際機場", KJFK: "紐約甘迺迪機場", EGLL: "倫敦希斯洛機場", YSSY: "雪梨機場",
};

/** 可以「載入最新電報」的機場（伺服器只替這些去問，不讓人隨便指定代碼） */
export const METAR_STATIONS = Object.keys(STATIONS);
export const stationName = (icao: string) => STATIONS[icao] ?? null;

const COMPASS = ["北", "東北偏北", "東北", "東北偏東", "東", "東南偏東", "東南", "東南偏南", "南", "西南偏南", "西南", "西南偏西", "西", "西北偏西", "西北", "西北偏北"];
const compass = (deg: number) => COMPASS[Math.round(((deg % 360) / 22.5)) % 16];

const COVER: Record<string, string> = { FEW: "少量雲（1–2/8）", SCT: "疏雲（3–4/8）", BKN: "裂雲（5–7/8，算雲幕）", OVC: "密雲（8/8，算雲幕）" };

const INTENSITY: Record<string, string> = { "-": "小", "+": "大", VC: "附近有" };
const DESCRIPTOR: Record<string, string> = { MI: "淺層", PR: "部分", BC: "片狀", DR: "低吹", BL: "高吹", SH: "陣性", TS: "雷", FZ: "凍" };
const PHENOMENON: Record<string, string> = {
  DZ: "毛毛雨", RA: "雨", SN: "雪", SG: "雪粒", IC: "冰晶", PL: "冰粒", GR: "冰雹", GS: "小冰雹", UP: "不明降水",
  BR: "薄霧", FG: "霧", FU: "煙", VA: "火山灰", DU: "揚塵", SA: "揚沙", HZ: "霾", PY: "水沫", PO: "塵捲風", SQ: "颮線", FC: "漏斗雲（龍捲風）", SS: "沙暴", DS: "塵暴",
};
const WX_RE = /^(RE)?(\+|-|VC)?((?:MI|PR|BC|DR|BL|SH|TS|FZ)?)((?:DZ|RA|SN|SG|IC|PL|GR|GS|UP|BR|FG|FU|VA|DU|SA|HZ|PY|PO|SQ|FC|SS|DS)*)$/;
// TSRA、SHRA 這類「描述詞＋降水」的順序：雷雨、陣雨
function decodeWeather(tok: string): string | null {
  const m = tok.match(WX_RE);
  if (!m || (!m[3] && !m[4])) return null; // 描述詞跟天氣現象至少要有一個（光是「+」或「RE」不算）
  const [, recent, inten, desc, phen] = m;
  const phens = phen ? phen.match(/.{2}/g)!.map((p) => PHENOMENON[p]).join("加") : desc === "SH" ? "降水" : "";
  let s = `${desc ? DESCRIPTOR[desc] : ""}${phens}`;
  if (desc === "TS") s = `雷暴${phen ? `伴隨${phens}` : ""}`;
  if (desc === "SH") s = `陣性${phens}`;
  if (desc === "FZ") s = `凍${phens}`;
  if (inten === "VC") s = `${INTENSITY.VC}${s}（機場 8–16 公里內）`;
  else if (inten) s = `${INTENSITY[inten]}${s}`;
  else if (!desc && !recent) s = `中等強度${s}`; // 沒有符號＝中等；霧、霾這類沒有強度概念，不加
  if (/^(BR|FG|FU|HZ|DU|SA|VA|PO|SQ|FC|SS|DS)/.test(phen) && !inten) s = s.replace("中等強度", "");
  if (recent) s = `剛剛有過：${s}`;
  return s;
}

const num = (s: string) => Number(s);
const kmh = (kt: number) => Math.round(kt * 1.852);

function decodeWind(tok: string): string | null {
  const m = tok.match(/^(VRB|\d{3})(\d{2,3})(?:G(\d{2,3}))?(KT|MPS|KMH)$/);
  if (!m) return null;
  const [, dir, spd, gust, unit] = m;
  const toKt = (v: number) => (unit === "MPS" ? v * 1.94384 : unit === "KMH" ? v / 1.852 : v);
  const speedKt = toKt(num(spd));
  if (num(spd) === 0 && dir === "000") return "無風（靜風）";
  const speedTxt = `${Math.round(speedKt)} 節（約 ${kmh(speedKt)} km/h）`;
  const from = dir === "VRB" ? "風向不定" : `從${compass(num(dir))}（${dir}°）吹來`;
  const g = gust ? `，陣風到 ${Math.round(toKt(num(gust)))} 節（約 ${kmh(toKt(num(gust)))} km/h）` : "";
  return `${from}，風速 ${speedTxt}${g}`;
}

function decodeVisibility(tok: string): { text: string; meters: number | null } | null {
  if (tok === "CAVOK") return { text: "CAVOK：能見度 10 公里以上、5,000 呎以下沒有雲（或沒有積雨雲）、沒有顯著天氣", meters: 10000 };
  let m = tok.match(/^(\d{4})(NDV|N|NE|E|SE|S|SW|W|NW)?$/);
  if (m) {
    const v = num(m[1]);
    const dir = m[2] && m[2] !== "NDV" ? `（${compass({ N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315 }[m[2]] ?? 0)}方向）` : "";
    if (v === 9999) return { text: `能見度 10 公里以上${dir}`, meters: 10000 };
    if (v === 0) return { text: "能見度不到 50 公尺", meters: 0 };
    return { text: `能見度 ${v >= 1000 ? `${(v / 1000).toFixed(v % 1000 ? 1 : 0)} 公里` : `${v} 公尺`}${dir}`, meters: v };
  }
  m = tok.match(/^([PM])?(\d+)(?:\/(\d+))?SM$/);
  if (m) {
    const sm = m[3] ? num(m[2]) / num(m[3]) : num(m[2]);
    const meters = Math.round(sm * 1609.34);
    const pre = m[1] === "P" ? "超過 " : m[1] === "M" ? "不到 " : "";
    return { text: `能見度 ${pre}${m[3] ? `${m[2]}/${m[3]}` : m[2]} 英里（約 ${meters >= 1000 ? `${(meters / 1000).toFixed(1)} 公里` : `${meters} 公尺`}）`, meters };
  }
  return null;
}

function decodeCloud(tok: string): { text: string; ceilingFt: number | null } | null {
  let m = tok.match(/^(FEW|SCT|BKN|OVC)(\d{3}|\/\/\/)(CB|TCU)?$/);
  if (m) {
    const ft = m[2] === "///" ? null : num(m[2]) * 100;
    const type = m[3] === "CB" ? "，積雨雲（會有雷雨）" : m[3] === "TCU" ? "，塔狀積雲（發展中的對流雲）" : "";
    const base = ft == null ? "雲底高度不明" : `雲底 ${ft.toLocaleString("en-US")} 呎（約 ${Math.round(ft * 0.3048).toLocaleString("en-US")} 公尺）`;
    return { text: `${COVER[m[1]]}，${base}${type}`, ceilingFt: m[1] === "BKN" || m[1] === "OVC" ? ft : null };
  }
  m = tok.match(/^VV(\d{3}|\/\/\/)$/);
  if (m) {
    const ft = m[1] === "///" ? null : num(m[1]) * 100;
    return { text: `垂直能見度 ${ft == null ? "不明" : `${ft.toLocaleString("en-US")} 呎`}（天空被霧或雲遮住、看不到雲）`, ceilingFt: ft ?? 0 };
  }
  const clear: Record<string, string> = { SKC: "天空晴朗（沒有雲）", CLR: "沒有偵測到雲（自動站，12,000 呎以下）", NSC: "沒有顯著的雲（5,000 呎以下沒有雲、也沒有積雨雲）", NCD: "沒有偵測到雲（自動站）" };
  if (clear[tok]) return { text: clear[tok], ceilingFt: null };
  return null;
}

function decodeTemp(tok: string): { text: string; t: number; d: number | null } | null {
  const m = tok.match(/^(M?\d{2})\/(M?\d{2}|\/\/)?$/);
  if (!m) return null;
  const val = (s: string) => (s.startsWith("M") ? -num(s.slice(1)) : num(s));
  const t = val(m[1]);
  const d = m[2] && m[2] !== "//" ? val(m[2]) : null;
  let text = `氣溫 ${t}°C`;
  if (d != null) {
    // Magnus 公式估相對濕度
    const rh = Math.round(100 * Math.exp((17.625 * d) / (243.04 + d) - (17.625 * t) / (243.04 + t)));
    text += `，露點 ${d}°C（相對濕度約 ${rh}%）`;
  }
  return { text, t, d };
}

function decodeRvr(tok: string): string | null {
  const m = tok.match(/^R(\d{2}[LCR]?)\/([PM])?(\d{4})(?:V([PM])?(\d{4}))?([UDN])?(FT)?$/);
  if (!m) return null;
  const unit = m[7] ? "呎" : "公尺";
  const trend = m[6] === "U" ? "，變好中" : m[6] === "D" ? "，變差中" : m[6] === "N" ? "，沒有明顯變化" : "";
  const one = (p: string | undefined, v: string) => `${p === "P" ? "超過 " : p === "M" ? "不到 " : ""}${num(v)} ${unit}`;
  return `${m[1]} 跑道的跑道視程 ${one(m[2], m[3])}${m[5] ? ` ～ ${one(m[4], m[5])}` : ""}${trend}（飛行員在跑道上能看到的距離）`;
}

const TREND: Record<string, string> = { NOSIG: "未來 2 小時沒有明顯變化（NOSIG）", BECMG: "接下來會逐漸變成：", TEMPO: "短暫（不到 1 小時）可能出現：" };

function categoryOf(meters: number | null, ceilingFt: number | null): { cat: FlightCategory; reason: string } | null {
  if (meters == null && ceilingFt == null) return null;
  const v = meters ?? 99999;
  const c = ceilingFt ?? 99999;
  // 常用的目視／儀器氣象分類：雲幕（呎）與能見度（公尺，對應 1／3／5 英里）
  const catV: FlightCategory = v < 1600 ? "LIFR" : v < 4800 ? "IFR" : v < 8000 ? "MVFR" : "VFR";
  const catC: FlightCategory = c < 500 ? "LIFR" : c < 1000 ? "IFR" : c <= 3000 ? "MVFR" : "VFR";
  const order: FlightCategory[] = ["LIFR", "IFR", "MVFR", "VFR"];
  const cat = order[Math.min(order.indexOf(catV), order.indexOf(catC))];
  const why = `${meters == null ? "" : `能見度 ${meters >= 10000 ? "10 公里以上" : `${meters} 公尺`}`}${meters != null && ceilingFt != null ? "、" : ""}${ceilingFt == null ? (meters != null ? "、沒有雲幕" : "") : `雲幕 ${ceilingFt.toLocaleString("en-US")} 呎`}`;
  return { cat, reason: why };
}

const CATEGORY_ZH: Record<FlightCategory, string> = { VFR: "VFR（目視飛行，天氣好）", MVFR: "MVFR（邊緣目視，天氣普通）", IFR: "IFR（要靠儀器飛，天氣差）", LIFR: "LIFR（低儀器天氣，天氣很差）" };

export function decodeMetar(input: string): MetarResult {
  const raw = input.replace(/=+\s*$/g, "").replace(/\s+/g, " ").trim();
  const empty: MetarResult = { empty: true, raw, station: null, stationName: null, time: null, tokens: [], summary: [], category: null, categoryReason: null, unknown: [] };
  if (!raw) return empty;

  const toks = raw.split(" ");
  const tokens: Token[] = [];
  const unknown: string[] = [];
  const add = (r: string, field: string, zh: string) => tokens.push({ raw: r, field, zh });

  let station: string | null = null;
  let time: MetarResult["time"] = null;
  let windTxt: string | null = null;
  let visText: string | null = null;
  let visMeters: number | null = null;
  let cavok = false;
  const clouds: string[] = [];
  const weather: string[] = [];
  const rvr: string[] = [];
  let ceiling: number | null = null;
  let tempTxt: string | null = null;
  let qnh: string | null = null;
  const trends: string[] = [];
  let remarks: string | null = null;
  let auto = false;
  let inTrend = false; // 進了 BECMG／TEMPO 之後的欄位是「預報」，不要拿來覆蓋現在的觀測
  let sawMain = false;

  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];

    if (remarks != null) {
      remarks += ` ${t}`;
      const ra = t.match(/^A(\d{4})$/);
      add(t, "備註內容", ra ? `高度表撥定值 ${(num(ra[1]) / 100).toFixed(2)} inHg（美式寫法，跟前面的 QNH 是同一個氣壓）` : /^AO[12]$/.test(t) ? (t === "AO1" ? "AO1：自動站，沒有降水感測器" : "AO2：自動站，有降水感測器") : "備註裡的資訊，各國寫法不同，這裡原樣顯示");
      continue;
    }
    if (t === "RMK") {
      remarks = "";
      add(t, "備註", "備註（Remarks）：以下是各國自己加的補充資訊，格式不統一");
      continue;
    }
    if ((t === "METAR" || t === "SPECI") && i === 0) {
      add(t, "類型", t === "METAR" ? "METAR：例行天氣報告（通常每半小時或每小時一次）" : "SPECI：特別天氣報告（天氣變化大時臨時加發）");
      continue;
    }
    if (t === "COR") { add(t, "更正", "COR：更正報（前一份有誤）"); continue; }
    if (t === "AUTO") { auto = true; add(t, "自動站", "AUTO：自動觀測，沒有人員確認"); continue; }
    if (t === "NIL") { add(t, "沒有資料", "NIL：沒有報告"); continue; }
    if (!station && /^[A-Z]{4}$/.test(t) && !TREND[t]) {
      station = t;
      add(t, "機場", `${t}：${STATIONS[t] ?? "機場代碼（ICAO）"}`);
      continue;
    }
    const tm = t.match(/^(\d{2})(\d{2})(\d{2})Z$/);
    if (tm && !time) {
      time = { day: num(tm[1]), hour: num(tm[2]), minute: num(tm[3]) };
      const tw = new Date(Date.UTC(2000, 0, time.day, time.hour + 8, time.minute));
      add(t, "觀測時間", `每月 ${time.day} 日 ${String(time.hour).padStart(2, "0")}:${String(time.minute).padStart(2, "0")} UTC（台灣時間 ${tw.getUTCDate() === time.day ? "同一天" : `${tw.getUTCDate()} 日`} ${String(tw.getUTCHours()).padStart(2, "0")}:${String(tw.getUTCMinutes()).padStart(2, "0")}）`);
      continue;
    }
    if (TREND[t]) {
      inTrend = t !== "NOSIG";
      trends.push(TREND[t]);
      add(t, "趨勢", TREND[t]);
      continue;
    }
    const fm = t.match(/^(FM|TL|AT)(\d{2})(\d{2})$/);
    if (fm) {
      add(t, "時間", `${fm[1] === "FM" ? "從" : fm[1] === "TL" ? "直到" : "在"} ${fm[2]}:${fm[3]} UTC`);
      continue;
    }
    const w = decodeWind(t);
    if (w) {
      if (!inTrend) windTxt = w;
      add(t, inTrend ? "風（預報）" : "風", w);
      continue;
    }
    const wv = t.match(/^(\d{3})V(\d{3})$/);
    if (wv) {
      if (!inTrend) windTxt = `${windTxt ?? ""}，風向在 ${wv[1]}° 到 ${wv[2]}° 之間擺動`;
      add(t, "風向變化", `風向在 ${wv[1]}° ～ ${wv[2]}° 之間來回變化（順時針從 ${wv[1]}° 到 ${wv[2]}°）`);
      continue;
    }
    const v = decodeVisibility(t);
    if (v && !(sawMain === false && /^\d{4}$/.test(t) && !station)) {
      if (!inTrend) {
        visText = v.text;
        visMeters = v.meters;
        if (t === "CAVOK") cavok = true;
      }
      add(t, inTrend ? "能見度（預報）" : "能見度", v.text);
      continue;
    }
    const r = decodeRvr(t);
    if (r) { rvr.push(r); add(t, "跑道視程", r); continue; }
    const c = decodeCloud(t);
    if (c) {
      if (!inTrend) {
        clouds.push(c.text);
        if (c.ceilingFt != null) ceiling = ceiling == null ? c.ceilingFt : Math.min(ceiling, c.ceilingFt);
      }
      add(t, inTrend ? "雲（預報）" : "雲", c.text);
      continue;
    }
    const tp = decodeTemp(t);
    if (tp) { tempTxt = tp.text; sawMain = true; add(t, "氣溫／露點", `${tp.text}`); continue; }
    const q = t.match(/^Q(\d{4})$/);
    if (q) { qnh = `QNH ${q[1]} hPa（修正海平面氣壓）`; add(t, "氣壓", `${qnh}。飛機用它校正高度表`); continue; }
    const a = t.match(/^A(\d{4})$/);
    if (a) {
      const inHg = num(a[1]) / 100;
      qnh = `高度表撥定值 ${inHg.toFixed(2)} inHg（約 ${Math.round(inHg * 33.8639)} hPa）`;
      add(t, "氣壓", qnh);
      continue;
    }
    const wx = decodeWeather(t);
    if (wx) {
      if (!inTrend) weather.push(wx);
      add(t, inTrend ? "天氣（預報）" : "天氣", wx);
      continue;
    }
    if (/^WS$/.test(t) || /^RWY\d{2}[LCR]?$/.test(t) || /^NSW$/.test(t)) {
      add(t, "其他", t === "NSW" ? "NSW：顯著天氣結束（沒有顯著天氣）" : t === "WS" ? "WS：低空風切" : `${t.slice(3)} 跑道`);
      continue;
    }
    unknown.push(t);
    add(t, "不認得", "看不懂這個欄位，原樣保留");
  }

  const summary: string[] = [];
  const head = `${station ? `${STATIONS[station] ?? station}（${station}）` : "機場不明"}${time ? `，${time.day} 日 ${String(time.hour).padStart(2, "0")}:${String(time.minute).padStart(2, "0")} UTC 的觀測` : ""}${auto ? "（自動站）" : ""}`;
  summary.push(head);
  if (windTxt) summary.push(`風：${windTxt}`);
  if (visText) summary.push(visText);
  if (weather.length) summary.push(`天氣現象：${weather.join("、")}`);
  else if (!cavok) summary.push("沒有顯著天氣現象（沒下雨、沒起霧）");
  if (rvr.length) summary.push(...rvr);
  if (clouds.length) summary.push(`雲：${clouds.join("；")}`);
  if (tempTxt) summary.push(tempTxt);
  if (qnh) summary.push(qnh);
  if (trends.length) summary.push(`趨勢：${trends.join(" ")}（詳見下表）`);

  const cat = categoryOf(visMeters, ceiling);
  if (cat) summary.push(`飛航天氣分類：${CATEGORY_ZH[cat.cat]}（${cat.reason}）`);

  return {
    empty: false,
    raw,
    station,
    stationName: station ? (STATIONS[station] ?? null) : null,
    time,
    tokens,
    summary,
    category: cat?.cat ?? null,
    categoryReason: cat?.reason ?? null,
    unknown,
  };
}

export const METAR_EXAMPLE = "METAR RCKH 281800Z 20004KT 160V280 9999 FEW020 SCT045 BKN180 23/15 Q1021 NOSIG RMK A3016";
