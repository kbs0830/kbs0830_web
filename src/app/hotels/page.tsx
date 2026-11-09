import type { Metadata } from "next";
import Link from "next/link";
import { withShare } from "@/lib/share-meta";
import PageShell from "@/components/ui/PageShell";
import SectionHeading from "@/components/ui/SectionHeading";
import HotelMap from "@/components/ui/HotelMap";
import { GROUP_NAMES, hotelStats, hotelsByPlace, membershipsByKind } from "@/lib/hotels";

export const metadata: Metadata = withShare({
  title: "住宿紀錄 · Hotel Log — PINGWEI LI",
  description: "住過的飯店、城市與飯店集團。只記名稱跟城市，不記日期。",
  alternates: { canonical: "/hotels", types: { "text/markdown": "/hotels.md" } },
});

const nf = new Intl.NumberFormat("zh-TW");

export default function HotelsPage() {
  const stats = hotelStats();
  const places = hotelsByPlace();
  const memberships = membershipsByKind();
  const outside = places.filter(([country]) => country === "美國");
  const [topGroup, topCount] = stats.groups[0];

  return (
    <PageShell
      eyebrow="Hotel Log"
      title={<>住宿紀錄 &nbsp;·&nbsp; Hotel Log</>}
      intro="跟飛行紀錄同一本筆記：住過的飯店、城市跟飯店集團。只記名稱跟城市，不記日期。"
    >
      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-(--border) border border-(--border) rounded-sm overflow-hidden mb-12">
        {[
          [nf.format(stats.hotels), "飯店 · Hotels"],
          [nf.format(stats.cities), "城市 · Cities"],
          [nf.format(stats.countries), "國家／地區 · Countries"],
          [`${topCount}`, `最常住 · ${topGroup}`],
        ].map(([value, label]) => (
          <div key={label} className="bg-(--bg) px-4 py-4 flex flex-col-reverse">
            <dt className="text-[11px] text-(--muted) font-mono tracking-wide">{label}</dt>
            <dd className="text-xl font-light text-(--text) font-mono mb-1">{value}</dd>
          </div>
        ))}
      </dl>

      <section className="mb-12">
        <SectionHeading>城市地圖 · Map</SectionHeading>
        <div className="border border-(--border) rounded-sm bg-(--surface) p-3 sm:p-5">
          <HotelMap />
        </div>
        {outside.length > 0 && (
          <p className="text-xs text-(--muted) font-light mt-3">
            圖上沒畫的：{outside.flatMap(([, cities]) => cities.map(([c, h]) => `${c} ${h.length} 間`)).join("、")}（美國，距離太遠）
          </p>
        )}
      </section>

      {memberships.length > 0 && (
        <section className="mb-12">
          <SectionHeading>會籍 · Memberships</SectionHeading>
          <div className="space-y-6">
            {memberships.map(([kind, ms]) => (
              <div key={kind} className="grid sm:grid-cols-[5.5rem_1fr] gap-x-3 gap-y-1">
                <p className="text-xs text-(--muted) pt-2">{kind}</p>
                <ul className="divide-y divide-(--border) border-y border-(--border)">
                  {ms.map((m) => (
                    <li key={m.program} className="py-2.5 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                      <span className="text-[15px] sm:text-sm text-(--text) font-light">{m.program}</span>
                      {m.tier && <span className="text-[11px] text-(--accent) font-mono">{m.tier}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mb-12">
        <SectionHeading>飯店 · Hotels</SectionHeading>
        <div className="space-y-10">
          {places.map(([country, cities]) => (
            <div key={country}>
              <p className="text-xs text-(--accent) font-mono tracking-[0.2em] mb-3">
                {country} · {cities.reduce((n, [, h]) => n + h.length, 0)}
              </p>
              <div className="space-y-4">
                {cities.map(([city, hotels]) => (
                  <div key={city} className="grid grid-cols-[4.5rem_1fr] gap-3">
                    <p className="text-xs text-(--muted) pt-0.5">
                      {city}
                      <span className="font-mono ml-1 opacity-70">{hotels.length}</span>
                    </p>
                    <ul className="text-[15px] sm:text-sm text-(--text) font-light leading-relaxed">
                      {hotels.map((h) => (
                        <li key={h}>{h}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <SectionHeading>飯店集團 · Groups</SectionHeading>
        <ul className="grid sm:grid-cols-2 gap-x-8">
          {stats.groups.map(([g, n]) => (
            <li key={g} className="flex items-baseline justify-between gap-3 py-2 border-b border-(--border)">
              <span className="text-[15px] sm:text-sm text-(--text) font-light">{GROUP_NAMES[g]}</span>
              <span className="text-[11px] text-(--muted) font-mono shrink-0">{n}</span>
            </li>
          ))}
        </ul>
      </section>

      <Link href="/flights" className="inline-block py-3 -my-3 text-xs text-(--muted) hover:text-(--accent) transition-colors font-mono tracking-wide">
        飛行紀錄 · Flight Log →
      </Link>
    </PageShell>
  );
}
