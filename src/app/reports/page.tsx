import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/layout/PageShell";
import SectionHeading from "@/components/ui/SectionHeading";
import { BarChart, ShareList } from "@/components/ui/StatCharts";
import { PERIOD_NAMES, buildReport, delta, resolveRange, type Entry, type Period } from "@/lib/stats/reports";
import { nf, monthDay as md, regionName } from "@/lib/format";
import { pageTitle } from "@/lib/site/page-title";
import { Suspense } from "react";
import { connection } from "next/server";
import LoadingBlock from "@/components/ui/LoadingBlock";

// 日報／週報／月報（2026-11-25，使用者：「要詳細的日報週報月報，在網站裡面，我之後再挪到私人的管理者裡面」）。
// 週報、月報另外寄信（scripts/report-mail.ps1），日報只在這裡看。資料跟信是同一份 lib/stats/reports.ts。
// 暫時公開但不給搜尋引擎（noindex、不進 sitemap、導覽不放連結）；Search Console 的搜尋字詞只進信、這裡不放（TODO G1 後台做好再搬）。

export const metadata: Metadata = {
  title: "營運報表 · Reports — PINGWEI LI",
  description: "kbs0830.com 的日報、週報、月報：訪客、流量、維運、雷達、機場。",
  alternates: { canonical: "/reports" },
  robots: { index: false, follow: false },
};

const N = (n: number) => nf.format(n);
const twTime = (iso: string) =>
  new Intl.DateTimeFormat("zh-TW", { timeZone: "Asia/Taipei", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));
const PERIODS: Period[] = ["day", "week", "month"];
const RAW_NAMES: Record<string, string> = { browser: "瀏覽器", ai: "AI 爬蟲", search: "搜尋引擎", bot: "其他機器人" };
const RESULT_NAMES = { ok: "成功", failed: "失敗", rollback: "退回", running: "進行中" } as const;
const RESTART_NAMES = { site: "網站", tunnel: "外網", runner: "CI runner" } as const;

const href = (p: Period, d?: string) => (d ? (`/reports?p=${p}&d=${d}` as const) : (`/reports?p=${p}` as const));

function Kpi({ label, value, cmp }: { label: string; value: string; cmp?: string }) {
  return (
    <div className="bg-(--bg) px-4 py-4 flex flex-col-reverse">
      <dt className="text-[11px] text-(--muted) font-mono tracking-wide">
        {label}
        {cmp && <span className="block mt-0.5">{cmp}</span>}
      </dt>
      <dd className="text-xl font-light text-(--text) font-mono mb-1">{value}</dd>
    </div>
  );
}

function Block({ title, en, children, note }: { title: string; en: string; children: React.ReactNode; note?: React.ReactNode }) {
  return (
    <section className="mb-12 min-w-0">
      <SectionHeading as="h2" en={en}>
        {title}
      </SectionHeading>
      {children}
      {note && <p className="text-xs text-(--muted) font-light mt-3 leading-relaxed">{note}</p>}
    </section>
  );
}

function Shares({ label, entries, total }: { label?: string; entries: Entry[]; total?: number }) {
  if (!entries.length) return null;
  return (
    <div className="min-w-0">
      {label && <p className="text-[11px] text-(--muted) font-mono tracking-wide mb-1">{label}</p>}
      <ShareList entries={entries} total={total ?? entries.reduce((n, [, v]) => n + v, 0)} />
    </div>
  );
}

const Empty = ({ children }: { children: React.ReactNode }) => <p className="text-sm text-(--muted) font-light">{children}</p>;

async function ReportsContent({ searchParams }: { searchParams: Promise<{ p?: string; d?: string }> }) {
  await connection(); // Cache Components：下面讀的都是即時資料（TODO C13）
  const sp = await searchParams;
  const period: Period = sp.p === "week" || sp.p === "month" ? sp.p : "day";
  const range = resolveRange(period, sp.d);
  const r = buildReport(range);
  const v = r.visitors;
  const cmpLabel = period === "day" ? "前一天" : period === "week" ? "上週" : "上個月";
  const cmp = (cur: number, prev: number) => `${cmpLabel} ${N(prev)}${delta(cur, prev)}`;
  const sessionsTotal = r.direct != null ? r.direct + r.refKinds.reduce((n, [, c]) => n + c, 0) : undefined;

  return (
    <Shell>
      {/* 期間切換：日／週／月，跟前後一期 */}
      <nav aria-label="報表期間" className="mb-8 space-y-4">
        <div className="grid grid-cols-3 border border-(--border) rounded-sm overflow-hidden text-sm">
          {PERIODS.map((p) => (
            <Link
              key={p}
              href={href(p, range.from)}
              aria-current={p === period ? "page" : undefined}
              className={`py-2.5 text-center transition-colors duration-200 ${p === period ? "bg-(--accent) text-(--bg)" : "text-(--muted) hover:text-(--text) hover:bg-(--surface)"}`}
            >
              {PERIOD_NAMES[p]}
            </Link>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3">
          <Link href={href(period, range.prevAnchor)} className="text-sm text-(--muted) hover:text-(--accent) px-2 py-2 -mx-2 whitespace-nowrap">
            ← {cmpLabel}
          </Link>
          <p className="font-mono text-sm text-(--text) text-center min-w-0">
            {range.label}
            {range.partial ? (
              <span className="block text-[11px] text-(--muted)">算到 {md(range.end)}（還沒結束）</span>
            ) : range.today ? (
              <span className="block text-[11px] text-(--muted)">今天還沒過完</span>
            ) : null}
          </p>
          {range.nextAnchor ? (
            <Link href={href(period, range.nextAnchor)} className="text-sm text-(--muted) hover:text-(--accent) px-2 py-2 -mx-2 whitespace-nowrap">
              {period === "day" ? "後一天" : period === "week" ? "下週" : "下個月"} →
            </Link>
          ) : (
            <span className="invisible text-sm px-2 whitespace-nowrap" aria-hidden>
              {period === "day" ? "後一天" : period === "week" ? "下週" : "下個月"} →
            </span>
          )}
        </div>
      </nav>

      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-(--border) border border-(--border) rounded-sm overflow-hidden mb-4">
        <Kpi label="真人瀏覽" value={N(v.cur.views)} cmp={cmp(v.cur.views, v.prev.views)} />
        <Kpi label="造訪" value={N(v.cur.sessions)} cmp={cmp(v.cur.sessions, v.prev.sessions)} />
        <Kpi label="新訪客" value={N(v.cur.newVisitors)} cmp={cmp(v.cur.newVisitors, v.prev.newVisitors)} />
        <Kpi label="可用率" value={r.uptime.pct != null ? `${r.uptime.pct}%` : "–"} cmp={`${N(r.uptime.checks)} 次檢查`} />
      </dl>
      <p className="text-xs text-(--muted) font-light mb-12 leading-relaxed">
        {range.partial ? `還沒結束的一期跟${cmpLabel}「同樣天數」比。` : range.today ? "今天還沒過完，跟昨天整天比會偏低。" : ""}
        真人＝瀏覽器真的執行 JS、濾掉機器人跟站長自己的瀏覽器。
      </p>

      <Block
        title="真人訪客"
        en="Visitors"
        note={r.detailSince && r.detailSince !== range.from ? `熱門頁面、來源、國家、裝置是 ${md(r.detailSince)} 起才逐日記的，之前只有總數。` : r.detailSince ? undefined : "這段期間還沒有逐日的分類（2026-11-25 起才開始記）。"}
      >
        <div className="border border-(--border) rounded-sm bg-(--bg) p-4 sm:p-5 mb-8">
          {period === "day" ? (
            v.hours ? (
              <BarChart
                label="這天每小時的真人瀏覽"
                bars={v.hours.map((n, h) => ({ key: String(h), value: n, title: `${h}:00–${h}:59：${n} 次瀏覽` }))}
                caption={
                  <>
                    <span>0 點</span>
                    <span>12 點</span>
                    <span>23 點</span>
                  </>
                }
              />
            ) : (
              <Empty>這天沒有逐小時的資料。</Empty>
            )
          ) : (
            <BarChart
              label="每天的真人瀏覽"
              bars={v.byDay.map((d) => ({ key: d.date, value: d.views, title: `${d.date}：${d.views} 次瀏覽 · ${d.sessions} 次造訪 · ${d.newVisitors} 位新訪客` }))}
              caption={
                <>
                  <span>{md(range.from)}</span>
                  <span>{md(range.to)}</span>
                </>
              }
            />
          )}
        </div>
        <div className="space-y-8">
          <Shares label="熱門頁面（瀏覽）" entries={r.pages.map(([path, n]): Entry => [pageTitle(path), n])} />
          <Shares label="外部來源（造訪）" entries={r.direct != null ? [["直接進入", r.direct], ...r.refKinds] : r.refKinds} total={sessionsTotal} />
          <Shares label="來源網域" entries={r.referrers} />
          <Shares label="國家（瀏覽）" entries={r.countries.map(([c, n]): Entry => [`${regionName(c)}`, n])} />
          <Shares label="裝置（造訪）" entries={r.devices} />
          <Shares label="瀏覽器" entries={r.browsers} />
          <Shares label="作業系統" entries={r.os} />
        </div>
      </Block>

      <Block title="流量" en="Traffic" note="Cloudflare 含機器人、用 UTC 日期；到達主機的請求不含 Cloudflare 快取直接回的。">
        {r.cloudflare && r.cloudflare.cur.days > 0 ? (
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-(--border) border border-(--border) rounded-sm overflow-hidden mb-8">
            <Kpi label="Cloudflare 訪客" value={N(r.cloudflare.cur.uniques)} cmp={cmp(r.cloudflare.cur.uniques, r.cloudflare.prev.uniques)} />
            <Kpi label="頁面瀏覽" value={N(r.cloudflare.cur.pageViews)} cmp={cmp(r.cloudflare.cur.pageViews, r.cloudflare.prev.pageViews)} />
            <Kpi label="請求" value={N(r.cloudflare.cur.requests)} cmp={cmp(r.cloudflare.cur.requests, r.cloudflare.prev.requests)} />
            <Kpi
              label="快取命中率"
              value={r.cloudflare.cur.cachedOf ? `${((r.cloudflare.cur.cached / r.cloudflare.cur.cachedOf) * 100).toFixed(1)}%` : "–"}
              cmp={r.cloudflare.cur.cachedOf ? `${N(r.cloudflare.cur.cached)} 次沒到桌機` : "11/25 起才有"}
            />
          </dl>
        ) : (
          <div className="mb-8">
            <Empty>Cloudflare 這段還沒有數字（它用 UTC 日期、網站一小時抓一次）。</Empty>
          </div>
        )}
        <div className="space-y-8">
          {r.raw ? (
            <>
              <Shares
                label={`到達主機的頁面請求：${N(r.raw.cur.total)}${r.raw.prev ? delta(r.raw.cur.total, r.raw.prev.total) : ""}`}
                entries={Object.entries(RAW_NAMES).map(([k, name]): Entry => [name, r.raw!.cur[k] ?? 0])}
                total={r.raw.cur.total}
              />
              <Shares label="爬蟲" entries={r.raw.names} />
            </>
          ) : (
            <Empty>到達主機的請求 11/25 起才逐日記。</Empty>
          )}
          {r.notFound && (
            <div>
              <Shares label={`404：${N(r.notFound.total)} 次（掃描器另外 ${N(r.notFound.scanners)} 次）`} entries={r.notFound.paths} total={r.notFound.total} />
              {!r.notFound.total && <Empty>沒有 404（掃描器的不算）。</Empty>}
            </div>
          )}
          {r.hero && <Shares label="首頁 3D 背景拿到哪一版（分頁）" entries={r.hero} />}
          {r.vitals && (
            <div>
              <p className="text-[11px] text-(--muted) font-mono tracking-wide mb-1">首頁 Web Vitals p75（最近的樣本，不分期間）</p>
              <ul className="border-y border-(--border) divide-y divide-(--border) font-mono text-sm">
                {r.vitals.map((x) => (
                  <li key={x.metric} className="flex justify-between py-2">
                    <span>{x.metric}</span>
                    <span className="text-(--muted)">
                      {x.p75}
                      {x.metric === "CLS" ? "" : " ms"} · n={x.n}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Block>

      <Block title="維運" en="Operations">
        <ul className="border-y border-(--border) divide-y divide-(--border) text-sm font-light">
          <li className="py-2.5 flex justify-between gap-4">
            <span>可用率</span>
            <span className="font-mono text-(--muted) text-right">
              {r.uptime.pct != null ? `${r.uptime.pct}%` : "–"} · 失敗 {r.uptime.down} 次{r.uptime.maint ? ` · 維修 ${r.uptime.maint}` : ""}
            </span>
          </li>
          <li className="py-2.5 flex justify-between gap-4">
            <span>部署</span>
            <span className="font-mono text-(--muted) text-right">
              成功 {r.deploys.ok} · 失敗 {r.deploys.failed} · 退回 {r.deploys.rollback}
              {r.deploys.avgSeconds ? ` · 平均 ${r.deploys.avgSeconds}s` : ""}
            </span>
          </li>
          <li className="py-2.5 flex justify-between gap-4">
            <span>watchdog</span>
            <span className="font-mono text-(--muted) text-right">
              自動救回 {r.restarts.filter((x) => x.auto).length} · 要人處理 {r.restarts.filter((x) => !x.auto).length}
            </span>
          </li>
          <li className="py-2.5 flex justify-between gap-4">
            <span>抖動</span>
            <span className="font-mono text-(--muted) text-right">
              外網 {r.jitter.tunnelOnce} · 本機 {r.jitter.localFail}
            </span>
          </li>
          {r.disk.map((d) => (
            <li key={d.drive} className="py-2.5 flex justify-between gap-4">
              <span>磁碟 {d.drive}（現在）</span>
              <span className={`font-mono text-right ${d.pct < 10 ? "text-(--warn)" : "text-(--muted)"}`}>
                剩 {d.freeGb} GB · {d.pct}%
              </span>
            </li>
          ))}
        </ul>
        {(r.boots.length > 0 || r.restarts.length > 0 || r.deploys.failed + r.deploys.rollback > 0) && (
          <ul className="mt-6 space-y-2 text-sm font-light">
            {r.boots.map((b) => (
              <li key={b.time}>
                <span className="font-mono text-(--muted) mr-2">{twTime(b.time)}</span>開機：{b.text}
              </li>
            ))}
            {r.restarts.map((x) => (
              <li key={x.time + x.kind} className={x.auto ? "" : "text-(--warn)"}>
                <span className="font-mono text-(--muted) mr-2">{twTime(x.time)}</span>
                {RESTART_NAMES[x.kind]}
                {x.auto ? "自動救回" : "出問題（要人處理）"}
              </li>
            ))}
            {r.deploys.list
              .filter((d) => d.result === "failed" || d.result === "rollback")
              .map((d) => (
                <li key={d.start} className="text-(--warn)">
                  <span className="font-mono text-(--muted) mr-2">{twTime(d.start)}</span>部署{RESULT_NAMES[d.result]}
                </li>
              ))}
          </ul>
        )}
      </Block>

      <Block title="自家雷達" en="Radar">
        {r.radar ? (
          <>
            <dl className="grid grid-cols-3 gap-px bg-(--border) border border-(--border) rounded-sm overflow-hidden mb-8">
              <Kpi label="架次" value={N(r.radar.unique)} />
              <Kpi label="最多同時" value={String(r.radar.peak)} />
              <Kpi label="在線" value={r.radar.onlinePct != null ? `${r.radar.onlinePct}%` : "–"} />
            </dl>
            <div className="space-y-8">
              <Shares label="航空公司" entries={r.radar.airlines} />
              <Shares label="機型" entries={r.radar.types} />
            </div>
          </>
        ) : (
          <Empty>這段期間沒有雷達資料。</Empty>
        )}
      </Block>

      <Block title="小港機場" en="KHH delays" note="準點＝比表定晚 15 分鐘以內；只算已經起飛／抵達／取消的班次。11/25 起才開始記。">
        {r.delays.flights > 0 ? (
          <>
            <dl className="grid grid-cols-3 gap-px bg-(--border) border border-(--border) rounded-sm overflow-hidden mb-6">
              <Kpi label="班次" value={N(r.delays.flights)} />
              <Kpi label="準點率" value={r.delays.onTimePct != null ? `${r.delays.onTimePct}%` : "–"} />
              <Kpi label="取消" value={String(r.delays.cancelled)} />
            </dl>
            {r.delays.worst.length > 0 && (
              <ul className="border-y border-(--border) divide-y divide-(--border) text-sm font-light">
                {r.delays.worst.map((w) => (
                  <li key={w.code + w.dir} className="py-2.5 flex justify-between gap-4">
                    <span className="min-w-0 truncate">
                      <span className="font-mono">{w.code}</span> {w.dir === "dep" ? "→" : "←"} {w.place}
                    </span>
                    <span className="font-mono text-(--muted) shrink-0">
                      平均晚 {w.avgDelay} 分 · {w.n} 班
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <Empty>這段期間還沒有紀錄。</Empty>
        )}
      </Block>

      <Block title="網站更新" en="Changes">
        {r.posts.length > 0 && (
          <ul className="mb-6 space-y-2">
            {r.posts.map((p) => (
              <li key={p.slug} className="text-sm">
                📝{" "}
                <Link href={`/blog/${p.slug}`} className="underline underline-offset-4 decoration-(--border) hover:decoration-(--accent)">
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
        {r.changes.length ? (
          <ul className="border-y border-(--border) divide-y divide-(--border) text-sm font-light">
            {r.changes.map((c) => (
              <li key={c.sha} className="py-2.5 grid grid-cols-[3rem_1fr] gap-3">
                <span className="font-mono text-(--muted)">{md(c.date)}</span>
                <span className="min-w-0">
                  <span className="text-(--muted)">{c.scope}　</span>
                  {c.text}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>這段期間沒有公開的更新。</Empty>
        )}
      </Block>
    </Shell>
  );
}

// 頁首（標題、說明）是 build 時就畫好的外殼；內容讀即時資料，訪客打開時才串流補進來（Cache Components，TODO C13）
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <PageShell
      eyebrow="Reports"
      title={<>營運報表 &nbsp;·&nbsp; Reports</>}
      intro="這個網站每天、每週、每月的狀況：訪客、流量、維運、雷達、機場。週報、月報另外寄信；這頁暫時公開、不給搜尋引擎收錄。"
    >
      {children}
    </PageShell>
  );
}

export default function ReportsPage(props: Parameters<typeof ReportsContent>[0]) {
  return (
    <Suspense
      fallback={
        <Shell>
          <LoadingBlock label="產生報表中…" minHeight={1400} />
        </Shell>
      }
    >
      <ReportsContent {...props} />
    </Suspense>
  );
}
