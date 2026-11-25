import type { Metadata } from "next";
import Link from "next/link";
import { withShare } from "@/lib/site/share-meta";
import PageShell from "@/components/layout/PageShell";
import SectionHeading from "@/components/ui/SectionHeading";
import { Tiles } from "@/components/ui/StatCharts";
import {
  availability,
  readDeploys,
  readRestarts,
  readUptime,
  summarizeStatus,
  uptimeSince,
  type DayUptime,
  type DeployResult,
  type RestartKind,
} from "@/lib/ops/status";
import { incidents } from "@/lib/ops/incidents";
import { getPostBySlug } from "@/lib/content/blog";
import { Suspense } from "react";
import { connection } from "next/server";
import LoadingBlock from "@/components/ui/LoadingBlock";

// 維運狀態頁（TODO A4，2026-11-21）：這個網站跑在自家桌機上，可用率、部署、自動重啟、出過的事故都公開。
// 資料見 lib/ops/status.ts（只公開彙總，不放 log 原文）、事故報告在 lib/ops/incidents.ts。
// 每次請求現讀，所以跟 /stats 一樣沒有 Markdown 版。

export const metadata: Metadata = withShare(
  {
    title: "維運狀態 · Status — PINGWEI LI",
    description: "自家桌機架的網站：90 天可用率、每次部署（含自動退回）、watchdog 自動重啟紀錄，跟出過的事故報告。",
    alternates: { canonical: "/status" },
  },
  { ownImage: true },
);

const pct = (v: number | null) => (v === null ? "累積中" : `${(v * 100).toFixed(v === 1 ? 0 : 2)}%`);

function taipei(iso: string, withDate = true) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Taipei",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value]),
  );
  return withDate ? `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}` : `${parts.hour}:${parts.minute}`;
}

function duration(seconds: number) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d) return `${d} 天 ${h} 小時`;
  if (h) return `${h} 小時 ${m} 分`;
  return `${m} 分`;
}

const DEPLOY_LABEL: Record<DeployResult, string> = { ok: "成功", failed: "失敗", rollback: "自動退回", running: "進行中" };
const RESTART_LABEL: Record<RestartKind, string> = {
  site: "網站沒回應",
  tunnel: "外網連不到（Tunnel）",
  runner: "自動部署的 runner 停了",
};

/** 90 天長條：每天一根，滿格＝100%，有掛過的那天換琥珀色，還沒開始記的日子是淡灰 */
function UptimeBars({ days }: { days: DayUptime[] }) {
  const W = 600;
  const H = 36;
  const gap = 2;
  const bw = (W - gap * (days.length - 1)) / days.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={`近 ${days.length} 天每天的可用率`}>
      {days.map((d, i) => {
        const ratio = d.checks ? d.up / d.checks : null;
        const fill = ratio === null ? "var(--border)" : ratio === 1 ? "var(--accent)" : "var(--warn)";
        const title =
          ratio === null
            ? `${d.date} · 沒有紀錄${d.maint ? `（維修 ${d.maint} 次）` : ""}`
            : `${d.date} · ${(ratio * 100).toFixed(ratio === 1 ? 0 : 2)}%（${d.checks} 次檢查${d.maint ? `、維修 ${d.maint} 次` : ""}）`;
        return (
          <rect key={d.date} x={i * (bw + gap)} y={0} width={bw} height={H} rx={1} style={{ fill }} opacity={ratio === null ? 0.6 : 0.9}>
            <title>{title}</title>
          </rect>
        );
      })}
    </svg>
  );
}

async function StatusContent() {
  await connection(); // Cache Components：下面讀的都是即時資料（TODO C13）
  const days = readUptime(90);
  const since = uptimeSince();
  const deploys = readDeploys();
  const restarts = readRestarts();
  const sum = summarizeStatus(deploys, restarts);

  return (
    <Shell>
      <div className="flex items-center gap-3 mb-10 p-4 border border-(--border) rounded-sm bg-(--surface)">
        {/* 靜止的點：設計原則「不跳不彈不閃」，不用 ping 動畫 */}
        <span aria-hidden className="inline-flex size-2.5 shrink-0 rounded-full bg-(--accent)" />
        <p className="text-sm font-light text-(--text)">
          目前正常運作
          <span className="text-(--muted)">
            {" "}
            · 這次啟動已經跑了 {duration(sum.processUptime)}
            {sum.lastDeploy && ` · 上次部署 ${taipei(sum.lastDeploy.start)}`}
          </span>
        </p>
      </div>

      <Tiles
        items={[
          [pct(availability(days.slice(-30))), "近 30 天可用率"],
          [String(sum.deploys90), `近 90 天部署（成功 ${sum.okDeploys90}）`],
          [String(sum.rollbacks90), "健檢沒過、自動退回"],
          [String(sum.autoRestarts90), "近 90 天自動重啟"],
        ]}
      />

      <section className="mb-12">
        <SectionHeading en="Uptime">可用率 · 近 90 天</SectionHeading>
        <UptimeBars days={days} />
        <div className="flex justify-between text-[11px] text-(--muted) font-mono mt-2">
          <span>{days[0].date}</span>
          <span>今天</span>
        </div>
        <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-(--muted) font-light mt-4">
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="size-2.5 rounded-xs bg-(--accent)" /> 全天正常
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="size-2.5 rounded-xs bg-(--warn)" /> 有中斷
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="size-2.5 rounded-xs bg-(--border)" /> 還沒有紀錄
          </li>
        </ul>
        <p className="text-xs text-(--muted) font-light mt-3 leading-relaxed">
          watchdog 每 5 分鐘從桌機自己跟從外網各打一次首頁，兩邊都正常才算可用（維修模式不計）。
          {since ? `從 ${taipei(since).slice(0, 10)} 開始每一輪都記；` : "這份紀錄剛開始累積；"}
          之前的 log 只記異常，所以更早的日子是灰的——不是沒出事，是沒有可以算比例的資料，出過的事都寫在下面的事故報告裡。
        </p>
      </section>

      <section className="mb-12">
        <SectionHeading en="Deploys">部署紀錄</SectionHeading>
        <p className="text-xs text-(--muted) font-light mb-4 leading-relaxed">
          push 到 GitHub 就自動部署：先 build 到沒在用的那個資料夾，切過去後健檢，沒過就自動退回上一版。
          {sum.medianDeploySeconds !== null && ` 近 90 天成功的部署，一半在 ${sum.medianDeploySeconds} 秒內完成。`}
        </p>
        <ul className="divide-y divide-(--border) border-y border-(--border)">
          {deploys.slice(0, 12).map((d) => (
            <li key={d.start} className="py-2.5 flex items-baseline justify-between gap-3">
              <time dateTime={d.start} className="text-xs text-(--muted) font-mono">
                {taipei(d.start)}
              </time>
              <span className="text-[11px] text-(--muted) font-mono">
                {d.seconds !== undefined && `${d.seconds} 秒 · `}
                <span className={d.result === "ok" ? "text-(--accent)" : d.result === "running" ? "" : "text-(--warn)"}>
                  {DEPLOY_LABEL[d.result]}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-12">
        <SectionHeading en="Auto recovery">自動重啟紀錄</SectionHeading>
        <p className="text-xs text-(--muted) font-light mb-4 leading-relaxed">
          watchdog 發現網站沒回應會自己重啟；外網連不到（Tunnel）只能寄信通知我。最近 12 筆：
        </p>
        {restarts.length === 0 ? (
          <p className="text-sm font-light text-(--muted)">沒有紀錄。</p>
        ) : (
          <ul className="divide-y divide-(--border) border-y border-(--border)">
            {restarts.slice(0, 12).map((r, i) => (
              <li key={`${r.time}-${i}`} className="py-2.5 flex items-baseline justify-between gap-3">
                <time dateTime={r.time} className="text-xs text-(--muted) font-mono shrink-0">
                  {taipei(r.time)}
                </time>
                <span className="text-[13px] font-light text-(--text) text-right">
                  {RESTART_LABEL[r.kind]}
                  <span className="text-(--muted)"> · {r.auto ? "自動恢復" : r.kind === "tunnel" ? "寄信通知" : "需要人處理"}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <SectionHeading en="Incident reports">事故報告</SectionHeading>
        <p className="text-xs text-(--muted) font-light mb-6 leading-relaxed">
          出過的事，照「發生什麼 → 怎麼發現 → 為什麼 → 怎麼修 → 之後怎麼避免」記下來。有些寫成了比較長的文章。
        </p>
        <div className="space-y-4">
          {incidents.map((inc) => {
            const post = inc.post ? getPostBySlug(inc.post) : undefined;
            return (
              <details key={inc.id} id={inc.id} className="group border border-(--border) rounded-sm scroll-mt-24">
                <summary className="cursor-pointer list-none p-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="text-[15px] sm:text-sm font-normal text-(--text) group-open:text-(--accent)">{inc.title}</h3>
                  <span className="text-[11px] text-(--muted) font-mono">
                    {inc.date} · {inc.duration}
                  </span>
                </summary>
                <dl className="px-4 pb-4 grid sm:grid-cols-[6rem_1fr] gap-x-4 gap-y-2 text-[14px] sm:text-[13px] leading-relaxed">
                  {(
                    [
                      ["影響", inc.impact],
                      ["怎麼發現", inc.detection],
                      ["原因", inc.cause],
                      ["修法", inc.fix],
                      ["之後", inc.prevention],
                    ] as const
                  ).map(([k, v]) => (
                    <div key={k} className="contents">
                      <dt className="text-(--muted) font-mono text-xs pt-0.5">{k}</dt>
                      <dd className="font-light text-(--text)">{v}</dd>
                    </div>
                  ))}
                </dl>
                {post && (
                  <p className="px-4 pb-4 -mt-1">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="text-xs text-(--accent) underline underline-offset-4 decoration-(--border) hover:decoration-(--accent) font-mono"
                    >
                      完整文章：{post.title} →
                    </Link>
                  </p>
                )}
              </details>
            );
          })}
        </div>
      </section>
    </Shell>
  );
}

// 頁首（標題、說明）是 build 時就畫好的外殼；內容讀即時資料，訪客打開時才串流補進來（Cache Components，TODO C13）
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <PageShell
      eyebrow="Status"
      title={<>維運狀態 &nbsp;·&nbsp; Status</>}
      intro={
        <>
          這個網站跑在我家的桌機上，沒有租雲端主機。它多穩、多常更新、出過哪些事、怎麼修的，都在這裡。整套怎麼搭起來的看{" "}
          <Link href="/colophon" className="text-(--accent) underline underline-offset-4 decoration-(--border) hover:decoration-(--accent)">
            本站構造
          </Link>
          。
        </>
      }
    >
      {children}
    </PageShell>
  );
}

export default function StatusPage() {
  return (
    <Suspense
      fallback={
        <Shell>
          <LoadingBlock label="讀取維運紀錄中…" minHeight={1200} />
        </Shell>
      }
    >
      <StatusContent />
    </Suspense>
  );
}
