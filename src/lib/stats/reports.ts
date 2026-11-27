import fs from "node:fs";
import { dataFile, logFile, readJsonFile } from "@/lib/data-file";
import { p75, readVitals } from "@/lib/stats/web-vitals";
import { twDate } from "../../../scripts/lib/tw-time.js";
import { readCloudflareDays } from "@/lib/stats/cloudflare-analytics";
import { readDetail, type DayDetail } from "@/lib/stats/visit-detail";
import { readDeploys, readRestarts, readUptime, type Deploy, type RestartEvent } from "@/lib/ops/status";
import { readChangelog, type ChangelogEntry } from "@/lib/ops/changelog";
import { getAllPosts } from "@/lib/content/blog";
import { readDelays } from "@/lib/travel/airport-delay-recorder";
import { summarizeDelaysRange, type DelaySummary } from "@/lib/travel/airport-delays";
import { readGoClicks } from "@/lib/stats/go-clicks";
import { readHeroStats, VARIANT_NAMES, type HeroVariant } from "@/lib/stats/hero-stats";
import { AIRLINE_NAMES, TYPE_NAMES, readState as readRadar } from "../../../scripts/lib/radar.js";
import { nf, monthDay as md } from "@/lib/format";

// 日報／週報／月報（2026-11-25，使用者：「要詳細的日報週報月報，在網站裡面，之後再挪到私人的管理者裡」）。
// 網頁 /reports 跟寄信（scripts/report-mail.ps1 打本機的 /api/reports?format=text）共用這一份，數字只算一次。
// 所有日期都是台灣日期；Cloudflare 的每日數字是 UTC 日期（差 8 小時，報表上有註明）。
// 有幾種分類（熱門頁、來源、國家、未過濾流量、版本）2026-11-25 才開始逐日存，之前的日子只有總數——報表會標「從哪天起才有」。

export type Period = "day" | "week" | "month";
export const PERIOD_NAMES: Record<Period, string> = { day: "日報", week: "週報", month: "月報" };

const DAY = 86400_000;
const WEEKDAY = ["日", "一", "二", "三", "四", "五", "六"];
const parse = (d: string) => Date.parse(`${d}T00:00:00Z`);
const addDays = (d: string, n: number) => new Date(parse(d) + n * DAY).toISOString().slice(0, 10);
const wd = (d: string) => WEEKDAY[new Date(parse(d)).getUTCDay()];
const isDate = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(parse(s));

interface Range {
  period: Period;
  from: string;
  to: string; // 這一期的最後一天（可能還沒到）
  end: string; // 實際算到哪天（今天還沒過完就是今天）
  partial: boolean;
  /** 算到今天（今天還沒過完，數字會一直長） */
  today: boolean;
  prevFrom: string;
  prevEnd: string; // 前一期取「同樣天數」比，還沒過完的一期才比得公平
  prevAnchor: string;
  nextAnchor: string | null;
  label: string;
  days: string[]; // from～end
  allDays: string[]; // from～to（圖表固定格數，還沒到的日子是空的）
}

/** anchor：這一期裡的任何一天（預設今天）。週＝週一到週日，月＝日曆月 */
export function resolveRange(period: Period, anchor?: string, now = new Date()): Range {
  const today = twDate(now.getTime());
  const a = isDate(anchor) && anchor <= today ? anchor : today;
  let from: string, to: string, prevFrom: string;
  if (period === "day") {
    from = to = a;
    prevFrom = addDays(a, -1);
  } else if (period === "week") {
    from = addDays(a, -((new Date(parse(a)).getUTCDay() + 6) % 7));
    to = addDays(from, 6);
    prevFrom = addDays(from, -7);
  } else {
    from = `${a.slice(0, 7)}-01`;
    const next = new Date(parse(from));
    next.setUTCMonth(next.getUTCMonth() + 1);
    to = addDays(next.toISOString().slice(0, 10), -1);
    const prev = new Date(parse(from));
    prev.setUTCMonth(prev.getUTCMonth() - 1);
    prevFrom = prev.toISOString().slice(0, 10);
  }
  const end = to > today ? today : to;
  const n = Math.round((parse(end) - parse(from)) / DAY) + 1;
  // 前一期：整期就整期比；還沒過完就取同樣天數（但不超過前一期本身，例如 3/31 不能去比 2/31）
  const prevLast = addDays(from, -1);
  const sameDays = addDays(prevFrom, n - 1);
  const prevEnd = to > end && sameDays < prevLast ? sameDays : prevLast;
  const nextFrom = addDays(to, 1);
  const days = Array.from({ length: n }, (_, i) => addDays(from, i));
  const allDays = Array.from({ length: Math.round((parse(to) - parse(from)) / DAY) + 1 }, (_, i) => addDays(from, i));
  const label =
    period === "day"
      ? `${from.slice(0, 4)}/${md(from)}（${wd(from)}）`
      : period === "week"
        ? `${md(from)}（一）– ${md(to)}（日）`
        : `${from.slice(0, 4)} 年 ${Number(from.slice(5, 7))} 月`;
  return { period, from, to, end, partial: to > end, today: end === today, allDays, prevFrom, prevEnd, prevAnchor: prevFrom, nextAnchor: nextFrom <= today ? nextFrom : null, label, days };
}

// ── 小工具 ──────────────────────────────────────────────────────────────
type Counts = Record<string, number>;
export type Entry = [string, number];
const inRange = (d: string, from: string, to: string) => d >= from && d <= to;
function merge(maps: (Counts | undefined)[]): Counts {
  const out: Counts = {};
  for (const m of maps) for (const [k, v] of Object.entries(m ?? {})) out[k] = (out[k] ?? 0) + v;
  return out;
}
export const top = (m: Counts, n = 10): Entry[] =>
  Object.entries(m)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, n);
const sum = (m: Counts) => Object.values(m).reduce((a, b) => a + b, 0);

/** 來源網域分類（週報 I10 的規則搬過來）。信件要比搜尋先判斷：Gmail App 的來源是 com.google.android.gm */
export function refKind(host: string): string {
  if (host.startsWith("ref:")) return "活動連結";
  if (/(^|\.)(mail\.[a-z.]+|outlook\.(live|office)\.com)$/.test(host) || host === "com.google.android.gm") return "信件";
  if (/(^|\.)(chatgpt\.com|openai\.com|perplexity\.ai|claude\.ai|gemini\.google\.com|copilot\.microsoft\.com|you\.com|phind\.com)$/.test(host)) return "AI";
  if (/(^|\.)(google\.[a-z.]+|bing\.com|duckduckgo\.com|yahoo\.[a-z.]+|baidu\.com|yandex\.[a-z.]+|ecosia\.org|naver\.com|search\.brave\.com|startpage\.com)$/.test(host)) return "搜尋";
  if (/(^|\.)(facebook\.com|fb\.me|instagram\.com|t\.co|x\.com|twitter\.com|linkedin\.com|lnkd\.in|threads\.(net|com)|reddit\.com|line\.me|youtube\.com|ptt\.cc|dcard\.tw|plurk\.com|bsky\.app|mastodon\.[a-z.]+)$/.test(host)) return "社群";
  if (/(^|\.)github\.(com|io)$/.test(host)) return "GitHub";
  return "其他網站";
}


// ── 報表 ────────────────────────────────────────────────────────────────
interface Totals3 {
  views: number;
  sessions: number;
  newVisitors: number;
}
export interface Report {
  range: Range;
  generatedAt: string;
  visitors: { cur: Totals3; prev: Totals3; byDay: ({ date: string } & Totals3)[]; hours: number[] | null };
  /** 逐日分類從哪天開始有（null＝這段期間都沒有） */
  detailSince: string | null;
  pages: Entry[];
  referrers: Entry[];
  refKinds: Entry[];
  direct: number | null;
  devices: Entry[];
  browsers: Entry[];
  os: Entry[];
  countries: Entry[];
  cloudflare: {
    cur: { uniques: number; pageViews: number; requests: number; cached: number; cachedOf: number; days: number };
    prev: { uniques: number; pageViews: number; requests: number };
    byDay: { date: string; uniques: number; pageViews: number; requests: number }[];
  } | null;
  raw: { cur: Counts; prev: Counts | null; names: Entry[]; since: string | null } | null;
  notFound: { total: number; scanners: number; paths: Entry[] } | null;
  uptime: { pct: number | null; checks: number; down: number; maint: number; byDay: { date: string; pct: number | null }[] };
  deploys: { ok: number; failed: number; rollback: number; avgSeconds: number | null; list: Deploy[] };
  restarts: RestartEvent[];
  boots: { time: string; text: string }[];
  jitter: { tunnelOnce: number; localFail: number };
  radar: { unique: number; peak: number; onlinePct: number | null; airlines: Entry[]; types: Entry[]; days: number } | null;
  delays: DelaySummary;
  hero: Entry[] | null;
  /** /go/<代號> 的點擊（E10）：站內推薦連結、外部連結有沒有人點 */
  go: Entry[] | null;
  vitals: { metric: string; p75: number; n: number }[] | null;
  /** 同上，只有手機的樣本（2026-11-27 起才分，樣本還少；TODO R2） */
  vitalsMobile: { metric: string; p75: number; n: number }[] | null;
  disk: { drive: string; freeGb: number; pct: number }[];
  changes: ChangelogEntry[];
  posts: { slug: string; title: string; date: string }[];
}

type RadarDay = { polls: number; online: number; peak: number; unique: number; airlines?: Counts; types?: Counts };
type RawDaily = Record<string, { total: number; browser: number; ai: number; search: number; bot: number; names: Counts }>;
type NotFoundData = { days: Record<string, Counts>; scanners?: Counts };

function diskFree(): Report["disk"] {
  const out: Report["disk"] = [];
  for (const drive of process.platform === "win32" ? ["C:", "D:"] : ["/"]) {
    try {
      const s = fs.statfsSync(process.platform === "win32" ? `${drive}\\` : drive);
      const total = s.blocks * s.bsize;
      const free = s.bavail * s.bsize;
      if (total > 0) out.push({ drive, freeGb: Math.round(free / 1024 ** 3), pct: Math.round((free / total) * 100) });
    } catch {}
  }
  return out;
}

/** watchdog.log 裡的開機紀錄跟「抖動」（失敗一次、下一輪就好） */
function watchdogExtras(from: string, to: string) {
  const boots: Report["boots"] = [];
  let tunnelOnce = 0;
  let localFail = 0;
  let raw = "";
  try {
    raw = fs.readFileSync(logFile("watchdog.log"), "utf8");
  } catch {}
  for (const line of raw.split(/\r?\n/)) {
    const m = /^﻿?\[([^\]]+)\]\s*(.*)$/.exec(line);
    if (!m) continue;
    const t = Date.parse(m[1]);
    if (Number.isNaN(t) || !inRange(twDate(t), from, to)) continue;
    const msg = m[2];
    if (msg.startsWith("[BOOT]")) boots.push({ time: m[1], text: (/（(.+?)）通知/.exec(msg)?.[1] ?? "開機").slice(0, 80) });
    else if (msg.includes("外網檢查失敗一次")) tunnelOnce++;
    else if (msg.includes("網站健康檢查失敗")) localFail++;
  }
  return { boots, tunnelOnce, localFail };
}

function webVitals(key = "/"): Report["vitals"] {
  const home = readVitals()[key];
  if (!home) return null;
  return ["LCP", "INP", "CLS", "FCP", "TTFB"].filter((k) => home[k]?.length).map((k) => ({ metric: k, p75: p75(home[k]), n: home[k].length }));
}

export function buildReport(range: Range, now = new Date()): Report {
  const { from, end, prevFrom, prevEnd } = range;

  // 真人訪客
  const detail = readDetail();
  const tot = (a: string, b: string): Totals3 => {
    const t = { views: 0, sessions: 0, newVisitors: 0 };
    for (const [d, c] of Object.entries(detail?.days ?? {})) if (inRange(d, a, b)) {
      t.views += c.views;
      t.sessions += c.sessions;
      t.newVisitors += c.newVisitors;
    }
    return t;
  };
  const byDay = range.allDays.map((date) => ({ date, ...(detail?.days[date] ?? { views: 0, sessions: 0, newVisitors: 0 }) }));
  const dd: DayDetail[] = Object.entries(detail?.daily ?? {})
    .filter(([d]) => inRange(d, from, end))
    .map(([, v]) => v);
  const detailSince = Object.keys(detail?.daily ?? {}).sort().find((d) => inRange(d, from, end)) ?? null;
  const hours = dd.length ? dd.reduce((acc, x) => acc.map((v, i) => v + (x.hours[i] ?? 0)), Array(24).fill(0) as number[]) : null;
  const refs = merge(dd.map((x) => x.referrers));
  const kinds: Counts = {};
  for (const [h, n] of Object.entries(refs)) kinds[refKind(h)] = (kinds[refKind(h)] ?? 0) + n;
  const cur = tot(from, end);
  // 直接進入＝工作階段 − 有來源的；逐日分類要涵蓋整段期間才算得準
  const direct = dd.length && detailSince === from ? Math.max(0, cur.sessions - sum(refs)) : null;

  // Cloudflare（UTC 日期）
  const cfDays = readCloudflareDays(130);
  const cfIn = (a: string, b: string) => cfDays.filter((r) => inRange(r.date, a, b));
  const cfCur = cfIn(from, end);
  const cloudflare = cfDays.some((r) => r.pageViews > 0)
    ? {
        cur: {
          uniques: cfCur.reduce((n, r) => n + r.uniques, 0),
          pageViews: cfCur.reduce((n, r) => n + r.pageViews, 0),
          requests: cfCur.reduce((n, r) => n + r.requests, 0),
          cached: cfCur.reduce((n, r) => n + (r.cachedRequests ?? 0), 0),
          cachedOf: cfCur.filter((r) => r.cachedRequests != null).reduce((n, r) => n + r.requests, 0),
          days: cfCur.filter((r) => r.requests > 0).length, // 0＝這段還沒抓到（UTC 日期、一小時抓一次）
        },
        prev: cfIn(prevFrom, prevEnd).reduce((t, r) => ({ uniques: t.uniques + r.uniques, pageViews: t.pageViews + r.pageViews, requests: t.requests + r.requests }), { uniques: 0, pageViews: 0, requests: 0 }),
        byDay: range.allDays.map((date) => cfDays.find((r) => r.date === date) ?? { date, uniques: 0, pageViews: 0, requests: 0 }),
      }
    : null;

  // 未過濾流量（server.js 每個頁面請求）
  // site-stats 的 readRawTraffic 只回累計，逐日要直接讀檔
  const rawData = readJsonFile<{ daily?: RawDaily }>(dataFile("RAW_TRAFFIC_FILE", "raw-traffic.json"));
  const daily = rawData?.daily ?? {};
  const rawSum = (a: string, b: string) => {
    const days = Object.entries(daily).filter(([d]) => inRange(d, a, b));
    if (!days.length) return null;
    const c: Counts = { total: 0, browser: 0, ai: 0, search: 0, bot: 0 };
    for (const [, v] of days) for (const k of Object.keys(c)) c[k] += v[k as keyof typeof v] as number;
    return c;
  };
  const rawCur = rawSum(from, end);
  const raw = rawCur
    ? {
        cur: rawCur,
        prev: rawSum(prevFrom, prevEnd),
        names: top(merge(Object.entries(daily).filter(([d]) => inRange(d, from, end)).map(([, v]) => v.names)), 12),
        since: Object.keys(daily).sort()[0] ?? null,
      }
    : null;

  // 404
  const nf = readJsonFile<NotFoundData>(dataFile("NOT_FOUND_FILE", "not-found.json"));
  const nfDays = Object.entries(nf?.days ?? {}).filter(([d]) => inRange(d, from, end));
  const nfPaths = merge(nfDays.map(([, v]) => v));
  const scanners = Object.entries(nf?.scanners ?? {}).filter(([d]) => inRange(d, from, end)).reduce((n, [, v]) => n + v, 0);
  const notFound = nf ? { total: sum(nfPaths), scanners, paths: top(nfPaths, 15) } : null;

  // 可用率、部署、重啟
  const up = readUptime(130).filter((d) => inRange(d.date, from, end));
  const checks = up.reduce((n, d) => n + d.checks, 0);
  const upOk = up.reduce((n, d) => n + d.up, 0);
  const deploysIn = readDeploys().filter((d) => inRange(twDate(Date.parse(d.start)), from, end));
  const secs = deploysIn.filter((d) => d.result === "ok" && d.seconds).map((d) => d.seconds!);
  const extras = watchdogExtras(from, end);

  // 雷達
  const radarState = readRadar(dataFile("RADAR_FILE", "radar.json")) as { days?: Record<string, RadarDay> } | null;
  const rDays = Object.entries(radarState?.days ?? {}).filter(([d]) => inRange(d, from, end)).map(([, v]) => v);
  const polls = rDays.reduce((n, d) => n + d.polls, 0);
  const radar = rDays.length
    ? {
        unique: rDays.reduce((n, d) => n + d.unique, 0),
        peak: Math.max(0, ...rDays.map((d) => d.peak)),
        onlinePct: polls ? Math.round((rDays.reduce((n, d) => n + d.online, 0) / polls) * 1000) / 10 : null,
        airlines: top(merge(rDays.map((d) => d.airlines)), 10).map(([k, n]): Entry => [AIRLINE_NAMES[k as keyof typeof AIRLINE_NAMES] ?? k, n]),
        types: top(merge(rDays.map((d) => d.types)), 8).map(([k, n]): Entry => [TYPE_NAMES[k as keyof typeof TYPE_NAMES] ?? k, n]),
        days: rDays.length,
      }
    : null;

  // 首頁 3D 版本
  const hs = readHeroStats();
  const heroDays = merge(Object.entries(hs?.days ?? {}).filter(([d]) => inRange(d, from, end)).map(([, v]) => v));
  const hero = Object.keys(heroDays).length
    ? top(heroDays, 10).map(([k, n]): Entry => [VARIANT_NAMES[k as HeroVariant] ?? k, n])
    : null;

  const go = readGoClicks(from, end);

  const minFlights = range.period === "day" ? 1 : range.period === "week" ? 2 : 4;

  return {
    range,
    generatedAt: now.toISOString(),
    visitors: { cur, prev: tot(prevFrom, prevEnd), byDay, hours },
    detailSince,
    pages: top(merge(dd.map((x) => x.pages)), 15),
    referrers: top(refs, 12),
    refKinds: top(kinds, 10),
    direct,
    devices: top(merge(dd.map((x) => x.devices)), 6),
    browsers: top(merge(dd.map((x) => x.browsers)), 8),
    os: top(merge(dd.map((x) => x.os)), 8),
    countries: top(merge(dd.map((x) => x.countries)), 12),
    cloudflare,
    raw,
    notFound,
    uptime: {
      pct: checks ? Math.round((upOk / checks) * 10000) / 100 : null,
      checks,
      down: checks - upOk,
      maint: up.reduce((n, d) => n + d.maint, 0),
      byDay: up.map((d) => ({ date: d.date, pct: d.checks ? Math.round((d.up / d.checks) * 1000) / 10 : null })),
    },
    deploys: {
      ok: deploysIn.filter((d) => d.result === "ok").length,
      failed: deploysIn.filter((d) => d.result === "failed").length,
      rollback: deploysIn.filter((d) => d.result === "rollback").length,
      avgSeconds: secs.length ? Math.round(secs.reduce((a, b) => a + b, 0) / secs.length) : null,
      list: deploysIn,
    },
    restarts: readRestarts().filter((r) => inRange(twDate(Date.parse(r.time)), from, end)),
    boots: extras.boots,
    jitter: { tunnelOnce: extras.tunnelOnce, localFail: extras.localFail },
    radar,
    delays: summarizeDelaysRange(readDelays(), from, end, 8, minFlights),
    hero,
    go,
    vitals: webVitals(),
    vitalsMobile: webVitals("/|m"),
    disk: diskFree(),
    changes: readChangelog().filter((c) => inRange(c.date, from, end)),
    posts: getAllPosts()
      .filter((p) => inRange(p.date.slice(0, 10), from, end))
      .map((p) => ({ slug: p.slug, title: p.title, date: p.date })),
  };
}

// ── 純文字版（寄信用）────────────────────────────────────────────────────
const N = (n: number) => nf.format(n);
export function delta(cur: number, prev: number): string {
  if (prev <= 0) return "";
  const p = Math.round(((cur - prev) / prev) * 100);
  return `（${p >= 0 ? "+" : ""}${p}%）`;
}
const list = (e: Entry[]) => e.map(([k, n]) => `${k} ${N(n)}`).join("、");
const RAW_NAMES: Record<string, string> = { browser: "瀏覽器", ai: "AI 爬蟲", search: "搜尋引擎", bot: "其他機器人" };

export function reportText(r: Report): string {
  const { range } = r;
  const L: string[] = [];
  const prevNote = range.partial ? "跟前一期同樣天數比" : "跟前一期比";
  L.push(`kbs0830.com ${PERIOD_NAMES[range.period]}：${range.label}${range.partial ? `（算到 ${md(range.end)}）` : ""}`);
  L.push(`括號是${prevNote}`);
  L.push("");

  const v = r.visitors;
  L.push("【真人訪客】（瀏覽器真的執行 JS、濾掉機器人跟站長自己）");
  L.push(`  瀏覽 ${N(v.cur.views)}${delta(v.cur.views, v.prev.views)}、造訪 ${N(v.cur.sessions)}${delta(v.cur.sessions, v.prev.sessions)}、新訪客 ${N(v.cur.newVisitors)}${delta(v.cur.newVisitors, v.prev.newVisitors)}`);
  if (range.period !== "day") L.push(`  每天：${v.byDay.filter((d) => d.date <= range.end).map((d) => `${md(d.date)} ${d.views}`).join("、")}`);
  if (r.detailSince && r.detailSince !== range.from) L.push(`  （下面的分類 ${md(r.detailSince)} 起才有逐日資料）`);
  if (r.pages.length) L.push(`  熱門頁面：${list(r.pages.slice(0, 10))}`);
  if (r.refKinds.length || r.direct != null) {
    const parts = r.direct != null ? [`直接進入 ${N(r.direct)}`, ...r.refKinds.map(([k, n]) => `${k} ${N(n)}`)] : r.refKinds.map(([k, n]) => `${k} ${N(n)}`);
    L.push(`  外部來源：${parts.join("、")}`);
  }
  if (r.referrers.length) L.push(`  來源網域：${list(r.referrers.slice(0, 8))}`);
  if (r.countries.length) L.push(`  國家：${list(r.countries)}`);
  if (r.devices.length) L.push(`  裝置：${list(r.devices)}；瀏覽器：${list(r.browsers.slice(0, 5))}；系統：${list(r.os.slice(0, 5))}`);
  const hrs = r.visitors.hours;
  if (hrs) {
    const peak = hrs.indexOf(Math.max(...hrs));
    if (hrs[peak] > 0) L.push(`  最多人的時段：${peak}:00–${peak}:59（${hrs[peak]} 次瀏覽）`);
  }
  L.push("");

  if (r.cloudflare && r.cloudflare.cur.days > 0) {
    const c = r.cloudflare;
    L.push(`【Cloudflare】（含機器人；UTC 日期）`);
    L.push(`  訪客 ${N(c.cur.uniques)}${delta(c.cur.uniques, c.prev.uniques)}、頁面瀏覽 ${N(c.cur.pageViews)}${delta(c.cur.pageViews, c.prev.pageViews)}、請求 ${N(c.cur.requests)}${delta(c.cur.requests, c.prev.requests)}`);
    if (c.cur.cachedOf > 0) L.push(`  快取命中率 ${((c.cur.cached / c.cur.cachedOf) * 100).toFixed(1)}%（${N(c.cur.cached)} / ${N(c.cur.cachedOf)}）`);
    L.push("");
  }
  if (r.raw) {
    const { cur, prev } = r.raw;
    L.push("【到達主機的頁面請求】（含爬蟲；快取命中的不算）");
    L.push(`  共 ${N(cur.total)}${prev ? delta(cur.total, prev.total) : ""}：${Object.entries(RAW_NAMES).map(([k, name]) => `${name} ${N(cur[k])}`).join("、")}`);
    if (r.raw.names.length) L.push(`  爬蟲：${list(r.raw.names)}`);
    L.push("");
  }
  if (r.notFound && (r.notFound.total || r.notFound.scanners)) {
    L.push(`【404】${N(r.notFound.total)} 次（掃描器亂試另外 ${N(r.notFound.scanners)} 次，不列）`);
    if (r.notFound.paths.length) L.push(`  ${list(r.notFound.paths.slice(0, 10))}`);
    L.push("");
  }
  if (r.go) {
    L.push(`【外部連結點擊（/go/）】${list(r.go)}`);
    L.push("");
  }
  if (r.hero) {
    L.push(`【首頁 3D 背景】${list(r.hero)}`);
    L.push("");
  }
  if (r.vitalsMobile?.length) {
    L.push(`【首頁 Web Vitals p75：手機】（2026-11-27 起才分手機，樣本還少）${r.vitalsMobile.map((x) => `${x.metric} ${x.p75}（n=${x.n}）`).join("、")}`);
  }
  if (r.vitals?.length) {
    L.push(`【首頁 Web Vitals p75】（最近的樣本，不分期間）${r.vitals.map((x) => `${x.metric} ${x.p75}（n=${x.n}）`).join("、")}`);
    L.push("  good：LCP ≤2500、INP ≤200、CLS ≤0.1");
    L.push("");
  }

  L.push("【維運】");
  const u = r.uptime;
  L.push(`  可用率 ${u.pct != null ? `${u.pct}%` : "—"}（${N(u.checks)} 次檢查、${u.down} 次失敗${u.maint ? `、維修 ${u.maint} 次` : ""}）`);
  const d = r.deploys;
  L.push(`  部署 成功 ${d.ok}、失敗 ${d.failed}、退回 ${d.rollback}${d.avgSeconds ? `；平均 ${d.avgSeconds} 秒` : ""}`);
  const autoFix = r.restarts.filter((x) => x.auto).length;
  L.push(`  watchdog 自動救回 ${autoFix} 次、要人處理 ${r.restarts.length - autoFix} 次；外網抖動 ${r.jitter.tunnelOnce} 次、本機健檢失敗 ${r.jitter.localFail} 次`);
  for (const b of r.boots) L.push(`  開機 ${b.time.slice(5, 16).replace("T", " ")}：${b.text}`);
  if (r.disk.length) L.push(`  磁碟（現在）：${r.disk.map((x) => `${x.drive} 剩 ${x.freeGb} GB（${x.pct}%）${x.pct < 10 ? " ⚠️" : ""}`).join("、")}`);
  L.push("");

  if (r.radar) {
    const x = r.radar;
    L.push(`【自家雷達】${N(x.unique)} 架次（每天平均 ${N(Math.round(x.unique / Math.max(1, x.days)))}）、最多同時 ${x.peak} 架、在線 ${x.onlinePct ?? "—"}%`);
    if (x.airlines.length) L.push(`  航空公司：${list(x.airlines.slice(0, 8))}`);
    if (x.types.length) L.push(`  機型：${list(x.types.slice(0, 6))}`);
    L.push("");
  }
  if (r.delays.flights > 0) {
    const x = r.delays;
    L.push(`【小港機場】${N(x.flights)} 班、準點率 ${x.onTimePct ?? "—"}%（晚 15 分鐘內）、取消 ${x.cancelled}`);
    if (x.worst.length) L.push(`  最常延誤：${x.worst.slice(0, 5).map((w) => `${w.code}${w.dir === "dep" ? "→" : "←"}${w.place} 平均晚 ${w.avgDelay} 分（${w.n} 班）`).join("、")}`);
    L.push("");
  }
  if (r.changes.length || r.posts.length) {
    L.push(`【網站更新】${r.changes.length} 項${r.posts.length ? `、新文章 ${r.posts.length} 篇` : ""}`);
    for (const p of r.posts) L.push(`  📝 ${p.title}`);
    for (const c of r.changes.slice(0, 15)) L.push(`  ・${md(c.date)} ${c.scope}：${c.text}`);
    if (r.changes.length > 15) L.push(`  …還有 ${r.changes.length - 15} 項`);
    L.push("");
  }
  L.push(`網頁版（要登入後台）：https://kbs0830.com/admin/reports?p=${range.period}&d=${range.from}`);
  return L.join("\n");
}
