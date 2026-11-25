import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { dataFile } from "@/lib/data-file";
import { withShare } from "@/lib/site/share-meta";
import PageShell from "@/components/layout/PageShell";
import SectionHeading from "@/components/ui/SectionHeading";
import LoadingBlock from "@/components/ui/LoadingBlock";
import PlaneSilhouette from "@/components/live/PlaneSilhouette";
import { DEX_CATALOG, DEX_GROUPS, DEX_HIDDEN, type DexEntry } from "@/lib/live/aircraft-dex";
import { monthDay } from "@/lib/format";
import { dex, readState } from "../../../../scripts/lib/radar.js";

// 機體図鑑（2026-11-25，使用者：「更有創意一點」「有感一點的改動」）：自家雷達收到過的機型點亮，沒收到的是灰色剪影。
// 資料：scripts/lib/radar.js 的 state.dex（每種機型的初見日期、累計架次，永久保留）。只有機型、日期、架次——沒有位置、時間、識別碼。
export const metadata: Metadata = withShare({
  title: "機體図鑑：自家 ADS-B 雷達收到過的飛機機型 · Aircraft Dex — PINGWEI LI",
  description: "家裡自己架的 ADS-B 接收器收到過哪些飛機？A321neo、777-300ER、747-8……收到過的點亮、記下初見日期，還沒收到的是剪影。",
  alternates: { canonical: "/radar/zukan" },
});

type Seen = { code: string; first: string; n: number };

function Shell({ children, intro }: { children: React.ReactNode; intro?: string }) {
  return (
    <PageShell backHref="/radar" backLabel="返回自家雷達" eyebrow="My Radar · Zukan" title={<>機體図鑑</>} intro={intro ?? "自家雷達收到過的機型。收到過的點亮、記下第一次收到的日子；還沒收到的是剪影。"}>
      {children}
    </PageShell>
  );
}

function Card({ entry, seen }: { entry: DexEntry; seen?: Seen }) {
  const on = Boolean(seen);
  return (
    <li
      className={`relative border rounded-sm p-3 flex flex-col items-center text-center ${on ? "border-(--border) bg-(--bg)" : "border-dashed border-(--border) bg-transparent"}`}
    >
      {on && entry.rare && (
        <span lang="ja" className="absolute top-1.5 right-1.5 font-mono text-[9px] tracking-wide text-(--warn)">
          珍しい
        </span>
      )}
      <PlaneSilhouette kind={entry.kind} className={`w-14 h-14 ${on ? "text-(--accent)" : "text-(--border)"}`} />
      <p className="mt-2 font-mono text-[11px] tracking-wide text-(--muted)">{entry.code}</p>
      <p className={`text-[13px] leading-snug ${on ? "text-(--text)" : "text-(--muted)"}`}>{on ? entry.name.replace(/^(Airbus|Boeing) /, "") : "？？？"}</p>
      {seen && (
        <p className="mt-1 font-mono text-[10px] text-(--muted) leading-relaxed">
          初見 {monthDay(seen.first)}
          <span className="hidden sm:inline"> · </span>
          <br className="sm:hidden" />×{seen.n}
        </p>
      )}
    </li>
  );
}

async function ZukanContent() {
  await connection(); // 即時資料（Cache Components）
  const seenList = dex(readState(dataFile("RADAR_FILE", "radar.json"))) as Seen[];
  const seen = new Map(seenList.map((s) => [s.code, s]));
  const total = DEX_CATALOG.size;
  const lit = [...DEX_CATALOG.keys()].filter((c) => seen.has(c)).length;
  const extra = seenList.filter((s) => !DEX_CATALOG.has(s.code) && !DEX_HIDDEN.has(s.code));
  const newest = seenList.filter((s) => !DEX_HIDDEN.has(s.code)).toSorted((a, b) => b.first.localeCompare(a.first))[0];

  return (
    <Shell>
      <div className="mb-10">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between mb-2">
          <p className="font-mono text-xs text-(--muted) tracking-wide">
            點亮 <span className="text-(--text) text-base">{lit}</span> / {total}
            {extra.length > 0 && <span>（另外 {extra.length} 種不在清單裡）</span>}
          </p>
          {newest && (
            <p className="font-mono text-[11px] text-(--muted)">
              最新：{DEX_CATALOG.get(newest.code)?.name ?? newest.code}（{monthDay(newest.first)}）
            </p>
          )}
        </div>
        <div className="h-1 bg-(--surface) rounded-full overflow-hidden">
          <div className="h-full bg-(--accent) rounded-full" style={{ width: `${(lit / total) * 100}%` }} />
        </div>
      </div>

      {DEX_GROUPS.map((g) => (
        <section key={g.en} className="mb-10">
          <SectionHeading en={g.en}>{g.title}</SectionHeading>
          <ul className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
            {g.entries.map((e) => (
              <Card key={e.code} entry={e} seen={seen.get(e.code)} />
            ))}
          </ul>
        </section>
      ))}

      {extra.length > 0 && (
        <section className="mb-10">
          <SectionHeading en="Uncatalogued">清單外</SectionHeading>
          <ul className="flex flex-wrap gap-2">
            {extra.map((s) => (
              <li key={s.code} className="border border-(--border) rounded-sm px-3 py-1.5 font-mono text-xs text-(--text)">
                {s.code} <span className="text-(--muted)">· {monthDay(s.first)} · ×{s.n}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-12 text-xs text-(--muted) font-light leading-relaxed">
        機型是拿飛機的識別碼查公開資料庫（adsbdb.com）得到的，查不到的不算。架次是「每天收到幾架不同的飛機」加總，同一架一天只算一次。
        軍機不列。資料從 2026-11-21 開始記。即時的數字在{" "}
        <Link href="/radar" className="text-(--accent) underline underline-offset-4 decoration-(--border) hover:decoration-(--accent)">
          自家雷達
        </Link>
        。
      </p>
    </Shell>
  );
}

export default function ZukanPage() {
  return (
    <Suspense fallback={<Shell><LoadingBlock /></Shell>}>
      <ZukanContent />
    </Suspense>
  );
}
