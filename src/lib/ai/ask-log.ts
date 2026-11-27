import "server-only";
import fs from "node:fs";
import path from "node:path";
import { dataFile } from "@/lib/data-file";

// 「問我」的提問紀錄（2026-11-27，使用者：「記錄訪客問過什麼」）。
// 為什麼記：看訪客真正想知道什麼、哪些題小模型答不好，才知道知識庫缺什麼。
// 記什麼：時間、問題、答案（截斷）、列出的來源、花了幾毫秒、對話第幾則、有沒有答完。**不記 IP、不記 User-Agent、不記任何帳號**。
// 先遮掉：email、電話／長數字、長字串（可能是金鑰）——訪客有可能把自己的聯絡方式打進問題裡。
// 保留 90 天、最多 2000 筆；只有站長後台（/admin/ask）看得到。/ask 頁面有寫明「會記錄」。
// JSONL（一行一筆）：同步 appendFileSync，不用「讀全部 → 改 → 寫」；整理（刪舊的）每 50 筆才做一次。

export interface AskEntry {
  /** 毫秒時間戳 */
  t: number;
  q: string;
  a: string;
  /** 列出的來源網址 */
  src: string[];
  /** 從收到問題到答完（或中斷）的毫秒數 */
  ms: number;
  /** 這是這段對話的第幾個問題（追問會大於 1） */
  turn: number;
  /** false＝中途失敗、逾時或訪客關掉 */
  ok: boolean;
}

export const KEEP_DAYS = 90;
export const MAX_ENTRIES = 2000;
const MAX_Q = 800;
const MAX_A = 1200;

const file = () => dataFile("ASK_LOG_FILE", "ask-log.jsonl");

/** 遮掉訪客可能打進問題的個資：email、電話／長數字（7 位以上，含空格、橫線、括號）、32 字以上的英數字串（疑似金鑰） */
export function redact(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, "[email]")
    .replace(/\+?\d[\d\s().-]{5,}\d/g, (m) => (m.replace(/\D/g, "").length >= 7 ? "[number]" : m))
    .replace(/\b[A-Za-z0-9_-]{32,}\b/g, "[token]");
}

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n)}…` : s);

let appended = 0;

/** 記一筆。失敗不丟例外：記錄不該讓回答失敗 */
export function logAsk(e: Omit<AskEntry, "t"> & { t?: number }): void {
  try {
    const entry: AskEntry = { ...e, t: e.t ?? Date.now(), q: clip(redact(e.q), MAX_Q), a: clip(redact(e.a), MAX_A) };
    const f = file();
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.appendFileSync(f, `${JSON.stringify(entry)}\n`);
    if (++appended % 50 === 0) prune();
  } catch {
    // 記錄失敗就算了
  }
}

/** 只留 KEEP_DAYS 天內、最近 MAX_ENTRIES 筆（壞掉的行丟掉） */
export function prune(now = Date.now()): void {
  const kept = readAskLog({ now, limit: MAX_ENTRIES }).toReversed();
  try {
    fs.writeFileSync(`${file()}.tmp`, kept.map((e) => JSON.stringify(e)).join("\n") + (kept.length ? "\n" : ""));
    fs.renameSync(`${file()}.tmp`, file());
  } catch {
    // 下次再整理
  }
}

/** 讀紀錄：新的在前，最多 limit 筆，超過保留天數的不回 */
export function readAskLog({ limit = 200, now = Date.now() }: { limit?: number; now?: number } = {}): AskEntry[] {
  let text: string;
  try {
    text = fs.readFileSync(file(), "utf8");
  } catch {
    return [];
  }
  const cutoff = now - KEEP_DAYS * 86400_000;
  const out: AskEntry[] = [];
  for (const line of text.split("\n").toReversed()) {
    if (!line) continue;
    try {
      const e = JSON.parse(line) as AskEntry;
      if (typeof e.t === "number" && typeof e.q === "string" && e.t >= cutoff) out.push(e);
    } catch {
      // 壞掉的行略過
    }
    if (out.length >= limit) break;
  }
  return out;
}

/** 後台用的統計：總數、近 7 天、沒答完的、平均回應時間、被問最多次的問題 */
export function summarizeAsk(entries: AskEntry[], now = Date.now()) {
  const week = entries.filter((e) => now - e.t < 7 * 86400_000);
  const done = entries.filter((e) => e.ok);
  const counts = new Map<string, number>();
  for (const e of entries) {
    const k = e.q.trim().toLowerCase();
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return {
    total: entries.length,
    week: week.length,
    failed: entries.length - done.length,
    avgMs: done.length ? Math.round(done.reduce((n, e) => n + e.ms, 0) / done.length) : null,
    noSource: done.filter((e) => e.src.length === 0).length,
    top: [...counts].filter(([, n]) => n > 1).toSorted((a, b) => b[1] - a[1]).slice(0, 5),
  };
}
