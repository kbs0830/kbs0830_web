import type { Metadata } from "next";
import { withShare } from "@/lib/share-meta";
import PageShell from "@/components/ui/PageShell";
import SectionHeading from "@/components/ui/SectionHeading";
import BulletList from "@/components/ui/BulletList";
import { readCloudflareDays, readCloudflareSummary, refreshCloudflareIfStale } from "@/lib/cloudflare-analytics";
import { countryFlag, readCountryCounts, readCrawlers, readRawTraffic, type BotKind } from "@/lib/site-stats";
import { lastDays, readDetail } from "@/lib/visit-detail";
import { projects } from "@/lib/projects";
import { getAllPosts } from "@/lib/blog";

// 訪客分析頁（2026-11-09 公開流量頁 → 同天使用者要「訪客分析的頁面」，升級成這頁）。
// 這個網站是自己桌機架的，流量本身就是作品的一部分。只有彙總數字：不記 IP、完整 UA、完整網址、cookie。
// 資料：
//   - 真人訪客（瀏覽、工作階段、頁面、來源、裝置、時段）：lib/visit-detail.ts，VisitBeacon 回報（要執行 JS）
//   - 國家：lib/site-stats.ts（同一個回報）
//   - Cloudflare：lib/cloudflare-analytics.ts（含機器人、含快取命中）
//   - 到達主機的請求：scripts/lib/raw-traffic.js（Cloudflare 快取之後只剩沒命中的）
// 每次請求現讀資料檔，所以沒有 Markdown 版（那是 build 時預先產生的）。
export const dynamic = "force-dynamic";

export const metadata: Metadata = withShare({
  title: "訪客分析 · Analytics — PINGWEI LI",
  description: "這個自架網站的訪客：每天多少人、看哪些頁、從哪裡來、用什麼裝置，還有 Cloudflare 跟 AI 爬蟲的數字。",
  alternates: { canonical: "/stats" },
});

const nf = new Intl.NumberFormat("en-US");
// 國名用瀏覽器內建的翻譯表（Intl），不用自己維護對照表；Windows 不顯示國旗 emoji 時至少看得懂
const regionName = new Intl.DisplayNames(["zh-TW"], { type: "region" });
const KIND_LABEL: Record<BotKind, string> = { ai: "AI", search: "搜尋引擎", bot: "其他" };

// 路徑 → 看得懂的頁名（熱門頁面用）
const PAGE_NAMES: Record<string, string> = {
  "/": "首頁",
  "/blog": "部落格",
  "/resume": "履歷",
  "/now": "現在",
  "/uses": "開発環境",
  "/flights": "飛行紀錄",
  "/hotels": "住宿紀錄",
  "/stats": "訪客分析",
};
function pageName(path: string): string {
  if (PAGE_NAMES[path]) return PAGE_NAMES[path];
  const [, section, slug, rest] = path.split("/");
  if (section === "projects") return projects.find((p) => p.slug === slug)?.titleZh ?? path;
  if (section === "blog" && slug === "tags" && rest) return `標籤：${rest}`;
  if (section === "blog") return getAllPosts().find((p) => p.slug === slug)?.title ?? path;
  return path;
}

const sorted = (m: Record<string, number> = {}) => Object.entries(m).sort((a, b) => b[1] - a[1]);

function BarChart({ bars, caption, label }: { bars: { key: string; value: number; title: string }[]; caption: React.ReactNode; label: string }) {
  const max = Math.max(1, ...bars.map((b) => b.value));
  const W = 600;
  const H = 140;
  const gap = bars.length > 24 ? 4 : 6;
  const bw = (W - gap * (bars.length - 1)) / bars.length;
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={label}>
        {bars.map((b, i) => {
          const h = Math.max(b.value > 0 ? 2 : 0, (b.value / max) * (H - 4));
          return (
            <rect key={b.key} x={i * (bw + gap)} y={H - h} width={bw} height={h} rx={1} style={{ fill: "var(--accent)" }} opacity={0.85}>
              <title>{b.title}</title>
            </rect>
          );
        })}
        <line x1={0} x2={W} y1={H - 0.5} y2={H - 0.5} style={{ stroke: "var(--border)" }} />
      </svg>
      <figcaption className="flex justify-between text-[11px] text-(--muted) font-mono mt-2">{caption}</figcaption>
    </figure>
  );
}

function Share({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <li className="grid grid-cols-[minmax(0,7rem)_1fr_4.5rem] items-center gap-3 py-2">
      <span className="text-[15px] sm:text-sm font-light text-(--text) truncate">{label}</span>
      <span className="h-1.5 bg-(--surface) rounded-full overflow-hidden">
        <span className="block h-full bg-(--accent) rounded-full" style={{ width: `${pct}%` }} />
      </span>
      <span className="text-xs text-(--muted) font-mono text-right">
        {nf.format(value)} <span>{pct.toFixed(0)}%</span>
      </span>
    </li>
  );
}

function ShareList({ entries, total }: { entries: [string, number][]; total: number }) {
  return (
    <ul className="border-y border-(--border) divide-y divide-(--border)">
      {entries.map(([k, v]) => (
        <Share key={k} label={k} value={v} total={total} />
      ))}
    </ul>
  );
}

function Tiles({ items }: { items: [string, string][] }) {
  return (
    <dl className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-(--border) border border-(--border) rounded-sm overflow-hidden mb-12">
      {items.map(([value, label]) => (
        <div key={label} className="bg-(--bg) px-4 py-4 flex flex-col-reverse">
          <dt className="text-[11px] text-(--muted) font-mono tracking-wide">{label}</dt>
          <dd className="text-xl font-light text-(--text) font-mono mb-1">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function StatsPage() {
  // Cloudflare 一小時最多抓一次，背景跑不等它（這次用檔案裡現有的）
  void refreshCloudflareIfStale();
  const cf = readCloudflareSummary();
  const cfDays = readCloudflareDays(30);
  const raw = readRawTraffic();
  const bots = readCrawlers();
  const countries = readCountryCounts();
  const visits = countries.reduce((n, [, c]) => n + c, 0);
  const hasCloudflare = cf && cfDays.some((d) => d.pageViews > 0);

  const detail = readDetail();
  const days30 = detail ? lastDays(detail, 30) : [];
  const sum = (rows: typeof days30, k: "views" | "sessions" | "newVisitors") => rows.reduce((n, r) => n + r[k], 0);
  const today = days30.at(-1);
  const days7 = days30.slice(-7);
  const sessions30 = sum(days30, "sessions");
  const new30 = sum(days30, "newVisitors");
  const allSessions = detail ? Object.values(detail.days).reduce((n, d) => n + d.sessions, 0) : 0;
  const referred = detail ? Object.values(detail.referrers).reduce((n, c) => n + c, 0) : 0;
  const deviceTotal = detail ? Object.values(detail.devices).reduce((n, c) => n + c, 0) : 0;

  return (
    <PageShell
      eyebrow="Analytics"
      title={<>訪客分析 &nbsp;·&nbsp; Analytics</>}
      intro="這個網站跑在自己的桌機上，透過 Cloudflare 對外。下面是它的訪客：每天多少人、看哪些頁、從哪裡來、用什麼裝置。只有彙總數字，不記 IP、不記完整網址、不用 cookie。"
    >
      {detail && today && (
        <>
          <Tiles
            items={[
              [nf.format(today.views), "今天瀏覽"],
              [nf.format(sum(days7, "views")), "近 7 天瀏覽"],
              [nf.format(sessions30), "近 30 天造訪"],
              [sessions30 > 0 ? `${Math.round((new30 / sessions30) * 100)}%` : "–", "新訪客比例"],
            ]}
          />

          <section className="mb-12">
            <SectionHeading en="Real visitors">真人訪客 · 近 30 天</SectionHeading>
            <div className="border border-(--border) rounded-sm bg-(--bg) p-4 sm:p-5">
              <BarChart
                label="近 30 天每日真人瀏覽"
                bars={days30.map((d) => ({ key: d.date, value: d.views, title: `${d.date}：${d.views} 次瀏覽 · ${d.sessions} 次造訪 · ${d.newVisitors} 位新訪客` }))}
                caption={
                  <>
                    <span>{days30[0].date}</span>
                    <span>滑鼠移到長條上看當天</span>
                    <span>{today.date}</span>
                  </>
                }
              />
            </div>
            <p className="text-xs text-(--muted) font-light mt-3 leading-relaxed">
              瀏覽＝每看一頁算一次；造訪＝一次瀏覽工作階段（關掉分頁就結束）；新訪客＝這個瀏覽器第一次來。
              要瀏覽器真的執行網頁上的 JavaScript 才算，爬蟲跟掃描器不會出現在這裡。{detail.since} 起開始記。
            </p>
          </section>

          {sorted(detail.pages).length > 0 && (
            <section className="mb-12">
              <SectionHeading en="Top pages">熱門頁面</SectionHeading>
              <ol className="border-y border-(--border) divide-y divide-(--border)">
                {sorted(detail.pages)
                  .slice(0, 10)
                  .map(([path, count], i) => (
                    <li key={path} className="flex items-baseline gap-3 py-2.5">
                      <span className="w-5 text-xs text-(--muted) font-mono shrink-0">{i + 1}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[15px] sm:text-sm font-light text-(--text) truncate">{pageName(path)}</span>
                        <span className="block text-[11px] text-(--muted) font-mono truncate">{path}</span>
                      </span>
                      <span className="w-14 text-right text-xs text-(--muted) font-mono shrink-0">{nf.format(count)}</span>
                    </li>
                  ))}
              </ol>
            </section>
          )}

          {allSessions > 0 && (
            <section className="mb-12">
              <SectionHeading en="Referrers">從哪裡來</SectionHeading>
              <ShareList entries={[["直接進入", allSessions - referred] as [string, number], ...sorted(detail.referrers).slice(0, 9)]} total={allSessions} />
              <p className="text-xs text-(--muted) font-light mt-3 leading-relaxed">
                以造訪計：從哪個網站點連結進來（只記網域）。「直接進入」包含打網址、書籤、LINE／Messenger 這類不帶來源的 App。
              </p>
            </section>
          )}

          {deviceTotal > 0 && (
            <section className="mb-12">
              <SectionHeading en="Devices">裝置、瀏覽器、作業系統</SectionHeading>
              <div className="space-y-8">
                {(
                  [
                    ["裝置", sorted(detail.devices)],
                    ["瀏覽器", sorted(detail.browsers).slice(0, 6)],
                    ["作業系統", sorted(detail.os).slice(0, 6)],
                  ] as [string, [string, number][]][]
                ).map(([label, entries]) => (
                  <div key={label}>
                    <p className="text-[11px] text-(--muted) font-mono tracking-wide mb-1">{label}</p>
                    <ShareList entries={entries} total={deviceTotal} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {detail.hours.some((h) => h > 0) && (
            <section className="mb-12">
              <SectionHeading en="By hour">什麼時候來（台灣時間）</SectionHeading>
              <div className="border border-(--border) rounded-sm bg-(--bg) p-4 sm:p-5">
                <BarChart
                  label="一天 24 小時的瀏覽分布"
                  bars={detail.hours.map((v, h) => ({ key: String(h), value: v, title: `${h}:00–${h}:59：${v} 次瀏覽` }))}
                  caption={
                    <>
                      <span>0 點</span>
                      <span>12 點</span>
                      <span>23 點</span>
                    </>
                  }
                />
              </div>
            </section>
          )}
        </>
      )}

      {countries.length > 0 && (
        <section className="mb-12">
          <SectionHeading en="Visitors by country">真人訪客來自</SectionHeading>
          <ul className="flex flex-wrap gap-2">
            {countries.map(([code, count]) => (
              <li key={code} className="flex items-center gap-2 border border-(--border) rounded-sm px-3 py-1.5 text-sm">
                <span aria-hidden>{countryFlag(code)}</span>
                <span className="text-xs text-(--text) font-light">{regionName.of(code) ?? code}</span>
                <span className="font-mono text-xs text-(--muted)">{nf.format(count)}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-(--muted) font-light mt-3 leading-relaxed">
            共 {nf.format(visits)} 次瀏覽。國家是 Cloudflare 依連線判斷的，只存國碼跟次數。
          </p>
        </section>
      )}

      {hasCloudflare && (
        <section className="mb-12">
          <SectionHeading en="Cloudflare">Cloudflare · 含機器人</SectionHeading>
          <Tiles
            items={[
              [nf.format(cf.last30.uniques), "近 30 天訪客"],
              [nf.format(cf.last30.pageViews), "近 30 天瀏覽"],
              [nf.format(cf.total.pageViews), "累計瀏覽"],
              [cf.since, "開始統計"],
            ]}
          />
          <div className="border border-(--border) rounded-sm bg-(--bg) p-4 sm:p-5 -mt-8">
            <BarChart
              label="Cloudflare 近 30 天每日頁面瀏覽"
              bars={cfDays.map((d) => ({ key: d.date, value: d.pageViews, title: `${d.date}：${d.pageViews} 次瀏覽 · ${d.uniques} 訪客` }))}
              caption={
                <>
                  <span>{cfDays[0].date}</span>
                  <span>最高 {nf.format(Math.max(...cfDays.map((d) => d.pageViews)))} 次／天</span>
                  <span>{cfDays.at(-1)!.date}</span>
                </>
              }
            />
          </div>
          <p className="text-xs text-(--muted) font-light mt-3 leading-relaxed">
            所有經過 Cloudflare 的流量，包含快取直接回應、沒到桌機的請求。訪客＝當天不重複 IP，含機器人。每小時更新。
          </p>
        </section>
      )}

      {raw && raw.total > 0 && (
        <section className="mb-12">
          <SectionHeading en="Requests reaching the server">到達主機的請求</SectionHeading>
          <ul className="border-y border-(--border) divide-y divide-(--border)">
            <Share label="瀏覽器" value={raw.browser} total={raw.total} />
            <Share label="AI 爬蟲" value={raw.ai} total={raw.total} />
            <Share label="搜尋引擎" value={raw.search} total={raw.total} />
            <Share label="其他機器人" value={raw.bot} total={raw.total} />
          </ul>
          <p className="text-xs text-(--muted) font-light mt-3 leading-relaxed">
            {raw.since} 起，桌機上的 Node.js 收到的頁面請求（共 {nf.format(raw.total)} 次），依 User-Agent 分類。
            11/09 起 Cloudflare 快取靜態頁，命中快取的請求不會到桌機，所以這裡只數得到一部分。
          </p>

          {bots.length > 0 && (
            <>
              <SectionHeading en="Crawlers" className="mt-10 mb-4">
                爬蟲排行
              </SectionHeading>
              <ol className="border-y border-(--border) divide-y divide-(--border)">
                {bots.slice(0, 10).map((b, i) => (
                  <li key={b.name} className="flex items-baseline gap-3 py-2.5">
                    <span className="w-5 text-xs text-(--muted) font-mono">{i + 1}</span>
                    <span className="flex-1 text-[15px] sm:text-sm font-light text-(--text) font-mono">{b.name}</span>
                    <span className={`text-[11px] font-mono px-1.5 rounded-sm ${b.kind === "ai" ? "text-(--accent) bg-(--accent-lt)" : "text-(--muted)"}`}>
                      {KIND_LABEL[b.kind]}
                    </span>
                    <span className="w-14 text-right text-xs text-(--muted) font-mono">{nf.format(b.count)}</span>
                  </li>
                ))}
              </ol>
            </>
          )}
        </section>
      )}

      <section className="mb-4">
        <SectionHeading en="How it's counted">幾種數字，各自怎麼算</SectionHeading>
        <BulletList
          items={[
            "真人訪客：瀏覽器執行網頁上的 JavaScript 才回報，最接近真人。新訪客靠瀏覽器自己記「來過沒」，不是 cookie、也不會送出任何 ID",
            "Cloudflare：所有經過 Cloudflare 的流量，最接近「有多少請求」，但機器人也在裡面",
            "到達主機的請求：桌機收到的頁面請求，看得到 AI 爬蟲、搜尋引擎、掃描器；有快取之後只剩沒命中的",
            "幾種數字對不起來是正常的：算的東西本來就不一樣",
          ]}
        />
      </section>
    </PageShell>
  );
}
