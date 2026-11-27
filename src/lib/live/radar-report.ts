import "server-only";
import { dataFile, readJsonFile, writeJsonFile } from "@/lib/data-file";
import { CHAT_MODEL, OLLAMA_URL } from "@/lib/ai/ollama";
import { DEX_GROUPS } from "@/lib/live/aircraft-dex";
import { twDate } from "../../../scripts/lib/tw-time.js";
import { AIRLINE_NAMES, TYPE_NAMES, readState } from "../../../scripts/lib/radar.js";

// 雷達 AI 日報（TODO H6，2026-11-27）：每天由本機的 Gemma 把「昨天」的數字寫成兩三句話，放在 /radar。
// 做法：**數字全部由程式算好**（收到幾架、最多同時、最忙時段、最多的航空公司與機型、珍しい機型），模型只負責把它寫成人話；
// 寫完再檢查（有沒有冒出事實裡沒有的數字、有沒有提到位置），不合格或 Ollama 沒開就用固定句型的版本，頁面一定有東西可看。
// ⚠️ 隱私：跟 /radar 同一條規則——只有數量、時段、航空公司、機型；不寫位置、距離、機場、涵蓋範圍（FORBIDDEN 會擋）。
// 觸發：有人打開 /radar、而且昨天的日報還沒寫，就用 after() 在回應送出後產生（不用新的排程工作）；同時只跑一個，失敗 10 分鐘內不重試。

export interface DayFacts {
  date: string;
  unique: number;
  peak: number;
  /** 一天中「最多同時收到幾架」最高的那個小時（台灣時間） */
  busiestHour: number | null;
  airline: { name: string; n: number } | null;
  type: { name: string; n: number } | null;
  /** 收到的珍しい機型名稱（圖鑑標 rare 的） */
  rare: string[];
  /** 前 7 天（有資料的日子）平均每天幾架；沒有前幾天就 null */
  avg7: number | null;
  /** 昨天的在線率（%） */
  uptime: number | null;
}

export interface RadarReport {
  /** 這份日報寫的是哪一天（台灣日期） */
  date: string;
  text: string;
  by: "ai" | "template";
  model: string | null;
  generatedAt: number;
}

type Day = { polls?: number; online?: number; peak?: number; unique?: number; airlines?: Record<string, number>; types?: Record<string, number>; hourPeak?: (number | null)[] };
type State = { days?: Record<string, Day> } | null;

const RARE = new Map(DEX_GROUPS.flatMap((g) => g.entries).filter((e) => e.rare).map((e) => [e.code, e.name]));
const airlineNames = AIRLINE_NAMES as Record<string, string>;
const typeNames = TYPE_NAMES as Record<string, string>;

const top = (counts: Record<string, number> | undefined) =>
  Object.entries(counts ?? {}).toSorted((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];

/** 純函式：某一天的事實。那天沒有資料、或一架都沒收到就回 null（沒東西可寫） */
export function reportFacts(state: State, date: string): DayFacts | null {
  const d = state?.days?.[date];
  if (!d || !d.unique) return null;
  const hours = Array.isArray(d.hourPeak) ? d.hourPeak : [];
  let busiestHour: number | null = null;
  let best = 0;
  hours.forEach((v, h) => {
    if (typeof v === "number" && v > best) {
      best = v;
      busiestHour = h;
    }
  });
  const a = top(d.airlines);
  const t = top(d.types);
  const before = Object.entries(state?.days ?? {})
    .filter(([k, v]) => k < date && k >= twDate(Date.parse(`${date}T00:00:00Z`) - 7 * 86400_000) && (v.unique ?? 0) > 0)
    .map(([, v]) => v.unique as number);
  return {
    date,
    unique: d.unique,
    peak: d.peak ?? 0,
    busiestHour,
    airline: a ? { name: airlineNames[a[0]] || a[0], n: a[1] } : null,
    type: t ? { name: typeNames[t[0]] || t[0], n: t[1] } : null,
    rare: [...RARE].filter(([code]) => (d.types?.[code] ?? 0) > 0).map(([, name]) => name),
    avg7: before.length ? Math.round(before.reduce((x, y) => x + y, 0) / before.length) : null,
    uptime: d.polls ? Math.round(((d.online ?? 0) / d.polls) * 100) : null,
  };
}

const md = (date: string) => `${Number(date.slice(5, 7))} 月 ${Number(date.slice(8, 10))} 日`;

/** 給模型看的事實（也是檢查數字的依據：模型寫出來的數字一定要在這裡面） */
export function factsText(f: DayFacts): string {
  const lines = [
    `日期：${md(f.date)}`,
    `收到不同的飛機：${f.unique} 架`,
    `同時最多：${f.peak} 架`,
    f.busiestHour !== null ? `最忙的時段：${f.busiestHour} 點到 ${f.busiestHour + 1} 點` : null,
    f.airline ? `最常出現的航空公司：${f.airline.name}（${f.airline.n} 架）` : null,
    f.type ? `最常出現的機型：${f.type.name}（${f.type.n} 架）` : null,
    f.rare.length ? `珍しい（少見）的機型：${f.rare.join("、")}` : null,
    f.avg7 !== null ? `前 7 天平均每天：${f.avg7} 架` : null,
    f.uptime !== null && f.uptime < 90 ? `接收器在線率：${f.uptime}%（偏低，部分時間沒在接收）` : null,
  ];
  return lines.filter(Boolean).join("\n");
}

/** 固定句型的日報（Ollama 沒開、模型寫壞時用） */
export function templateReport(f: DayFacts): string {
  const parts = [`${md(f.date)}雷達收到 ${f.unique} 架不同的飛機，同時最多 ${f.peak} 架`];
  if (f.avg7 !== null) parts[0] += `，${f.unique > f.avg7 ? `比前 7 天平均的 ${f.avg7} 架多` : f.unique < f.avg7 ? `比前 7 天平均的 ${f.avg7} 架少` : `跟前 7 天平均的 ${f.avg7} 架差不多`}`;
  parts[0] += "。";
  const second: string[] = [];
  if (f.busiestHour !== null) second.push(`最忙的是 ${f.busiestHour} 點到 ${f.busiestHour + 1} 點`);
  if (f.airline) second.push(`最常看到${f.airline.name}`);
  if (f.type) second.push(`機型以 ${f.type.name} 最多`);
  if (second.length) parts.push(`${second.join("，")}。`);
  if (f.rare.length) parts.push(`還收到少見的 ${f.rare.join("、")}。`);
  if (f.uptime !== null && f.uptime < 90) parts.push(`這天接收器只有約 ${f.uptime}% 的時間在線，數字偏低。`);
  return parts.join("");
}

/** 絕對不能出現在日報裡的字：位置、距離、涵蓋範圍（跟 /radar 的隱私規則一樣） */
const FORBIDDEN = /位置|距離|公里|海里|英里|座標|經緯|附近|機場|方圓|範圍|覆蓋|涵蓋|地點|住家|家裡|高雄|福岡|台灣|日本|北邊|南邊|東邊|西邊|方向/;

/**
 * 檢查模型寫的日報：長度合理、沒有開場白／標題／條列、沒提到位置，
 * 而且文字裡每一段數字都要出現在事實裡（模型最常犯的錯是自己編數字）。合格回整理過的文字，不合格回 null。
 */
export function acceptReport(raw: string, facts: string, names: string[] = []): string | null {
  const text = raw.trim().replace(/\s*\n+\s*/g, "");
  if (text.length < 20 || text.length > 260) return null;
  if (/^(好的|以下|這是|當然)|[#*•\-]\s|^[-*]/.test(text)) return null;
  // 航空公司、機型的名稱本身可能有地名（台灣虎航、日本航空），檢查前先拿掉
  if (FORBIDDEN.test(names.reduce((t, n) => t.replaceAll(n, ""), text))) return null;
  const allowed = new Set(facts.match(/\d+/g) ?? []);
  for (const n of text.match(/\d+/g) ?? []) if (!allowed.has(n)) return null;
  return text;
}

const PROMPT = (facts: string) =>
  `你是一個自架飛機雷達網頁的日報編輯。根據下面的「事實」，用繁體中文寫 2～3 句日報，語氣平實，像寫日記。\n` +
  `規則：只能用事實裡的內容跟數字，不要加任何沒寫的數字、機型或航空公司；不要提到位置、距離、機場、地名；不要寫標題、開場白、表情符號或條列，直接寫句子。\n\n事實：\n${facts}`;

const reportFile = () => dataFile("RADAR_REPORT_FILE", "radar-report.json");
export const readRadarReport = () => readJsonFile<RadarReport>(reportFile());

async function askModel(facts: string, names: string[]): Promise<string | null> {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: AbortSignal.timeout(120_000),
      body: JSON.stringify({
        model: CHAT_MODEL,
        stream: false,
        keep_alive: "10m",
        options: { temperature: 0.4, num_predict: 220, num_ctx: 2048 },
        messages: [{ role: "user", content: PROMPT(facts) }],
      }),
    });
    if (!res.ok) return null;
    const text = ((await res.json()) as { message?: { content?: string } }).message?.content;
    return text ? acceptReport(text, facts, names) : null;
  } catch {
    return null;
  }
}

/** 產生並存檔「昨天」的日報；昨天沒有資料回 null（不寫檔） */
export async function generateRadarReport(now = Date.now()): Promise<RadarReport | null> {
  const date = twDate(now - 86400_000);
  const facts = reportFacts(readState(dataFile("RADAR_FILE", "radar.json")) as State, date);
  if (!facts) return null;
  const names = [facts.airline?.name, facts.type?.name, ...facts.rare].filter((n): n is string => Boolean(n));
  const ai = await askModel(factsText(facts), names);
  const report: RadarReport = { date, text: ai ?? templateReport(facts), by: ai ? "ai" : "template", model: ai ? CHAT_MODEL : null, generatedAt: Date.now() };
  writeJsonFile(reportFile(), report, { atomic: true });
  return report;
}

let running = false;
let retryAfter = 0;

/** /radar 被打開時呼叫（放在 after() 裡）：昨天的日報還沒寫就寫一份。同時只跑一個，失敗 10 分鐘內不重試 */
export async function ensureRadarReport(now = Date.now()): Promise<void> {
  if (running || now < retryAfter) return;
  if (readRadarReport()?.date === twDate(now - 86400_000)) return;
  running = true;
  try {
    if (!(await generateRadarReport(now))) retryAfter = now + 600_000;
  } catch {
    retryAfter = now + 600_000;
  } finally {
    running = false;
  }
}
