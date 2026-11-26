"use client";

import Link from "next/link";
import { nf } from "@/lib/format";
import { useJson } from "@/lib/client/hooks";
import { BarChart, Tiles } from "@/components/ui/StatCharts";

// 「自架 FR24 雷達站」作品頁的首圖（TODO M14，2026-11-26 使用者選 A）：原本是一張雷達頁的截圖，
// 上面被裁掉一截、字小到讀不到。改成直接放真的數字跟「一天的節奏」長條圖，每次打開都是現在的資料。
// 作品頁是 ensureStatic（不存在的網址才會 404）的完全靜態頁，不能在 server 串流即時資料 → 由瀏覽器抓 /api/radar?hours=1。
// 載入前先佔好同樣的高度（不會版面位移）；抓不到就整塊收掉。隱私同 /radar：只有數字跟時段。

type Snapshot = {
  configured: boolean;
  online?: boolean;
  aircraftNow?: number;
  today?: { unique: number; peak: number };
  week?: { unique: number; uptime: number | null };
  hours?: (number | null)[];
};

export default function RadarSnapshot() {
  const d = useJson<Snapshot>("/api/radar?hours=1");
  if (d === "error" || (d && (!d.configured || !d.hours))) return null;

  return (
    <div className="mb-10 border border-(--border) rounded-sm bg-(--bg) p-5 sm:p-7 min-h-[20rem]" aria-busy={!d}>
      <div className="flex items-baseline justify-between gap-4 mb-5">
        <p className="flex items-center gap-2 text-xs font-mono text-(--muted)">
          <span aria-hidden className={`inline-block w-1.5 h-1.5 rounded-full ${d?.online ? "bg-(--accent)" : "bg-(--border)"}`} />
          {!d ? "讀取中…" : d.online ? `收訊中 · 現在 ${nf.format(d.aircraftNow ?? 0)} 架` : "暫時離線 · Offline"}
        </p>
        <Link href="/radar" className="text-xs font-mono text-(--accent) hover:underline underline-offset-4 py-1 -my-1">
          即時狀態 →
        </Link>
      </div>
      {d && d.hours ? (
        <>
          {/* Tiles 本身 mb-12 是給整頁用的，框框裡收小一點 */}
          <div className="[&>dl]:mb-8">
          <Tiles
            idPrefix="snap"
            items={[
              [`${nf.format(d.today?.unique ?? 0)} 架`, "今天收到 · Today"],
              [`${nf.format(d.today?.peak ?? 0)} 架`, "今天最多同時 · Peak"],
              [`${nf.format(d.week?.unique ?? 0)} 架次`, "近 7 天 · 7 days", "每天收到幾架不同的飛機，7 天加起來。同一架飛機隔天又飛過會再算一次，所以叫「架次」。"],
              [d.week?.uptime != null ? `${d.week.uptime}%` : "–", "在線率 · Uptime", "網站每 30 秒問一次接收器，近 7 天裡有回應、而且有在接收訊號的比例。"],
            ]}
          />
          </div>
          <p className="text-xs text-(--accent) font-mono tracking-[0.15em] mb-3">一天的節奏 · Hourly</p>
          <BarChart
            label="每小時最多同時收到幾架飛機（近 7 天平均）"
            height="h-28 sm:h-36"
            bars={d.hours.map((v, h) => ({
              key: String(h),
              value: v ?? 0,
              title: v == null ? `${h} 時：還沒有資料` : `${h} 時：平均最多同時 ${v} 架`,
            }))}
            caption={
              <>
                <span>0 時</span>
                <span>6 時</span>
                <span>12 時</span>
                <span>18 時</span>
                <span>23 時</span>
              </>
            }
          />
        </>
      ) : null}
    </div>
  );
}
