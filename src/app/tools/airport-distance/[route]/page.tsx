import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/ui/JsonLd";
import PageShell from "@/components/layout/PageShell";
import ToolNote from "@/components/tools/ToolNote";
import { withShare } from "@/lib/site/share-meta";
import { breadcrumbLd } from "@/lib/site/json-ld";
import { allRouteSlugs, DESTINATIONS, ORIGINS, routeInfo, routeSlug, withCode } from "@/lib/tools/popular-routes";
import { hm } from "@/lib/tools/flight-calc";

// 熱門航線的飛行距離頁（TODO V3，2026-11-27）：/tools/airport-distance/tpe-fuk。30 頁靜態產生，第一句就是答案。
// 資料與算法在 lib/tools/popular-routes.ts、flight-calc.ts（跟互動工具共用）。沒有的航線 404。
export const ensureStatic = "navigation";

type Props = { params: Promise<{ route: string }> };

export function generateStaticParams() {
  return allRouteSlugs().map((route) => ({ route }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const r = routeInfo((await params).route);
  if (!r) return {};
  return withShare({
    title: `${r.title} · ${r.from.code}→${r.to.code} — PINGWEI LI`,
    description: r.description,
    alternates: { canonical: `/tools/airport-distance/${r.slug}` },
  });
}

const nf = new Intl.NumberFormat("en-US");
const link = "text-(--accent) underline underline-offset-4 decoration-(--border) hover:decoration-(--accent)";
const href = (slug: string) => `/tools/airport-distance/${slug}` as Route;

export default async function RoutePage({ params }: Props) {
  const r = routeInfo((await params).route);
  if (!r) notFound();
  const sameOrigin = DESTINATIONS.filter((d) => d.code !== r.to.code).map((d) => routeInfo(routeSlug(r.from.code, d.code))!);
  const sameDest = ORIGINS.filter((o) => o.code !== r.from.code).map((o) => routeInfo(routeSlug(o.code, r.to.code))!);

  return (
    <PageShell
      backHref="/tools/airport-distance"
      backLabel="返回機場距離計算"
      eyebrow={`Tools · ${r.from.code} → ${r.to.code}`}
      title={<>{r.from.label}到{r.to.label}飛行距離</>}
    >
      <JsonLd
        data={breadcrumbLd([
          { name: "首頁", path: "" },
          { name: "小工具", path: "/tools" },
          { name: "機場距離計算", path: "/tools/airport-distance" },
          { name: `${r.from.label}到${r.to.label}`, path: `/tools/airport-distance/${r.slug}` },
        ])}
      />
      <p className="text-lg font-light text-(--text) leading-relaxed mb-10">{r.answer}</p>

      <dl className="grid grid-cols-2 gap-px bg-(--border) border border-(--border) rounded-sm overflow-hidden mb-10">
        {[
          ["直線距離", `${nf.format(Math.round(r.km))} km`, `${nf.format(Math.round(r.miles))} mi`],
          ["粗估飛行時間", hm(r.hours), "含起降、滑行"],
          ["出發", r.from.name, r.from.code],
          ["抵達", r.to.name, r.to.code],
        ].map(([term, value, sub]) => (
          <div key={term} className="bg-(--bg) px-4 py-4 flex flex-col-reverse">
            <dt className="text-[11px] text-(--muted) font-mono tracking-wide">
              {term}
              <span className="block mt-0.5">{sub}</span>
            </dt>
            <dd className="text-xl font-light text-(--text) font-mono mb-1">{value}</dd>
          </div>
        ))}
      </dl>

      <p className="text-sm font-light text-(--muted) leading-relaxed mb-10">
        想查別的航線？用{" "}
        <Link href={`/tools/airport-distance?from=${r.from.code}&to=${r.to.code}` as Route} className={link}>
          機場距離計算
        </Link>
        ，輸入任兩個三碼機場代碼（全球約 3,200 個）。
        {r.to.code === "FUK" && (
          <>
            {" "}
            今天台灣飛福岡有哪些直飛班機，看{" "}
            <Link href="/tools/taiwan-fukuoka" className={link}>
              台灣 ⇄ 福岡直飛班機
            </Link>
            。
          </>
        )}
      </p>

      <section className="mb-10">
        <h2 className="mb-3 text-[11px] text-(--muted) font-mono tracking-[0.2em] uppercase">從{r.from.label}飛其他日本城市</h2>
        <ul className="flex flex-wrap gap-x-6 gap-y-1">
          {sameOrigin.map((x) => (
            <li key={x.slug}>
              <Link href={href(x.slug)} className="inline-block py-1.5 text-sm font-light text-(--text) hover:text-(--accent) transition-colors">
                {x.to.label} <span className="text-(--muted) font-mono text-xs">{nf.format(Math.round(x.km / 10) * 10)} km</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-[11px] text-(--muted) font-mono tracking-[0.2em] uppercase">從台灣其他機場飛{r.to.label}</h2>
        <ul className="flex flex-wrap gap-x-6 gap-y-1">
          {sameDest.map((x) => (
            <li key={x.slug}>
              <Link href={href(x.slug)} className="inline-block py-1.5 text-sm font-light text-(--text) hover:text-(--accent) transition-colors">
                {x.from.label} <span className="text-(--muted) font-mono text-xs">{nf.format(Math.round(x.km / 10) * 10)} km</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <ToolNote>
        <p>
          {withCode(r.from)}到{withCode(r.to)}：距離是兩個機場座標之間的大圓距離（地球表面最短的路線，球面近似），座標來自 OurAirports（公共領域的開放資料）。
          飛行時間用 800 km/h 加 30 分鐘起降粗估，實際會因為風向、航路、機型差不少（往東飛通常比較快）。
        </p>
        <p>這頁的數字全部由程式計算，不是手寫的；沒有放航空公司跟班表，那些要看即時資料。</p>
      </ToolNote>
    </PageShell>
  );
}
