import type { Metadata } from "next";
import Link from "next/link";
import { dataFile } from "@/lib/data-file";
import { withShare } from "@/lib/site/share-meta";
import PageShell from "@/components/layout/PageShell";
import SectionHeading from "@/components/ui/SectionHeading";
import BulletList from "@/components/ui/BulletList";
import RadarLive from "@/components/live/RadarLive";
import { BarChart, ShareList, Tiles } from "@/components/ui/StatCharts";
import { detail, dex, readState } from "../../../scripts/lib/radar.js";
import { DEX_HIDDEN } from "@/lib/live/aircraft-dex";
import { ensureRadarReport, readRadarReport } from "@/lib/live/radar-report";
import { nf, monthDay as md } from "@/lib/format";
import { Suspense } from "react";
import { after, connection } from "next/server";
import LoadingBlock from "@/components/ui/LoadingBlock";

// 自家雷達頁（2026-11-21，使用者：「自家雷達 · My Radar 沒能給更好看的頁面嗎?」）。
// 資料：scripts/server.js 每 30 秒在區網讀雷達寫的 data/radar.json（scripts/lib/radar.js 的 detail()）。
// 跟 /stats 一樣每次請求現讀檔（Cache Components：頁首是外殼、數字串流進來）→ 沒有 Markdown 版（Markdown 是 build 時預先產生的，會是舊數字）。
// ⚠️ 隱私：接收器在使用者家。只放數字、航空公司、時段——不放地圖、座標、涵蓋範圍、最遠距離，
//    也不寫離哪個機場多近（CLAUDE.md「自家 FR24 雷達」）。

export const metadata: Metadata = withShare({
  title: "自架 ADS-B 飛機雷達：樹莓派＋SDR 接收、分享給 Flightradar24 · My Radar — PINGWEI LI",
  description: "家裡自己架的 ADS-B 接收器（樹莓派＋SDR），即時顯示現在收到幾架飛機、一天的節奏、航空公司，資料同時分享給 Flightradar24。",
  alternates: { canonical: "/radar" },
}, { ownImage: true });

const radarFile = () => dataFile("RADAR_FILE", "radar.json");
// 讀檔＋算現在的數字放在元件外面：元件裡直接呼叫 Date.now() 會被 React 的 purity 規則擋（每次請求重算本來就是這頁要的）
const loadRadar = () => detail(readState(radarFile()), Date.now());
/** detail().flightsNow 的一筆（radar.js 是 JS，型別在這裡補） */
type NowFlight = { flight: string; alt: number | null; airlineName: string | null; typeName: string | null };

async function RadarContent() {
  await connection(); // Cache Components：下面讀的都是即時資料（TODO C13）
  // AI 日報（TODO H6）：昨天的還沒寫就在回應送出後寫一份（lib/live/radar-report.ts），這次先顯示已有的
  after(() => ensureRadarReport());
  const report = readRadarReport();
  const d = loadRadar();
  const dexCount = (dex(readState(radarFile())) as { code: string }[]).filter((e) => !DEX_HIDDEN.has(e.code)).length;

  return (
    <Shell>
      {!("daily" in d) ? (
        <p className="text-sm text-(--muted) font-light">雷達資料暫時讀不到，晚點再來看看。</p>
      ) : (
        <>
          <RadarLive initial={{ online: Boolean(d.online), aircraftNow: d.aircraftNow ?? 0, lastAircraftAt: d.lastAircraftAt ?? null }} />

          <Tiles
            items={[
              [`${nf.format(d.today?.unique ?? 0)} 架`, "今天收到 · Today"],
              [`${nf.format(d.today?.peak ?? 0)} 架`, "今天最多同時 · Peak"],
              [`${nf.format(d.week?.unique ?? 0)} 架次`, "近 7 天 · 7 days", "每天收到幾架不同的飛機，7 天加起來。同一架飛機隔天又飛過會再算一次，所以叫「架次」。"],
              [d.week?.uptime != null ? `${d.week.uptime}%` : "–", "在線率 · Uptime", "網站每 30 秒問一次接收器，近 7 天裡有回應、而且有在接收訊號的比例。"],
            ]}
          />

          {/* 日報（TODO H6）：數字由程式算好，本機 Gemma 負責寫成句子；Ollama 沒開時是固定句型。只有數量、時段、航空公司、機型 */}
          {report && (
            <section className="mb-12" aria-label="日報">
              <SectionHeading en="Daily note">{md(report.date)}の日報</SectionHeading>
              <p className="text-[15px] sm:text-sm font-light leading-[1.9] sm:leading-relaxed text-(--text)">{report.text}</p>
              <p className="mt-2 text-xs text-(--muted) font-light">
                {report.by === "ai"
                  ? "這段話是跑在站長桌機上的本地 AI（Gemma 3）寫的，數字都是程式先算好再交給它，寫完會檢查有沒有冒出沒給它的數字。"
                  : "這段話是程式用固定句型寫的（本地 AI 當時沒開）。"}
                每天第一位來看的人會觸發當天的日報。
              </p>
            </section>
          )}

          {/* 機體図鑑（2026-11-25）入口 */}
          <Link
            href="/radar/zukan"
            className="group mb-12 flex items-center justify-between border border-(--border) rounded-sm px-5 py-4 hover:border-(--accent) transition-colors"
          >
            <span>
              <span className="block text-base font-light text-(--text) group-hover:text-(--accent) transition-colors">機體図鑑 · Zukan</span>
              <span className="block mt-0.5 text-[13px] font-light text-(--muted)">收到過的機型點亮，目前 {dexCount} 種</span>
            </span>
            <span aria-hidden className="text-(--muted) group-hover:text-(--accent) transition-colors">→</span>
          </Link>

          {/* 現在收到的航班（決策表 Q1，2026-11-25）：航班代碼、機型、高度（四捨五入到 1,000 ft），不放位置、識別碼 */}
          {d.flightsNow.length > 0 && (
            <section className="mb-12">
              <SectionHeading en="Now">現在收到的航班</SectionHeading>
              <ul className="divide-y divide-(--border) border-y border-(--border)">
                {(d.flightsNow as NowFlight[]).map((f) => (
                  <li key={f.flight} className="flex items-baseline gap-3 py-2.5 text-sm font-light">
                    <span className="font-mono text-(--text) w-20 shrink-0">{f.flight}</span>
                    <span className="text-(--muted) truncate min-w-0 flex-1">
                      {[f.airlineName, f.typeName].filter(Boolean).join(" · ") || "–"}
                    </span>
                    <span className="font-mono text-(--muted) shrink-0">
                      {f.alt === null ? "–" : f.alt === 0 ? "地面" : `${nf.format(f.alt)} ft`}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-(--muted) font-light">
                高度四捨五入到 1,000 英尺；不顯示位置、距離跟飛機識別碼。頁面每次打開時更新。
              </p>
            </section>
          )}

          <section className="mb-12">
            <SectionHeading en="Hourly">一天的節奏</SectionHeading>
            <BarChart
              label="每小時最多同時收到幾架飛機（近 7 天平均）"
              bars={d.hours.map((v, h) => ({
                key: String(h),
                value: v ?? 0,
                title: v == null ? `${h} 時：還沒有資料` : `${h} 時：平均最多同時 ${v} 架`,
              }))}
              caption={
                <>
                  <span>0 時</span>
                  <span>6 時</span>
                  <span>12 時</span>
                  <span>18 時</span>
                  <span>23 時</span>
                </>
              }
            />
            <p className="text-xs text-(--muted) font-light mt-3">每小時最多同時收到幾架，近 7 天平均。深夜航班本來就少。</p>
          </section>

          <section className="mb-12">
            <SectionHeading en="Daily">近 30 天</SectionHeading>
            <BarChart
              label="近 30 天每天收到幾架飛機"
              bars={d.daily.map((v) => ({
                key: v.date,
                value: v.unique ?? 0,
                title: v.unique == null ? `${md(v.date)}：沒有資料` : `${md(v.date)}：${v.unique} 架，最多同時 ${v.peak} 架，在線 ${v.uptime}%`,
              }))}
              caption={
                <>
                  <span>{md(d.daily[0].date)}</span>
                  <span>{md(d.daily.at(-1)!.date)}</span>
                </>
              }
            />
            <p className="text-xs text-(--muted) font-light mt-3">
              每天收到幾架不重複的飛機。{d.since && `從 ${md(d.since)} 開始記錄，`}累計 {nf.format(d.total.unique)} 架次、最多同時 {nf.format(d.total.peak)} 架。
            </p>
          </section>

          {d.weekAirlines.length > 0 && (
            <section className="mb-12">
              <SectionHeading en="Airlines">航空公司（近 7 天）</SectionHeading>
              <ShareList
                entries={d.weekAirlines.map((a) => [a.name, a.n] as [string, number])}
                total={d.weekAirlines.reduce((n, a) => n + a.n, 0)}
              />
              <p className="text-xs text-(--muted) font-light mt-3">從呼號判斷（例：CAL＝中華航空）；沒有廣播呼號的、軍機、私人飛機不算在內。</p>
            </section>
          )}

          {d.weekTypes.length > 0 && (
            <section className="mb-12">
              <SectionHeading en="Aircraft">機型（近 7 天）</SectionHeading>
              <ShareList
                entries={d.weekTypes.map((t) => [t.name === t.code ? t.code : `${t.name}（${t.code}）`, t.n] as [string, number])}
                total={d.weekTypes.reduce((n, t) => n + t.n, 0)}
              />
              <p className="text-xs text-(--muted) font-light mt-3">
                用飛機廣播的識別碼查 <a href="https://www.adsbdb.com/" className="underline underline-offset-4" target="_blank" rel="noopener noreferrer">adsbdb</a> 的機型資料；只算前 10 名，查不到的不算。
              </p>
            </section>
          )}

          <section>
            <SectionHeading en="About">關於這台雷達</SectionHeading>
            <BulletList
              items={[
                "樹莓派（Flightradar24 的 Pi24 系統）＋ DVB-T 電視棒當 SDR 接收器，fr24feed 解碼後即時送到 Flightradar24",
                "這個網站的伺服器每 30 秒在家裡的區網讀一次，只留數字：現在、今天、每小時幾架，跟航空公司、機型",
                "不公開位置：不畫地圖、不算涵蓋範圍——把收到的飛機位置畫出來，就看得出接收器在哪",
                "離線超過 15 分鐘，或白天 2 小時一架都沒收到，會自動寄信給我",
              ]}
            />
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
              <Link href="/projects/fr24-receiver" className="inline-block py-3 -my-3 text-xs text-(--accent) font-mono tracking-wide underline underline-offset-4">
                怎麼架的、怎麼除錯的 · How I built it →
              </Link>
              <Link href="/flights" className="inline-block py-3 -my-3 text-xs text-(--muted) hover:text-(--accent) transition-colors font-mono tracking-wide">
                我自己搭過的航班 · Flight Log →
              </Link>
            </div>
          </section>
        </>
      )}
    </Shell>
  );
}

// 頁首（標題、說明）是 build 時就畫好的外殼；內容讀即時資料，訪客打開時才串流補進來（Cache Components，TODO C13）
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <PageShell
      backHref="/flights"
      backLabel="返回飛行紀錄"
      eyebrow="My Radar"
      title={<>自家雷達 &nbsp;·&nbsp; My Radar</>}
      intro="家裡自己架的 ADS-B 接收器：收下飛機在 1090 MHz 廣播的位置和高度，解碼後畫在這裡，也分享給 Flightradar24。"
    >
      {children}
    </PageShell>
  );
}

export default function RadarPage() {
  return (
    <Suspense
      fallback={
        <Shell>
          <LoadingBlock label="讀取雷達資料中…" minHeight={1100} />
        </Shell>
      }
    >
      <RadarContent />
    </Suspense>
  );
}
