import type { Metadata } from "next";
import { withShare } from "@/lib/share-meta";
import PageShell from "@/components/ui/PageShell";
import SectionHeading from "@/components/ui/SectionHeading";
import BulletList from "@/components/ui/BulletList";
import { readCloudflareDays, readCloudflareSummary, refreshCloudflareIfStale } from "@/lib/cloudflare-analytics";
import { countryFlag, readCountryCounts, readCrawlers, readRawTraffic, type BotKind } from "@/lib/site-stats";

// 公開的流量頁（TODO「公開的 /stats 頁」，2026-11-09）：這個網站是自己桌機架的，流量本身就是作品的一部分。
// 資料跟頁尾同一份（lib/site-stats.ts、lib/cloudflare-analytics.ts），只有彙總數字，沒有 IP／UA／網址。
// 每次請求現讀資料檔（資料一直在變，不能 build 時定死）；所以也沒有 Markdown 版（那是 build 時預先產生的）。
export const dynamic = "force-dynamic";

export const metadata: Metadata = withShare({
  title: "流量統計 · Stats — PINGWEI LI",
  description: "這個自架網站的流量：Cloudflare 近 30 天趨勢、AI 爬蟲與搜尋引擎、真人訪客來自哪些國家。",
  alternates: { canonical: "/stats" },
});

const nf = new Intl.NumberFormat("en-US");
// 國名用瀏覽器內建的翻譯表（Intl），不用自己維護對照表；Windows 不顯示國旗 emoji 時至少看得懂
const regionName = new Intl.DisplayNames(["zh-TW"], { type: "region" });
const KIND_LABEL: Record<BotKind, string> = { ai: "AI", search: "搜尋引擎", bot: "其他" };

function TrendChart({ days }: { days: { date: string; pageViews: number; uniques: number }[] }) {
  const max = Math.max(1, ...days.map((d) => d.pageViews));
  const W = 600;
  const H = 160;
  const gap = 4;
  const bw = (W - gap * (days.length - 1)) / days.length;
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={`近 ${days.length} 天每日頁面瀏覽，最高 ${max} 次`}>
        {days.map((d, i) => {
          const h = Math.max(d.pageViews > 0 ? 2 : 0, (d.pageViews / max) * (H - 4));
          return (
            <rect key={d.date} x={i * (bw + gap)} y={H - h} width={bw} height={h} rx={1} style={{ fill: "var(--accent)" }} opacity={0.85}>
              <title>{`${d.date}：${d.pageViews} 次瀏覽 · ${d.uniques} 訪客`}</title>
            </rect>
          );
        })}
        <line x1={0} x2={W} y1={H - 0.5} y2={H - 0.5} style={{ stroke: "var(--border)" }} />
      </svg>
      <figcaption className="flex justify-between text-[11px] text-(--muted) font-mono mt-2">
        <span>{days[0].date}</span>
        <span>最高 {nf.format(max)} 次／天</span>
        <span>{days.at(-1)!.date}</span>
      </figcaption>
    </figure>
  );
}

function Share({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <li className="grid grid-cols-[6.5rem_1fr_4.5rem] items-center gap-3 py-2">
      <span className="text-[15px] sm:text-sm font-light text-(--text)">{label}</span>
      <span className="h-1.5 bg-(--surface) rounded-full overflow-hidden">
        <span className="block h-full bg-(--accent) rounded-full" style={{ width: `${pct}%` }} />
      </span>
      <span className="text-xs text-(--muted) font-mono text-right">
        {nf.format(value)} <span>{pct.toFixed(0)}%</span>
      </span>
    </li>
  );
}

export default function StatsPage() {
  // Cloudflare 一小時最多抓一次，背景跑不等它（這次用檔案裡現有的）
  void refreshCloudflareIfStale();
  const cf = readCloudflareSummary();
  const days = readCloudflareDays(30);
  const raw = readRawTraffic();
  const bots = readCrawlers();
  const countries = readCountryCounts();
  const visits = countries.reduce((n, [, c]) => n + c, 0);
  const hasCloudflare = cf && days.some((d) => d.pageViews > 0);

  return (
    <PageShell
      eyebrow="Stats"
      title={<>流量統計 &nbsp;·&nbsp; Stats</>}
      intro="這個網站跑在自己的桌機上，透過 Cloudflare Tunnel 對外。下面是它實際的流量——誰來看、從哪裡來、有多少是 AI 跟搜尋引擎的爬蟲。只有彙總數字，不記 IP、不記瀏覽器資訊。"
    >
      {hasCloudflare && (
        <>
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-(--border) border border-(--border) rounded-sm overflow-hidden mb-12">
            {[
              [nf.format(cf.last30.uniques), "近 30 天訪客"],
              [nf.format(cf.last30.pageViews), "近 30 天瀏覽"],
              [nf.format(cf.total.pageViews), "累計瀏覽"],
              [cf.since, "開始統計"],
            ].map(([value, label]) => (
              <div key={label} className="bg-(--bg) px-4 py-4 flex flex-col-reverse">
                <dt className="text-[11px] text-(--muted) font-mono tracking-wide">{label}</dt>
                <dd className="text-xl font-light text-(--text) font-mono mb-1">{value}</dd>
              </div>
            ))}
          </dl>

          <section className="mb-12">
            <SectionHeading en="Last 30 days">近 30 天</SectionHeading>
            <div className="border border-(--border) rounded-sm bg-(--bg) p-4 sm:p-5">
              <TrendChart days={days} />
            </div>
            <p className="text-xs text-(--muted) font-light mt-3 leading-relaxed">
              每天的頁面瀏覽，滑鼠移到長條上看當天數字。訪客＝當天不重複 IP，含機器人。資料來自 Cloudflare，每小時更新。
            </p>
          </section>
        </>
      )}

      {raw && raw.total > 0 && (
        <section className="mb-12">
          <SectionHeading en="Who's reading">誰在讀這個網站</SectionHeading>
          <ul className="border-y border-(--border) divide-y divide-(--border)">
            <Share label="瀏覽器" value={raw.browser} total={raw.total} />
            <Share label="AI 爬蟲" value={raw.ai} total={raw.total} />
            <Share label="搜尋引擎" value={raw.search} total={raw.total} />
            <Share label="其他機器人" value={raw.bot} total={raw.total} />
          </ul>
          <p className="text-xs text-(--muted) font-light mt-3 leading-relaxed">
            {raw.since} 起，主機收到的每一個頁面請求（共 {nf.format(raw.total)} 次），依 User-Agent 分類。
            「其他機器人」包含掃描 <code className="font-mono">/wp-admin</code>、<code className="font-mono">/.env</code> 找漏洞的程式；
            假裝成一般瀏覽器的也會被算進「瀏覽器」。
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
                    <span
                      className={`text-[11px] font-mono px-1.5 rounded-sm ${b.kind === "ai" ? "text-(--accent) bg-(--accent-lt)" : "text-(--muted)"}`}
                    >
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
            共 {nf.format(visits)} 次造訪。只有瀏覽器真的執行了網頁上的 JavaScript 才算，不執行 JS 的爬蟲跟掃描器不會出現在這裡。
            國家是 Cloudflare 依連線判斷的，只存國碼跟次數。
          </p>
        </section>
      )}

      <section className="mb-4">
        <SectionHeading en="How it's counted">三種數字，三種算法</SectionHeading>
        <BulletList
          items={[
            "Cloudflare：所有經過 Cloudflare 的流量，包含沒到主機就被快取回應的。最接近「有多少人來過」，但機器人也在裡面",
            "誰在讀：主機上的 Node.js 對每個頁面請求計數，看得到 AI 爬蟲、搜尋引擎、掃描器各佔多少",
            "真人訪客：要瀏覽器執行 JavaScript 才回報，最保守、最接近真人",
            "三種數字對不起來是正常的：算的東西本來就不一樣",
          ]}
        />
      </section>
    </PageShell>
  );
}
