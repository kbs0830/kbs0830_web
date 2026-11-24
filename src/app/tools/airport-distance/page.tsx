import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { withShare } from "@/lib/share-meta";
import PageShell from "@/components/ui/PageShell";
import AirportDistance from "@/components/tools/AirportDistance";
import ToolNote from "@/components/tools/ToolNote";
import { AIRPORTS } from "@/lib/flights";

// 機場距離／航程（TODO J5，2026-11-24）。我飛過的機場用中文名（lib/flights.ts），其他用 OurAirports 的英文城市名
export const metadata: Metadata = withShare({
  title: "機場距離計算：兩個機場代碼算飛行距離跟時間 · Airport Distance — PINGWEI LI",
  description: "輸入兩個三碼機場代碼（例如 TPE、FUK），算出大圓距離（公里、英里）跟大概要飛多久。全球約 3,200 個有定期航班的機場。",
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
      <Suspense fallback={<div className="min-h-[360px]" />}>
        <AirportDistance zh={zh} />
      </Suspense>
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
