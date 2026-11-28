import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { dataFile } from "@/lib/data-file";
import PageShell from "@/components/layout/PageShell";
import LoadingBlock from "@/components/ui/LoadingBlock";
import { CARDS, CardSvg, type CardStats } from "@/components/live/RadarCards";
import CardDownload from "@/components/live/CardDownload";
import { detail, readState } from "../../../../scripts/lib/radar.js";

// 直播／社群用的圖卡（縮圖、方形貼文、限動、統計卡、頭像、直播等待畫面），數字用 /radar 頁公開的統計即時畫出來，每張可下載 PNG。
// 站長用的工具頁：不收錄（noindex）、不進 sitemap。圖上的飛機位置是示意，不是真實航班。
export const metadata: Metadata = {
  title: "圖卡 · Cards — PINGWEI LI",
  robots: { index: false, follow: false },
};

const radarFile = () => dataFile("RADAR_FILE", "radar.json");
// Date.now() 放在元件外面（React purity 規則）
const loadStats = (): CardStats | null => {
  const d = detail(readState(radarFile()), Date.now());
  if (!("daily" in d)) return null;
  return {
    today: { unique: d.today?.unique ?? 0, peak: d.today?.peak ?? 0, airlines: (d.today?.airlines ?? []).map((a: { name: string; n: number }) => ({ name: a.name, n: a.n })) },
    hours: d.hours ?? [],
    types: (d.weekTypes ?? []).map((t: { name: string; n: number }) => ({ name: t.name, n: t.n })),
    total: d.total ?? { unique: 0, peak: 0, days: 0 },
  };
};

async function Cards() {
  await connection(); // 即時統計：不加這行 build 時會凍結
  const stats = loadStats();
  if (!stats) return <p className="text-sm text-(--muted) font-light">雷達資料暫時讀不到，晚點再來。</p>;
  return (
    <div className="grid gap-10">
      {CARDS.map((c) => (
        <section key={c.id}>
          <div className="mb-3 flex items-center justify-between gap-4">
            <h2 className="text-base font-light">{c.title}</h2>
            <CardDownload svgId={`card-${c.id}`} file={c.file} width={c.w} height={c.h} />
          </div>
          <div className="overflow-hidden rounded-sm border border-(--border)" style={{ maxWidth: c.h > c.w ? 420 : "100%" }}>
            <CardSvg card={c} stats={stats} />
          </div>
        </section>
      ))}
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <PageShell backHref="/radar" backLabel="返回自家雷達" eyebrow="Cards" title={<>圖卡 &nbsp;·&nbsp; Cards</>} intro="直播和社群用的圖卡，數字是網站目前的統計。按「下載 PNG」存檔；圖上的飛機位置是示意，不是真實航班。">
      {children}
    </PageShell>
  );
}

export default function CardsPage() {
  return (
    <Suspense
      fallback={
        <Shell>
          <LoadingBlock label="畫圖卡中…" minHeight={800} />
        </Shell>
      }
    >
      <Shell>
        <Cards />
      </Shell>
    </Suspense>
  );
}
