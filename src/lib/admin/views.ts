import "server-only";
import type { ViewModel } from "@/components/admin/AdminView";
import { ALERT_TAGS, DEPLOY_RESULT, MAIL_TAGS, nextReportTimes, readMailState, readWatchdog } from "@/lib/admin/data";
import { recentLogins } from "@/lib/admin/db";
import { VIA_LABEL } from "@/lib/admin/login-log";
import { piHealthLine } from "@/lib/admin/pi-health";
import { deploySeries, responseSeries } from "@/lib/admin/response-times";
import { readSiteFacts } from "@/lib/ops/colophon";
import { readServerErrors } from "@/lib/ops/server-errors";
import { readDeploys, readRestarts } from "@/lib/ops/status";
import { presenceCount } from "@/lib/stats/presence";
import { buildReport, resolveRange } from "@/lib/stats/reports";
import { pageTitle } from "@/lib/site/page-title";
import { nf, regionName, twDateTime } from "@/lib/format";

// 真後台各頁的資料（TODO G4 拆層，2026-11-26）：從 data/、logs/、資料庫讀出來，整理成 AdminView 吃的格式。
// 訪客參觀用的範例在 demo-data.ts，格式一樣。這裡的函式要在 await connection() 之後呼叫（讀檔、Date.now）。

const alertTone = (tag: string) => (tag === "FAILED" || tag === "WARN" ? "warn" : "ok") as "warn" | "ok";

export function overviewModel(now = new Date()): ViewModel {
  const facts = readSiteFacts(now.getTime());
  const today = buildReport(resolveRange("day", undefined, now), now);
  const last = readDeploys().find((d) => d.result !== "running");
  const alerts = readWatchdog().filter((l) => ALERT_TAGS.has(l.tag)).slice(0, 5);
  const next = nextReportTimes(now);
  const pi = piHealthLine(now.getTime());
  let logins: ReturnType<typeof recentLogins> = [];
  try {
    logins = recentLogins(8);
  } catch {}
  return {
    tiles: [
      { label: "今天訪客", value: nf.format(today.visitors.cur.sessions), tone: "info" },
      { label: "現在線上", value: nf.format(presenceCount()), tone: "info" },
      {
        label: "上次部署",
        value: last ? DEPLOY_RESULT[last.result] : "—",
        sub: last ? twDateTime(last.start) : undefined,
        tone: !last ? "muted" : last.result === "failed" || last.result === "rollback" ? "warn" : "ok",
      },
      {
        label: "自家雷達",
        value: facts.radar ? (facts.radar.online ? `在線・${facts.radar.aircraftNow} 架` : "離線") : "—",
        sub: pi?.text,
        tone: !facts.radar ? "muted" : facts.radar.online && !pi?.bad ? "ok" : "warn",
      },
      {
        label: "30 天可用率",
        value: facts.uptime30 === null ? "—" : `${(facts.uptime30 * 100).toFixed(2)}%`,
        tone: facts.uptime30 === null ? "muted" : facts.uptime30 >= 0.995 ? "ok" : "warn",
      },
      { label: "記憶體", value: `${facts.memoryMB} MB` },
      { label: "下一封週報", value: twDateTime(next.week) },
      { label: "下一封月報", value: twDateTime(next.month) },
    ],
    blocks: [
      {
        kind: "log",
        title: "最近的告警",
        en: "Alerts",
        rows: alerts.map((a) => ({ time: a.time, text: a.text, tone: alertTone(a.tag) })),
        empty: "最近沒有告警。",
      },
      {
        kind: "log",
        title: "登入紀錄",
        en: "Logins",
        limit: 4,
        empty: "還沒有紀錄。",
        rows: logins.map((l) => ({
          time: new Date(l.last_at).toISOString(),
          text: [
            VIA_LABEL[l.via],
            l.email,
            l.device,
            l.country ? regionName(l.country) : null,
            `${l.views} 頁`,
            l.first_at !== l.last_at ? `從 ${twDateTime(l.first_at)} 起` : null,
          ]
            .filter(Boolean)
            .join(" · "),
          tone: "ok" as const,
        })),
      },
    ],
  };
}

const KIND = { site: "網站", tunnel: "Tunnel", runner: "Runner" } as const;

export function opsModel(): ViewModel {
  const facts = readSiteFacts();
  const deploys = readDeploys().slice(0, 20);
  const restarts = readRestarts().slice(0, 10);
  const alerts = readWatchdog().filter((l) => ALERT_TAGS.has(l.tag)).slice(0, 30);
  const days = Math.floor(facts.processUptime / 86400);
  const resp = responseSeries();
  return {
    tiles: [
      { label: "線上 build 槽", value: facts.slot, tone: "info" },
      { label: "這次啟動多久", value: days > 0 ? `${days} 天` : `${Math.round(facts.processUptime / 3600)} 小時` },
      { label: "上次備份", value: facts.lastBackup ? twDateTime(facts.lastBackup) : "—", tone: facts.lastBackup ? "ok" : "warn" },
      { label: "90 天部署／退回", value: `${facts.deploys90}／${facts.rollbacks90}`, tone: facts.rollbacks90 > 0 ? "warn" : "ok" },
    ],
    blocks: [
      // 「是不是越來越慢」（TODO W4）：每天一點，部署花的秒數＋頁面回應 p95
      { kind: "series", title: "部署花的時間（每天中位數）", en: "Deploy seconds", unit: "秒", min: 0, points: deploySeries(readDeploys(), 60) },
      { kind: "series", title: "頁面回應時間 p95", en: "Response p95", unit: "ms", min: 0, warn: 500, points: resp.p95 },
      {
        kind: "log",
        title: "部署",
        en: "Deploys",
        limit: 6,
        rows: deploys.map((d) => ({
          time: d.start,
          text: `${DEPLOY_RESULT[d.result]}${d.seconds !== undefined ? `・${d.seconds} 秒` : ""}`,
          tone: d.result === "failed" || d.result === "rollback" ? "warn" : d.result === "running" ? undefined : "ok",
        })),
      },
      {
        kind: "log",
        title: "重啟紀錄",
        en: "Restarts",
        limit: 5,
        rows: restarts.map((r) => ({ time: r.time, text: `${KIND[r.kind]}・${r.auto ? "watchdog 自動救回" : "要人處理"}`, tone: r.auto ? "ok" : "warn" })),
      },
      {
        kind: "log",
        title: "最近的伺服器錯誤",
        en: "Server errors",
        limit: 5,
        empty: "最近沒有伺服器端錯誤。",
        rows: readServerErrors(20).map((e) => ({ time: e.t, text: `${e.kind} ${e.method} ${e.path}：${e.message}`, tone: "warn" as const })),
      },
      {
        kind: "log",
        title: "watchdog 告警",
        en: "Watchdog",
        limit: 6,
        rows: alerts.map((a) => ({ time: a.time, text: a.text, tone: alertTone(a.tag) })),
      },
    ],
  };
}

export function mailModel(): ViewModel {
  const state = readMailState();
  const next = nextReportTimes();
  const history = readWatchdog()
    .filter((l) => MAIL_TAGS.has(l.tag) || (l.tag === "WARN" && /週報|月報/.test(l.text)))
    .slice(0, 20);
  return {
    tiles: [
      { label: "最後寄出的週報", value: state?.week ?? "—", tone: state?.week ? "ok" : "muted" },
      { label: "最後寄出的月報", value: state?.month ?? "—", tone: state?.month ? "ok" : "muted" },
      { label: "下一封週報", value: twDateTime(next.week), tone: "info" },
      { label: "下一封月報", value: twDateTime(next.month), tone: "info" },
    ],
    blocks: [
      {
        kind: "log",
        title: "寄送紀錄",
        en: "History",
        limit: 8,
        rows: history.map((h) => ({ time: h.time, text: h.text, tone: h.tag === "WARN" ? "warn" : "ok" })),
      },
    ],
  };
}

const RAW: Record<string, string> = { browser: "瀏覽器", ai: "AI 爬蟲", search: "搜尋引擎", bot: "其他機器人" };

export function trafficModel(now = new Date()): ViewModel {
  const r = buildReport(resolveRange("week", undefined, now), now);
  const rawEntries: [string, number][] = r.raw ? Object.entries(RAW).map(([k, name]) => [name, r.raw!.cur[k] ?? 0]) : [];
  const rawTotal = rawEntries.reduce((n, [, v]) => n + v, 0);
  const sum = (e: [string, number][]) => e.reduce((n, [, v]) => n + v, 0);
  const blocks: ViewModel["blocks"] = [];
  if (r.raw) {
    blocks.push({
      kind: "share",
      title: "誰在打網站",
      en: "Raw traffic",
      entries: rawEntries,
      total: rawTotal,
      note: r.raw.names.length ? `機器人前幾名：${r.raw.names.slice(0, 8).map(([n, v]) => `${n} ${nf.format(v)}`).join("、")}` : undefined,
    });
  }
  blocks.push(
    { kind: "share", title: "熱門頁面", en: "Pages", entries: r.pages.slice(0, 10).map(([p, v]) => [pageTitle(p), v]), total: sum(r.pages) },
    { kind: "share", title: "來源", en: "Referrers", entries: r.refKinds, total: sum(r.refKinds) },
  );
  if (r.notFound && r.notFound.paths.length > 0) {
    blocks.push({
      kind: "share",
      title: "404 網址",
      en: "Not found",
      entries: r.notFound.paths.slice(0, 15),
      total: r.notFound.total,
      note: `其中掃描器（找 .env、wp-admin 這類）${nf.format(r.notFound.scanners)} 次。`,
    });
  }
  return {
    tiles: [
      { label: "真人造訪", value: nf.format(r.visitors.cur.sessions), tone: "info" },
      { label: "瀏覽頁數", value: nf.format(r.visitors.cur.views), tone: "info" },
      { label: "全部請求（含機器人）", value: nf.format(rawTotal) },
      { label: "404", value: nf.format(r.notFound?.total ?? 0), tone: (r.notFound?.total ?? 0) > 0 ? "warn" : "ok" },
    ],
    blocks,
  };
}
