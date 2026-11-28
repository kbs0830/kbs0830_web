import type { Metadata, Route } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { connection } from "next/server";
import { withShare } from "@/lib/site/share-meta";
import PageShell from "@/components/layout/PageShell";
import SectionHeading from "@/components/ui/SectionHeading";
import LoadingBlock from "@/components/ui/LoadingBlock";
import { Tiles } from "@/components/ui/StatCharts";
import { nf } from "@/lib/format";
import { readYearReview } from "@/lib/stats/year-review";

// 「kbs0830.com 的 2026」年度回顧（TODO B18，2026-11-28）：網站從第一個 commit 到現在，全部用網站自己記下來的數字。
// 讀即時資料：Shell＋Suspense＋內容元件第一行 connection()；「現在」在元件外的函式取（Cache Components 的規則）。
export const metadata: Metadata = withShare(
  {
    title: "kbs0830.com 的 2026：年度回顧 — PINGWEI LI",
    description: "這個跑在家裡桌機上的網站，從第一個 commit 到現在：commit、部署、可用率、出過的事故、訪客與自家雷達的數字。",
    alternates: { canonical: "/2026" },
  },
  { ownImage: false },
);

const load = () => readYearReview(Date.now());

function Shell({ children }: { children: ReactNode }) {
  return (
    <PageShell eyebrow="2026" title={<>kbs0830.com 的 2026</>} intro="網站自己記下來的一年。數字每次開頁面現讀，沒有人工潤飾；不放位置、行程跟本名。">
      {children}
    </PageShell>
  );
}

export default function YearPage() {
  return (
    <Shell>
      <Suspense fallback={<LoadingBlock />}>
        <Content />
      </Suspense>
    </Shell>
  );
}

async function Content() {
  await connection();
  const r = load();
  const pct = r.uptime90 === null ? "—" : `${(r.uptime90 * 100).toFixed(2)}%`;
  return (
    <>
      <p className="text-xs text-(--muted) font-mono mb-6">
        {r.since ? `${r.since} 第一個 commit → ` : ""}截至 {r.asOf}
      </p>
      <Tiles
        idPrefix="y26a"
        items={[
          [r.commits === null ? "—" : nf.format(r.commits), "commit"],
          [nf.format(r.deploys), "次部署", `其中自動退回 ${r.rollbacks} 次（新版有問題時雙槽自動切回舊版）。`],
          [String(r.posts), "篇文章"],
          [pct, "近 90 天可用率"],
        ]}
      />

      <section className="mb-12">
        <SectionHeading>出過的事 · Incidents</SectionHeading>
        <ul className="divide-y divide-(--border) border-y border-(--border)">
          {r.incidentList.map((i) => (
            <li key={i.id} className="py-3 grid grid-cols-[auto_1fr] gap-x-3 items-baseline">
              <span className="text-[11px] text-(--muted) font-mono">{i.date}</span>
              <span className="text-[15px] sm:text-sm font-light">
                <Link href={`/status#${i.id}` as Route} className="hover:text-(--accent) transition-colors">
                  {i.title}
                </Link>
                {i.post && (
                  <Link href={`/blog/${i.post}` as Route} className="ml-2 text-[11px] text-(--accent) font-mono hover:opacity-70 transition-opacity">
                    文章 →
                  </Link>
                )}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-12">
        <SectionHeading>訪客 · Visitors</SectionHeading>
        <Tiles
          idPrefix="y26b"
          items={[
            [String(r.countries), "個國家有人來過"],
            ...(r.cloudflare
              ? ([
                  [nf.format(r.cloudflare.uniques), "訪客（累計）", `${r.cloudflare.since} 起；每天不重複 IP 加總，含機器人，Cloudflare 的數字。`],
                  [nf.format(r.cloudflare.pageViews), "頁面瀏覽（累計）"],
                ] as [string, string, string?][])
              : []),
          ]}
        />
      </section>

      {r.radar && (
        <section className="mb-12">
          <SectionHeading>自家雷達 · Radar</SectionHeading>
          <Tiles
            idPrefix="y26c"
            items={[
              [String(r.radar.days), "天有紀錄"],
              [nf.format(r.radar.aircraft), "架次（每天不重複加總）"],
              [String(r.radar.types), "種機型"],
              [nf.format(r.radar.busiest), "單日最多架"],
            ]}
          />
          <p className="text-xs text-(--muted) font-light">
            只放彙總，不放接收位置。即時狀況在{" "}
            <Link href="/radar" className="text-(--accent) underline underline-offset-4">
              /radar
            </Link>
            。
          </p>
        </section>
      )}

      <p className="text-xs text-(--muted) font-light">
        每個環節怎麼運作：
        <Link href="/colophon" className="text-(--accent) underline underline-offset-4">
          本站構造
        </Link>
        ・
        <Link href="/status" className="text-(--accent) underline underline-offset-4">
          維運狀態
        </Link>
        ・
        <Link href="/changelog" className="text-(--accent) underline underline-offset-4">
          更新紀錄
        </Link>
      </p>
    </>
  );
}
