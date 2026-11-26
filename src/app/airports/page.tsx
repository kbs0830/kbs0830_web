import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { withShare } from "@/lib/site/share-meta";
import PageShell from "@/components/layout/PageShell";
import SectionHeading from "@/components/ui/SectionHeading";
import Tabs from "@/components/ui/Tabs";
import AutoRefresh from "@/components/live/AutoRefresh";
import LoadingBlock from "@/components/ui/LoadingBlock";
import { getBoards, khhFuk, upcoming, type Flight } from "@/lib/travel/airport-board";
import { summarizeDelays } from "@/lib/travel/airport-delays";
import { readDelays } from "@/lib/travel/airport-delay-recorder";
import { nf } from "@/lib/format";

// 機場即時時刻表（TODO D6，2026-11-22）：小港（KHH）跟福岡（FUK），最上面是高雄 ⇄ 福岡的直飛班機。
// 資料由伺服器 3 分鐘抓一次（lib/travel/airport-board.ts）。Cache Components：標題、說明、資料來源是 build 時畫好的外殼，
// 看板跟延誤統計在 <LiveBoards>（先 connection() 才讀「現在」），串流補進來。沒有 Markdown 版。
// 只放機場公開的航班表，跟自家雷達無關（雷達不公開位置，這頁也不拿雷達資料來比對）。

export const metadata: Metadata = withShare(
  {
    title: "高雄小港機場、福岡機場即時航班時刻表（出發・抵達・延誤） · Airport Boards — PINGWEI LI",
    description: "高雄小港、福岡兩個機場的即時航班：出發、抵達、延誤，還有今天高雄 ⇄ 福岡的直飛班機。每 3 分鐘更新。",
    alternates: { canonical: "/airports" },
  },
  { ownImage: true },
);

const hm = (tz: string, ms: number) => new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false }).format(ms);

// 讀資料＋算「現在」放元件外面（元件裡呼叫 Date.now() 會被 React 的 purity 規則擋）
async function load() {
  const { khh, fuk } = await getBoards();
  const now = Date.now();
  return { khh, fuk, nowKhh: hm("Asia/Taipei", now), nowFuk: hm("Asia/Tokyo", now), delays: summarizeDelays(readDelays(), now) };
}

const tone = (f: Flight) =>
  f.kind === "cancelled" || f.kind === "delayed" ? "text-(--warn)" : f.kind === "active" ? "text-(--accent)" : f.kind === "done" ? "text-(--muted)" : "text-(--text)";

function Time({ f }: { f: Flight }) {
  return (
    <span className="font-mono">
      <span className={f.changed ? "text-(--muted) line-through decoration-(--border)" : "text-(--text)"}>{f.sched}</span>
      {f.changed && <span className={`ml-1.5 ${f.kind === "delayed" ? "text-(--warn)" : "text-(--text)"}`}>{f.changed}</span>}
    </span>
  );
}

function BoardTable({ flights, dir, empty }: { flights: Flight[]; dir: "dep" | "arr"; empty: string }) {
  if (!flights.length) return <p className="text-sm text-(--muted) font-light py-4">{empty}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm font-light">
        <thead>
          <tr className="text-[11px] text-(--muted) font-mono tracking-wide text-left border-b border-(--border)">
            <th className="py-2 pr-3 font-normal">時間</th>
            <th className="py-2 pr-3 font-normal">航班</th>
            <th className="py-2 pr-3 font-normal">{dir === "dep" ? "目的地" : "出發地"}</th>
            <th className="py-2 pr-3 font-normal">狀態</th>
            <th className="py-2 font-normal hidden sm:table-cell">登機門</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-(--border)">
          {flights.map((f) => (
            <tr key={`${f.code}-${f.sched}-${f.dir}`}>
              <td className="py-2.5 pr-3 whitespace-nowrap">
                <Time f={f} />
              </td>
              <td className="py-2.5 pr-3 whitespace-nowrap" title={[f.airline, f.aircraft].filter(Boolean).join(" · ")}>
                <span className="font-mono text-(--text)">{f.code}</span>
                {f.codeshares.length > 0 && <span className="hidden sm:block text-[11px] text-(--muted) font-mono">{f.codeshares.slice(0, 3).join(" ")}</span>}
              </td>
              <td className="py-2.5 pr-3 text-(--text) whitespace-nowrap">
                {f.place}
                {!f.intl && <span className="hidden sm:inline ml-1.5 text-[11px] text-(--muted)">國內</span>}
              </td>
              <td className={`py-2.5 pr-3 whitespace-nowrap ${tone(f)}`}>
                {f.status}
                {f.note && <span className="block text-[11px] text-(--muted)">{f.note}</span>}
              </td>
              <td className="py-2.5 font-mono text-(--muted) hidden sm:table-cell">{f.gate ?? "–"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Direct({ title, from, flights }: { title: string; from: string; flights: Flight[] }) {
  return (
    <div className="border border-(--border) rounded-sm p-5">
      <p className="text-[11px] text-(--muted) font-mono tracking-wide mb-3">{title}</p>
      {flights.length === 0 ? (
        <p className="text-sm text-(--muted) font-light">今天沒有直飛班機</p>
      ) : (
        <ul className="space-y-2">
          {flights.map((f) => (
            <li key={f.code + f.sched} className="flex items-baseline gap-3 text-sm font-light flex-wrap">
              <Time f={f} />
              <span className="font-mono text-(--text)" title={f.airline}>
                {f.code}
              </span>
              <span className={tone(f)}>{f.status}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="text-[11px] text-(--muted) font-mono mt-3">{from}當地時間起飛</p>
    </div>
  );
}

/** 即時的部分：看板、直飛、延誤統計（訪客打開時才讀） */
async function LiveBoards() {
  await connection();
  const { khh, fuk, nowKhh, nowFuk, delays } = await load();
  const direct = khhFuk(khh?.value ?? null, fuk?.value ?? null);
  const board = (list: Flight[] | undefined, dir: "dep" | "arr", now: string) => upcoming((list ?? []).filter((f) => f.dir === dir), now);

  return (
    <>
      <section className="mb-14">
        <SectionHeading en="KHH ⇄ FUK">高雄 ⇄ 福岡</SectionHeading>
        {khh || fuk ? (
          <div className="grid sm:grid-cols-2 gap-4">
            <Direct title="小港 → 福岡" from="高雄" flights={direct.toFuk} />
            <Direct title="福岡 → 小港" from="福岡" flights={direct.toKhh} />
          </div>
        ) : (
          <p className="text-sm text-(--muted) font-light">航班資料暫時讀不到，晚點再來看看。</p>
        )}
      </section>

      {khh && (
        <section className="mb-14">
          <SectionHeading en="Kaohsiung KHH">小港機場</SectionHeading>
          <p className="text-xs text-(--muted) font-mono mb-4">
            現在 {nowKhh}（台灣時間）· 接下來的班機 · 資料 {hm("Asia/Taipei", khh.at)}
            {khh.stale && "（暫時讀不到最新的）"}
          </p>
          <Tabs
            label="小港機場出發／抵達"
            items={[
              { key: "khh-dep", label: "出發", labelEn: "Departures", panel: <BoardTable dir="dep" flights={board(khh.value, "dep", nowKhh)} empty="今天的出發班機都飛走了" /> },
              { key: "khh-arr", label: "抵達", labelEn: "Arrivals", panel: <BoardTable dir="arr" flights={board(khh.value, "arr", nowKhh)} empty="今天的抵達班機都到了" /> },
            ]}
          />
        </section>
      )}

      {fuk && (
        <section className="mb-14">
          <SectionHeading en="Fukuoka FUK">福岡空港</SectionHeading>
          <p className="text-xs text-(--muted) font-mono mb-4">
            現在 {nowFuk}（日本時間）· 接下來的班機 · 資料 {hm("Asia/Tokyo", fuk.at)}
            {fuk.stale && "（暫時讀不到最新的）"}
          </p>
          <Tabs
            label="福岡空港出發／抵達"
            items={[
              { key: "fuk-dep", label: "出発", labelEn: "Departures", panel: <BoardTable dir="dep" flights={board(fuk.value, "dep", nowFuk)} empty="今天的出發班機都飛走了" /> },
              { key: "fuk-arr", label: "到着", labelEn: "Arrivals", panel: <BoardTable dir="arr" flights={board(fuk.value, "arr", nowFuk)} empty="今天的抵達班機都到了" /> },
            ]}
          />
        </section>
      )}

      {/* 小港延誤統計（決策表 J3，2026-11-25 開始記）：累積滿 7 天才顯示，資料太少的排名沒有意義 */}
      {delays.days >= 7 && delays.flights > 0 && (
        <section className="mb-14">
          <SectionHeading en="Delays">小港延誤統計（近 30 天）</SectionHeading>
          <p className="text-sm font-light text-(--text) mb-6">
            {delays.days} 天、{nf.format(delays.flights)} 班：準點率{" "}
            <span className="font-mono text-(--accent)">{delays.onTimePct ?? "–"}%</span>
            （晚 15 分鐘以內算準點）{delays.cancelled > 0 && `，取消 ${delays.cancelled} 班`}
          </p>
          {delays.worst.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-light">
                <thead>
                  <tr className="text-[11px] text-(--muted) font-mono tracking-wide text-left border-b border-(--border)">
                    <th className="py-2 pr-3 font-normal">航班</th>
                    <th className="py-2 pr-3 font-normal">出發／抵達</th>
                    <th className="py-2 pr-3 font-normal text-right">平均晚</th>
                    <th className="py-2 font-normal text-right">延誤次數</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--border)">
                  {delays.worst.map((w) => (
                    <tr key={`${w.code}-${w.dir}`}>
                      <td className="py-2.5 pr-3 font-mono text-(--text)">{w.code}</td>
                      <td className="py-2.5 pr-3 text-(--text)">
                        {w.dir === "dep" ? "往" : "從"} {w.place}
                      </td>
                      <td className="py-2.5 pr-3 text-right font-mono text-(--warn)">{w.avgDelay} 分</td>
                      <td className="py-2.5 text-right font-mono text-(--muted)">
                        {w.lateCount}／{w.n}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 text-xs text-(--muted) font-light">機場網站只給今天的看板，這是這個網站每 20 分鐘自己記下來的，官方沒有這份資料。至少飛過 5 次的航班才排。</p>
        </section>
      )}

    </>
  );
}

export default function AirportsPage() {
  return (
    <PageShell
      backHref="/flights"
      backLabel="返回飛行紀錄"
      eyebrow="Airport Boards"
      title={<>機場時刻表 &nbsp;·&nbsp; Airport Boards</>}
      intro="小港和福岡的即時航班看板——我最常在這兩個機場之間跑。每 3 分鐘更新，開著會自己刷新。"
    >
      <AutoRefresh everyMs={3 * 60_000} />

      <Suspense fallback={<LoadingBlock label="讀取航班中…" minHeight={900} />}>
        <LiveBoards />
      </Suspense>

      <section>
        <SectionHeading en="Data">資料來源</SectionHeading>
        <ul className="text-xs text-(--muted) font-light leading-relaxed space-y-1.5">
          <li>小港：高雄國際航空站的政府開放資料（國際線、國內線即時航班）</li>
          <li>福岡：福岡空港官網航班頁的資料；國內線城市名照官網的日文漢字</li>
          <li>每個分頁最多 30 班；表定時間被劃掉、旁邊的是預計／實際時間</li>
        </ul>
        <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
          <Link href="/flights" className="inline-block py-3 -my-3 text-xs text-(--accent) font-mono tracking-wide underline underline-offset-4">
            我自己搭過的航班 · Flight Log →
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
