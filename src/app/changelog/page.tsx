import type { Metadata } from "next";
import { withShare } from "@/lib/site/share-meta";
import PageShell from "@/components/layout/PageShell";
import TagBadge from "@/components/ui/TagBadge";
import { groupByMonth, readChangelog } from "@/lib/ops/changelog";
import { REPO_URL } from "@/lib/site/site";

// 網站更新紀錄（TODO B1，2026-11-21）：build 時從 git 的 feat commit 產生，說明見 lib/ops/changelog.ts。
// 頁尾「最後更新」連過來。靜態頁：每次部署重新 build 就會更新。
export const metadata: Metadata = withShare(
  {
    title: "更新紀錄 · Changelog — PINGWEI LI",
    description: "這個網站加過哪些功能：從 git 紀錄自動產生，每次部署更新。",
    alternates: { canonical: "/changelog", types: { "text/markdown": "/changelog.md" } },
  },
  { ownImage: true },
);

export default function ChangelogPage() {
  const months = groupByMonth(readChangelog());

  return (
    <PageShell
      eyebrow="Changelog"
      title={<>更新紀錄 &nbsp;·&nbsp; Changelog</>}
      intro="這個網站長出了哪些功能。從 git 紀錄自動產生，每次部署更新；點右邊的代碼看那次改了什麼。"
    >
      {months.length === 0 ? (
        <p className="text-sm font-light text-(--muted)">目前讀不到更新紀錄。</p>
      ) : (
        <div className="space-y-12">
          {months.map(([month, items]) => {
            const [y, m] = month.split("-");
            return (
              <section key={month}>
                <h2 className="text-xs tracking-[0.2em] text-(--accent) font-mono mb-4">
                  {y} 年 {Number(m)} 月<span className="text-(--muted) tracking-normal"> · {items.length} 項</span>
                </h2>
                <ul className="divide-y divide-(--border) border-y border-(--border)">
                  {items.map((e) => (
                    <li key={e.sha} className="py-3 grid grid-cols-[auto_1fr_auto] items-baseline gap-x-3 gap-y-1">
                      <time dateTime={e.date} className="text-[11px] text-(--muted) font-mono">
                        {e.date.slice(5)}
                      </time>
                      <span className="text-[15px] sm:text-sm font-light text-(--text) leading-relaxed">
                        <span className="mr-2 align-[1px]">
                          <TagBadge>{e.scope}</TagBadge>
                        </span>
                        {e.text}
                      </span>
                      <a
                        href={`${REPO_URL}/commit/${e.sha}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`commit ${e.sha}（GitHub）`}
                        className="text-[11px] text-(--muted) hover:text-(--accent) transition-colors font-mono py-2 -my-2"
                      >
                        {e.sha}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
