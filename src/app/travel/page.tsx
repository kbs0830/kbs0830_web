import type { Metadata } from "next";
import Link from "next/link";
import { withShare } from "@/lib/site/share-meta";
import PageShell from "@/components/layout/PageShell";
import { Tiles } from "@/components/ui/StatCharts";
import TravelGlobe from "@/components/canvas/TravelGlobe";
import { travelArcs, travelPlaces, travelStats } from "@/lib/travel/travel";
import { nf } from "@/lib/format";

// 旅行地球（TODO A5，2026-11-21）：飛行紀錄＋住宿紀錄放在同一顆地球上。/flights、/hotels 照舊（明細在那兩頁）。
// 地球是 client（Canvas 2D），資料 build 時就算好傳進去；靜態頁，有 Markdown 版。
export const metadata: Metadata = withShare(
  {
    title: "旅行地球 · Travel — PINGWEI LI",
    description: "搭過的航線跟住過的城市，畫在同一顆可以轉的地球上。只記機場跟城市，不記日期。",
    alternates: { canonical: "/travel", types: { "text/markdown": "/travel.md" } },
  },
  { ownImage: true },
);

const link = "text-(--accent) underline underline-offset-4 decoration-(--border) hover:decoration-(--accent)";

export default function TravelPage() {
  const s = travelStats();
  return (
    <PageShell
      eyebrow="Travel"
      title={<>旅行地球 &nbsp;·&nbsp; Travel</>}
      intro="飛行紀錄跟住宿紀錄放在同一顆地球上：線是搭過的航線，點是去過的地方，越大的點住過越多間。只記機場跟城市，不記日期。"
    >
      <Tiles
        items={[
          [nf.format(s.flights), "航班 · Flights"],
          [`${nf.format(s.km)} km`, "總飛行距離"],
          [nf.format(s.hotels), "住過的飯店"],
          [`${s.places} / ${s.countries}`, "地點 / 國家地區"],
        ]}
      />
      <TravelGlobe places={travelPlaces()} arcs={travelArcs()} />
      <p className="text-xs text-(--muted) font-light mt-10 leading-relaxed">
        明細：
        <Link href="/flights" className={link}>
          飛行紀錄
        </Link>
        （航線、機場、航空公司）·{" "}
        <Link href="/hotels" className={link}>
          住宿紀錄
        </Link>
        （飯店、會籍）
      </p>
    </PageShell>
  );
}
