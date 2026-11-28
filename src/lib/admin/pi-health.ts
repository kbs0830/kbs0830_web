import "server-only";
import type { ViewModel, ViewTile } from "@/components/admin/AdminView";
import { dataFile, readJsonFile } from "@/lib/data-file";
import { twDateTime } from "@/lib/format";

// 自家雷達樹莓派的健康（2026-11-26，使用者：「後台可以看到派的記憶體、溫度、使用率，做一個監督派的分頁，溫度太高或其他問題要發 Gmail 給我」）。
// scripts/lib/radar-health.js 每 15 分鐘 SSH 讀一次寫成 data/radar-health.json（含 24 小時歷史、告警清單）→ /admin/pi。
// 告警信由 watchdog.ps1 讀同一個檔案的 problems 寄出；這裡的顏色門檻跟那邊一致：溫度 70 黃（75 寄信）、空間 85 黃（90 寄信）。

type Flags = { undervoltage: boolean; capped: boolean; throttled: boolean; softTemp: boolean };
type Health = {
  uptimeS: number | null;
  throttled: { raw: string; now: Flags; since: Flags } | null;
  tempC: number | null;
  diskPct: number | null;
  readOnly: boolean | null;
  ioErrors: number | null;
  fsState: string | null;
  lifetimeWrites: string | null;
  memAvailMB: number | null;
  wifiDbm: number | null;
  sd: { name: string; date: string | null } | null;
  feedActive: boolean | null;
  cpuPct?: number | null;
  load?: number[] | null;
  cores?: number | null;
  memTotalMB?: number | null;
  swapUsedMB?: number | null;
  clockMHz?: number | null;
  coreVolt?: number | null;
  diskUsedMB?: number | null;
  diskSizeMB?: number | null;
  model?: string | null;
  os?: string | null;
  kernel?: string | null;
};
type Problem = { key: string; active: boolean; subject: string };
type HealthFile = {
  checkedAt: number;
  ok: boolean;
  error: string | null;
  lastOkAt: number | null;
  health: Health | null;
  maxTemp24h: number | null;
  history?: { t: number; c: number | null; cpu?: number | null; mem?: number | null }[];
  problems?: Problem[];
};

const STALE_MS = 35 * 60_000; // 每 15 分鐘讀一次，漏一次不算
const TEMP_WARN = 70;

const uptimeText = (s: number) => (s >= 86400 ? `${Math.floor(s / 86400)} 天` : s >= 3600 ? `${Math.floor(s / 3600)} 小時` : `${Math.max(1, Math.floor(s / 60))} 分鐘`);
const gb = (mb: number) => `${(mb / 1024).toFixed(1)} GB`;

export const readPiHealth = () => readJsonFile<HealthFile>(dataFile("RADAR_HEALTH_FILE", "radar-health.json"));

/** 總覽頁「自家雷達」磚塊底下的一行：樹莓派溫度＋有沒有問題 */
export function piHealthLine(now = Date.now()): { text: string; bad: boolean } | null {
  const f = readPiHealth();
  if (!f?.health) return null;
  if (!f.ok || now - f.checkedAt > STALE_MS) return { text: "樹莓派讀不到", bad: true };
  const active = (f.problems ?? []).filter((p) => p.active);
  return { text: active.length ? `樹莓派 ${active.length} 個問題` : `樹莓派 ${f.health.tempC ?? "—"}°C`, bad: active.length > 0 };
}

function tiles(f: HealthFile, now: number): ViewTile[] {
  const h = f.health;
  const stale = !f.ok || now - f.checkedAt > STALE_MS;
  const reach: ViewTile = {
    label: "狀態",
    value: stale ? "讀不到" : h?.feedActive === false ? "fr24feed 停了" : `開機 ${uptimeText(h?.uptimeS ?? 0)}`,
    sub: stale ? `${f.error ?? "太久沒更新"}・最後成功 ${f.lastOkAt ? twDateTime(f.lastOkAt) : "—"}` : `更新 ${twDateTime(f.checkedAt)}`,
    tone: stale || h?.feedActive === false ? "warn" : "ok",
  };
  if (!h) return [reach];

  const t = h.throttled;
  const nowBad = t && (t.now.undervoltage || t.now.throttled || t.now.capped || t.now.softTemp);
  const sinceBad = t && (t.since.undervoltage || t.since.throttled || t.since.capped || t.since.softTemp);
  const memUsed = h.memTotalMB && h.memAvailMB != null ? h.memTotalMB - h.memAvailMB : null;
  const sdBad = h.readOnly === true || (h.ioErrors ?? 0) > 0 || (h.fsState != null && h.fsState !== "clean");

  return [
    reach,
    {
      label: "溫度",
      value: h.tempC == null ? "—" : `${h.tempC.toFixed(1)}°C`,
      sub: f.maxTemp24h != null ? `24 小時最高 ${f.maxTemp24h.toFixed(1)}°C` : undefined,
      tone: h.tempC == null ? "muted" : h.tempC >= TEMP_WARN ? "warn" : "ok",
    },
    {
      label: "CPU 使用率",
      value: h.cpuPct == null ? "—" : `${h.cpuPct}%`,
      sub: h.load ? `負載 ${h.load.map((l) => l.toFixed(2)).join(" / ")}${h.cores ? `（${h.cores} 核）` : ""}` : undefined,
      tone: h.cpuPct == null ? "muted" : h.cpuPct >= 90 ? "warn" : "info",
    },
    {
      label: "記憶體",
      value: memUsed != null && h.memTotalMB ? `${Math.round((memUsed / h.memTotalMB) * 100)}%` : "—",
      sub: memUsed != null && h.memTotalMB ? `用 ${memUsed}／${h.memTotalMB} MB${h.swapUsedMB ? `・swap ${h.swapUsedMB} MB` : ""}` : undefined,
      tone: h.memAvailMB == null ? "muted" : h.memAvailMB < 80 ? "warn" : "info",
    },
    {
      label: "供電",
      value: !t ? "—" : t.now.undervoltage ? "現在電壓不足" : nowBad ? "降頻中" : t.since.undervoltage ? "開機後曾欠壓" : sinceBad ? "開機後曾降頻" : "正常",
      sub: [t ? `get_throttled ${t.raw}` : null, h.coreVolt ? `核心 ${h.coreVolt.toFixed(2)} V` : null].filter(Boolean).join("・") || undefined,
      tone: !t ? "muted" : nowBad || sinceBad ? "warn" : "ok",
    },
    {
      label: "記憶卡",
      value: h.readOnly ? "變成唯讀" : (h.ioErrors ?? 0) > 0 ? `${h.ioErrors} 個讀寫錯誤` : h.fsState && h.fsState !== "clean" ? `檔案系統 ${h.fsState}` : "正常",
      sub: [h.fsState ? `檔案系統 ${h.fsState}` : null, h.lifetimeWrites ? `累計寫入 ${h.lifetimeWrites}` : null].filter(Boolean).join("・") || undefined,
      tone: sdBad ? "warn" : "ok",
    },
    {
      label: "儲存空間",
      value: h.diskPct == null ? "—" : `${h.diskPct}%`,
      sub: h.diskUsedMB != null && h.diskSizeMB ? `用 ${gb(h.diskUsedMB)}／${gb(h.diskSizeMB)}` : undefined,
      tone: h.diskPct == null ? "muted" : h.diskPct >= 85 ? "warn" : "info",
    },
    {
      label: "Wi-Fi 訊號",
      value: h.wifiDbm == null ? "—" : `${h.wifiDbm} dBm`,
      sub: h.wifiDbm == null ? undefined : h.wifiDbm >= -60 ? "好" : h.wifiDbm >= -70 ? "普通" : "偏弱",
      tone: h.wifiDbm == null ? "muted" : h.wifiDbm < -75 ? "warn" : "info",
    },
  ];
}

export function piModel(now = Date.now()): ViewModel {
  const f = readPiHealth();
  if (!f) return { tiles: [{ label: "狀態", value: "沒有資料", sub: "server.js 還沒讀過樹莓派（RADAR_HOST、SSH 金鑰）", tone: "muted" }], blocks: [] };
  const h = f.health;
  const hist = f.history ?? [];
  const active = (f.problems ?? []).filter((p) => p.active);
  return {
    tiles: tiles(f, now),
    blocks: [
      {
        kind: "log",
        title: "現在的問題",
        en: "Alerts",
        empty: "沒有問題。溫度 75°C 以上、供電不足、記憶卡錯誤、空間 90% 以上、記憶體剩不到 80 MB、SSH 一小時連不上，會寄信通知。",
        rows: active.map((p) => ({ time: new Date(f.checkedAt).toISOString(), text: p.subject, tone: "warn" as const })),
      },
      { kind: "series", title: "溫度", en: "Temperature", unit: "°C", warn: 75, min: 30, max: 85, points: hist.map((p) => [p.t, p.c] as [number, number | null]) },
      { kind: "series", title: "CPU 使用率", en: "CPU", unit: "%", min: 0, max: 100, points: hist.map((p) => [p.t, p.cpu ?? null] as [number, number | null]) },
      { kind: "series", title: "記憶體使用率", en: "Memory", unit: "%", min: 0, max: 100, points: hist.map((p) => [p.t, p.mem ?? null] as [number, number | null]) },
      {
        kind: "facts",
        title: "硬體與系統",
        en: "System",
        rows: [
          ["型號", h?.model ?? "—"],
          ["系統", [h?.os, h?.kernel].filter(Boolean).join("・") || "—"],
          ["CPU 時脈", h?.clockMHz ? `${h.clockMHz} MHz` : "—"],
          ["記憶卡", h?.sd ? `${h.sd.name}${h.sd.date ? `（製造 ${h.sd.date}）` : ""}` : "—"],
          ["接收程式", h?.feedActive == null ? "—" : h.feedActive ? "fr24feed 執行中" : "fr24feed 停了"],
          ["多久讀一次", "每 15 分鐘（SSH，唯讀）"],
        ],
      },
    ],
  };
}
