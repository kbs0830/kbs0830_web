import "server-only";
import type { ViewTile } from "@/components/admin/AdminView";
import { dataFile, readJsonFile } from "@/lib/data-file";
import { twDateTime } from "@/lib/format";

// 自家雷達樹莓派的健康（2026-11-26，scripts/lib/radar-health.js 每 5 分鐘 SSH 讀一次寫成 data/radar-health.json）→ /admin/ops 的磚塊。
// 門檻：Pi 3B 到 80°C 開始降頻，70 以上就標黃；get_throttled 的「現在」位元有任何一個＝黃；「開機後曾經欠壓」也標黃（11/23 斷線就是供電不足）。

type Throttled = {
  raw: string;
  now: { undervoltage: boolean; capped: boolean; throttled: boolean; softTemp: boolean };
  since: { undervoltage: boolean; capped: boolean; throttled: boolean; softTemp: boolean };
};
type Health = {
  uptimeS: number | null;
  throttled: Throttled | null;
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
};
type HealthFile = { checkedAt: number; ok: boolean; error: string | null; lastOkAt: number | null; health: Health | null; maxTemp24h: number | null };

const STALE_MS = 15 * 60_000;
const TEMP_WARN = 70;

const uptimeText = (s: number) => (s >= 86400 ? `${Math.floor(s / 86400)} 天` : s >= 3600 ? `${Math.floor(s / 3600)} 小時` : `${Math.max(1, Math.floor(s / 60))} 分鐘`);

/** 回傳 null＝沒設定（沒有資料檔），後台就不顯示這組 */
export function piHealthTiles(now = Date.now()): ViewTile[] | null {
  const f = readJsonFile<HealthFile>(dataFile("RADAR_HEALTH_FILE", "radar-health.json"));
  if (!f) return null;
  const h = f.health;
  const stale = !f.ok || now - f.checkedAt > STALE_MS;
  const reach: ViewTile = {
    label: "樹莓派",
    value: stale ? "讀不到" : h?.feedActive === false ? "fr24feed 停了" : `開機 ${uptimeText(h?.uptimeS ?? 0)}`,
    sub: stale ? `${f.error ?? "太久沒更新"}・最後成功 ${f.lastOkAt ? twDateTime(f.lastOkAt) : "—"}` : h?.wifiDbm != null ? `Wi-Fi ${h.wifiDbm} dBm` : undefined,
    tone: stale || h?.feedActive === false ? "warn" : "ok",
  };
  if (!h) return [reach];

  const t = h.throttled;
  const nowBad = t && (t.now.undervoltage || t.now.throttled || t.now.capped || t.now.softTemp);
  const sinceBad = t && (t.since.undervoltage || t.since.throttled || t.since.capped || t.since.softTemp);
  const power: ViewTile = {
    label: "供電",
    value: !t ? "—" : t.now.undervoltage ? "現在電壓不足" : nowBad ? "降頻中" : t.since.undervoltage ? "開機後曾欠壓" : sinceBad ? "開機後曾降頻" : "正常",
    sub: t ? `get_throttled ${t.raw}` : undefined,
    tone: !t ? "muted" : nowBad || sinceBad ? "warn" : "ok",
  };

  const temp: ViewTile = {
    label: "樹莓派溫度",
    value: h.tempC == null ? "—" : `${h.tempC.toFixed(1)}°C`,
    sub: f.maxTemp24h != null ? `24 小時最高 ${f.maxTemp24h.toFixed(1)}°C` : undefined,
    tone: h.tempC == null ? "muted" : h.tempC >= TEMP_WARN || (f.maxTemp24h ?? 0) >= 80 ? "warn" : "ok",
  };

  const sdBad = h.readOnly === true || (h.ioErrors ?? 0) > 0 || (h.fsState != null && h.fsState !== "clean");
  const sd: ViewTile = {
    label: "記憶卡",
    value: h.readOnly ? "變成唯讀" : (h.ioErrors ?? 0) > 0 ? `${h.ioErrors} 個讀寫錯誤` : h.fsState && h.fsState !== "clean" ? `檔案系統 ${h.fsState}` : `正常・用了 ${h.diskPct ?? "—"}%`,
    sub: [h.sd ? `${h.sd.name}${h.sd.date ? `（${h.sd.date}）` : ""}` : null, h.lifetimeWrites ? `累計寫入 ${h.lifetimeWrites}` : null].filter(Boolean).join("・") || undefined,
    tone: sdBad || (h.diskPct ?? 0) >= 85 ? "warn" : "ok",
  };

  return [reach, power, temp, sd];
}
