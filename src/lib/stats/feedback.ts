import "server-only";
import { dataFile, readJsonFile, writeJsonFile } from "@/lib/data-file";
import { twDate } from "../../../scripts/lib/tw-time.js";

// 記事最後「這篇有幫到你嗎？」的回饋（TODO B20，2026-11-28）：點一下「有／沒有」就送出，不用登入、不留言。
// 只存「文章 slug、有／沒有、沒有的原因、日期」的次數，**不存 IP、UA、任何能識別人的東西**。
// 檔案 data/feedback.json：{ days: { "2026-11-28": { "<slug>": { yes, no, reasons: { unclear, unsolved, outdated } } } } }，只留近 365 天。
// 同步「讀 → 改 → 寫」（見 lib/data-file.ts）。給後台 /admin/reports 看：知道哪種文章值得多寫。

export const REASONS = ["unclear", "unsolved", "outdated"] as const;
export type Reason = (typeof REASONS)[number];
export const REASON_LABEL: Record<Reason, string> = { unclear: "看不懂", unsolved: "沒解決我的問題", outdated: "內容過時了" };

type Counts = { yes: number; no: number; reasons: Partial<Record<Reason, number>> };
type Store = { days: Record<string, Record<string, Counts>> };

const file = () => dataFile("FEEDBACK_FILE", "feedback.json");

export function recordFeedback(slug: string, helpful: boolean, reason?: Reason, now = Date.now()) {
  const store = readJsonFile<Store>(file()) ?? { days: {} };
  const day = twDate(now);
  const today = (store.days[day] ??= {});
  const c = (today[slug] ??= { yes: 0, no: 0, reasons: {} });
  if (helpful) c.yes++;
  else {
    c.no++;
    if (reason) c.reasons[reason] = (c.reasons[reason] ?? 0) + 1;
  }
  const keep = Object.keys(store.days).sort().slice(-365);
  store.days = Object.fromEntries(keep.map((d) => [d, store.days[d]]));
  writeJsonFile(file(), store, { atomic: true });
}

export type FeedbackSummary = { slug: string; yes: number; no: number; helpfulPct: number; topReason: Reason | null };

/** 每篇文章累計的回饋（有回饋的才列），總票數多的在前 */
export function readFeedbackSummary(): FeedbackSummary[] {
  const days = readJsonFile<Store>(file())?.days ?? {};
  const acc = new Map<string, Counts>();
  for (const bySlug of Object.values(days)) {
    for (const [slug, c] of Object.entries(bySlug)) {
      const t = acc.get(slug) ?? { yes: 0, no: 0, reasons: {} };
      t.yes += c.yes;
      t.no += c.no;
      for (const r of REASONS) if (c.reasons?.[r]) t.reasons[r] = (t.reasons[r] ?? 0) + (c.reasons[r] ?? 0);
      acc.set(slug, t);
    }
  }
  return [...acc.entries()]
    .map(([slug, t]) => ({
      slug,
      yes: t.yes,
      no: t.no,
      helpfulPct: Math.round((t.yes / Math.max(1, t.yes + t.no)) * 100),
      topReason: REASONS.reduce<Reason | null>((best, r) => ((t.reasons[r] ?? 0) > (best ? (t.reasons[best] ?? 0) : 0) ? r : best), null),
    }))
    .sort((a, b) => b.yes + b.no - (a.yes + a.no));
}
