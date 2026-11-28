import type { Metadata } from "next";
import { withShare } from "@/lib/site/share-meta";
import PageShell from "@/components/layout/PageShell";
import BulletList from "@/components/ui/BulletList";
import { nowItems, nowUpdated } from "@/lib/content/page-content";
import { readChangelog } from "@/lib/ops/changelog";
import TagBadge from "@/components/ui/TagBadge";

export const metadata: Metadata = withShare({
  title: "近況 · 現在在做什麼、在學什麼 — PINGWEI LI",
  description: "PINGWEI LI 的近況：現在在做的專案、最近改了網站哪些地方、在學的技術（WebGPU、React Three Fiber、本地端 ML 推論），不定期更新。",
  alternates: { canonical: "/now", types: { "text/markdown": "/now.md" } },
}, { ownImage: true });

export default function NowPage() {
  // 「最近在做」：更新紀錄最新 5 筆（每次部署重新 build 就更新，日期跟著自動變）
  const recent = readChangelog().slice(0, 5);
  return (
    <PageShell
      eyebrow="Now"
      title={<>現在 &nbsp;·&nbsp; What I&apos;m doing</>}
      intro={
        <>
          這頁寫我最近在忙什麼，想到就更新。
          <br />
          點子來自{" "}
          <a
            href="https://nownownow.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-(--accent) hover:opacity-70 transition-opacity"
          >
            nownownow.com
          </a>
          。
        </>
      }
    >
      {recent.length > 0 && (
        <section aria-labelledby="now-recent" className="mb-12">
          <h2 id="now-recent" className="text-xs tracking-[0.2em] text-(--accent) font-mono mb-4">
            最近在做<span className="text-(--muted) tracking-normal"> · 從更新紀錄自動挑，最新 {recent[0].date}</span>
          </h2>
          <ul className="divide-y divide-(--border) border-y border-(--border)">
            {recent.map((e) => (
              <li key={e.sha} className="py-3 grid grid-cols-[auto_1fr] items-baseline gap-x-3">
                <time dateTime={e.date} className="text-[11px] text-(--muted) font-mono">
                  {e.date.slice(5)}
                </time>
                <span className="text-[15px] sm:text-sm font-light leading-relaxed">
                  <span className="mr-2 align-[1px]">
                    <TagBadge>{e.scope}</TagBadge>
                  </span>
                  {e.text}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section aria-labelledby="now-learning">
        <h2 id="now-learning" className="text-xs tracking-[0.2em] text-(--accent) font-mono mb-4">
          在學、在忙<span className="text-(--muted) tracking-normal"> · 手動寫的，{nowUpdated} 更新</span>
        </h2>
        <BulletList items={nowItems} className="space-y-4" />
      </section>
    </PageShell>
  );
}
