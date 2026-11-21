import type { Metadata } from "next";
import Link from "next/link";
import { withShare } from "@/lib/share-meta";
import PageShell from "@/components/ui/PageShell";
import SectionHeading from "@/components/ui/SectionHeading";
import RouteMap from "@/components/ui/RouteMap";
import RadarStatus from "@/components/ui/RadarStatus";
import { AIRLINES, AIRPORTS, MOON_DISTANCE_KM, airportsByCountry, flightStats, routes, type Route } from "@/lib/flights";
import { formatFlightCode } from "@/lib/aircraft";

export const metadata: Metadata = withShare({
  title: "飛行紀錄 · Flight Log — PINGWEI LI",
  description: "航迷小筆記：搭過的航線、機場與航空公司。只記航班代碼跟起降機場，不記日期。",
  alternates: { canonical: "/flights", types: { "text/markdown": "/flights.md" } },
}, { ownImage: true });

const nf = new Intl.NumberFormat("zh-TW");
const TOP_ROUTES = 10; // 預設只列最常飛的前 10 條，其餘收在 <details>

function RouteList({ items }: { items: Route[] }) {
  return (
    <ul className="divide-y divide-(--border) border-y border-(--border)">
      {items.map((r) => (
        <li key={`${r.a}-${r.b}`} className="py-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-[15px] sm:text-sm text-(--text) font-light">
            {AIRPORTS[r.a].name} ↔ {AIRPORTS[r.b].name}
          </span>
          <span className="text-[11px] text-(--muted) font-mono">
            {r.a}–{r.b} · {nf.format(r.km)} km{r.count > 1 ? ` · ×${r.count}` : ""}
          </span>
          <span className="basis-full text-[11px] text-(--muted) font-mono">
            {r.codes.map(formatFlightCode).join(" · ")}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function FlightsPage() {
  const stats = flightStats();
  const allRoutes = routes();
  const usRoutes = allRoutes.filter((r) => AIRPORTS[r.a].country === "美國" || AIRPORTS[r.b].country === "美國");

  return (
    <PageShell
      eyebrow="Flight Log"
      title={<>飛行紀錄 &nbsp;·&nbsp; Flight Log</>}
      intro={
        <>
          航迷小筆記：搭過的航線、機場跟航空公司。只記航班代碼跟起降機場，不記日期。{" "}
          <Link href="/travel" className="text-(--accent) underline underline-offset-4 decoration-(--border) hover:decoration-(--accent)">
            在地球上看 →
          </Link>
        </>
      }
    >
      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-(--border) border border-(--border) rounded-sm overflow-hidden mb-3">
        {[
          [nf.format(stats.flights), "航班 · Flights"],
          [nf.format(stats.airports), "機場 · Airports"],
          [nf.format(stats.airlines.length), "航空公司 · Airlines"],
          [`${nf.format(stats.km)} km`, `約繞地球 ${stats.earthLaps.toFixed(1)} 圈`],
        ].map(([value, label]) => (
          <div key={label} className="bg-(--bg) px-4 py-4 flex flex-col-reverse">
            <dt className="text-[11px] text-(--muted) font-mono tracking-wide">{label}</dt>
            <dd className="text-xl font-light text-(--text) font-mono mb-1">{value}</dd>
          </div>
        ))}
      </dl>
      {/* 趣味換算（TODO B6）：地月平均距離 384,400 km */}
      <p className="text-xs text-(--muted) font-light mb-12">
        加起來大約是地球到月球距離的 {Math.round(stats.moonShare * 100)}%
        {stats.km < MOON_DISTANCE_KM ? `——再飛 ${nf.format(MOON_DISTANCE_KM - stats.km)} km 就到了。` : "，已經可以飛到月球了。"}
      </p>

      {/* 自家雷達：2026-11-21 從頁面最下面搬上來（使用者：「FR24 自架站點是一個特色」） */}
      <RadarStatus className="mb-12" />

      <section className="mb-12">
        <SectionHeading>航線圖 · Route Map</SectionHeading>
        <div className="border border-(--border) rounded-sm bg-(--surface) p-3 sm:p-5">
          <RouteMap />
        </div>
        {usRoutes.length > 0 && (
          <p className="text-xs text-(--muted) font-light mt-3">
            圖上沒畫的：
            {usRoutes.map((r) => `${AIRPORTS[r.a].name} ↔ ${AIRPORTS[r.b].name}`).join("、")}（美國，距離太遠）
          </p>
        )}
      </section>

      <section className="mb-12">
        <SectionHeading>航線 · Routes</SectionHeading>
        <RouteList items={allRoutes.slice(0, TOP_ROUTES)} />
        {allRoutes.length > TOP_ROUTES && (
          // 原生 <details>：零 JS、鍵盤可操作；::details-content 的展開動畫沿用 globals.css
          <details className="group">
            <summary className="cursor-pointer list-none py-3 text-xs text-(--muted) hover:text-(--accent) transition-colors font-mono">
              <span className="group-open:hidden">＋ 其他 {allRoutes.length - TOP_ROUTES} 條航線 · More</span>
              <span className="hidden group-open:inline">－ 收起 · Less</span>
            </summary>
            <RouteList items={allRoutes.slice(TOP_ROUTES)} />
          </details>
        )}
      </section>

      <section className="mb-12">
        <SectionHeading>機場 · Airports</SectionHeading>
        <div className="space-y-4">
          {airportsByCountry().map(([country, codes]) => (
            <div key={country} className="grid grid-cols-[4.5rem_1fr] gap-3">
              <p className="text-xs text-(--muted) pt-0.5">{country}</p>
              <p className="text-[15px] sm:text-sm text-(--text) font-light leading-relaxed">
                {codes.map((c) => (
                  <span key={c} className="inline-block mr-3">
                    {AIRPORTS[c].name}
                    <span className="text-[11px] text-(--muted) font-mono ml-1">{c}</span>
                  </span>
                ))}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionHeading>航空公司 · Airlines</SectionHeading>
        <ul className="grid sm:grid-cols-2 gap-x-8">
          {stats.airlines.map(([code, n]) => (
            <li key={code} className="flex items-baseline justify-between gap-3 py-2 border-b border-(--border)">
              <span className="text-[15px] sm:text-sm text-(--text) font-light">{AIRLINES[code] ?? code}</span>
              <span className="text-[11px] text-(--muted) font-mono shrink-0">{code} · {n}</span>
            </li>
          ))}
        </ul>
      </section>

      <Link href="/hotels" className="inline-block mt-12 py-3 -my-3 text-xs text-(--muted) hover:text-(--accent) transition-colors font-mono tracking-wide">
        住宿紀錄 · Hotel Log →
      </Link>
    </PageShell>
  );
}
