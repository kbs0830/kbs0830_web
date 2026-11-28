"use client";

import { useEffect, useState } from "react";
import { nf } from "@/lib/format";
import { useMediaQuery } from "@/lib/client/hooks";
import { BarChart } from "@/components/ui/StatCharts";

// 首頁作品卡「自架 FR24 雷達站」的大圖（TODO R6，2026-11-28）：作品頁已經是即時的 RadarSnapshot（M14），
// 首頁卡片卻還是舊截圖，兩邊對不起來。改成在截圖上面淡入一張即時小圖（現在幾架、今天幾架、一天的節奏）。
//   - 為什麼不在部署時截圖（原本的 A 案）：雷達數字每次都不一樣，截圖檔每次部署都會變 → 自動 commit 又觸發部署，停不下來
//   - 只在 640px 以上抓（手機版卡片不顯示大圖，只有小圖示），抓到之前、抓不到都留著原本的截圖，不會版面位移
//   - 隱私同 /radar：只有數字跟時段，沒有位置
type Snapshot = {
  configured: boolean;
  online?: boolean;
  aircraftNow?: number;
  today?: { unique: number };
  hours?: (number | null)[];
};

export default function RadarCardChart() {
  const wide = useMediaQuery("(width >= 640px)");
  const [d, setD] = useState<Snapshot | null>(null);

  useEffect(() => {
    if (!wide) return;
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/radar?hours=1", { signal: ctrl.signal });
        if (res.ok) setD((await res.json()) as Snapshot);
      } catch {
        // 抓不到就繼續顯示截圖
      }
    })();
    return () => ctrl.abort();
  }, [wide]);

  if (!d?.configured || !d.hours) return null;

  return (
    <div className="enter-fade absolute inset-0 flex flex-col bg-(--surface) px-7 pt-6 pb-4">
      <div className="flex items-baseline justify-between gap-4 text-xs font-mono text-(--muted)">
        <p className="flex items-center gap-2">
          <span aria-hidden className={`inline-block w-1.5 h-1.5 rounded-full ${d.online ? "bg-(--accent)" : "bg-(--border)"}`} />
          {d.online ? `收訊中 · 現在 ${nf.format(d.aircraftNow ?? 0)} 架` : "暫時離線 · Offline"}
        </p>
        <p>今天 {nf.format(d.today?.unique ?? 0)} 架</p>
      </div>
      {/* 長條圖吃掉剩下的高度（卡片寬度不同、16:9 的框高度也不同） */}
      <div className="flex-1 min-h-0 flex flex-col pt-4">
        <p className="text-[11px] text-(--accent) font-mono tracking-[0.15em] mb-2">一天的節奏 · Hourly</p>
        <div className="flex-1 min-h-0 [&>figure]:h-full [&>figure]:flex [&>figure]:flex-col [&_svg]:flex-1 [&_svg]:min-h-0">
        <BarChart
          label="每小時最多同時收到幾架飛機（近 7 天平均）"
          height="h-0"
          bars={d.hours.map((v, h) => ({ key: String(h), value: v ?? 0, title: `${h} 時` }))}
          caption={
            <>
              <span>0 時</span>
              <span>12 時</span>
              <span>23 時</span>
            </>
          }
        />
        </div>
      </div>
    </div>
  );
}
