import type { Metadata, Route } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { withShare } from "@/lib/site/share-meta";
import PageShell from "@/components/layout/PageShell";
import AirportDistance from "@/components/tools/AirportDistance";
import ToolNote from "@/components/tools/ToolNote";
import { AIRPORTS } from "@/lib/travel/flights";
import ToolJsonLd from "@/components/tools/ToolJsonLd";
import { DESTINATIONS, ORIGINS, routeSlug } from "@/lib/tools/popular-routes";

// 機場距離／航程（TODO J5，2026-11-24）。我飛過的機場用中文名（lib/travel/flights.ts），其他用 OurAirports 的英文城市名
export const metadata: Metadata = withShare({
  title: "機場飛行距離計算：台北到福岡飛多遠、要飛多久 · Airport Distance — PINGWEI LI",
  description: "機場距離計算：輸入兩個三碼機場代碼（例如 TPE、FUK），算出飛行距離（公里、英里）跟大概要飛多久。全球約 3,200 個有定期航班的機場。",
  alternates: { canonical: "/tools/airport-distance" },
});

const zh = Object.fromEntries(Object.entries(AIRPORTS).map(([code, a]) => [code, a.name]));

export default function AirportDistancePage() {
  return (
    <PageShell
      backHref="/tools"
      backLabel="返回小工具"
      eyebrow="Tools · Airport Distance"
      title={<>機場距離計算</>}
      intro="輸入兩個三碼機場代碼，算出兩地的大圓距離（地球表面最短的路線）跟大概要飛多久。網址會記住你查的航線。"
    >
      <ToolJsonLd href="/tools/airport-distance" />
      <Suspense fallback={<div className="min-h-[360px]" />}>
        <AirportDistance zh={zh} />
      </Suspense>
      {/* 熱門航線（TODO V3）：每條一頁，第一句就是答案；主工具頁列出來讓人（跟 Google）找得到 */}
      <section className="mt-16">
        <h2 className="mb-4 text-[11px] text-(--muted) font-mono tracking-[0.2em] uppercase">熱門航線 · Popular routes</h2>
        <div className="space-y-4">
          {ORIGINS.map((o) => (
            <div key={o.code}>
              <p className="text-sm font-light text-(--text) mb-1">{o.label} →</p>
              <ul className="flex flex-wrap gap-x-5 gap-y-0.5">
                {DESTINATIONS.map((d) => (
                  <li key={d.code}>
                    <Link
                      href={`/tools/airport-distance/${routeSlug(o.code, d.code)}` as Route}
                      className="inline-block py-1.5 text-sm font-light text-(--muted) hover:text-(--accent) transition-colors"
                    >
                      {d.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
      <ToolNote>
        <p>
          機場座標來自 OurAirports（公共領域的開放資料），只收有定期航班的大、中型機場。距離是球面近似；
          飛行時間用 800 km/h 加 30 分鐘起降粗估，實際會因為風向、航路差不少（往東飛通常比較快）。
        </p>
        <p>
          我自己搭過的航線畫在{" "}
          <Link href="/flights" className="text-(--accent) underline underline-offset-4 decoration-(--border) hover:decoration-(--accent)">
            飛行紀錄
          </Link>
          。
        </p>
      </ToolNote>
    </PageShell>
  );
}
