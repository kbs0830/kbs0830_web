import type { Metadata } from "next";
import Link from "next/link";
import { withShare } from "@/lib/share-meta";
import PageShell from "@/components/ui/PageShell";
import SectionHeading from "@/components/ui/SectionHeading";
import AutoRefresh from "@/components/ui/AutoRefresh";
import ToolNote from "@/components/tools/ToolNote";
import { getBoards, taiwanFuk, type Flight } from "@/lib/airport-board";

// 台灣 ⇄ 福岡直飛（TODO J2，2026-11-24，使用者把「高雄 ⇄ 福岡」改成「台灣各機場」）。
// 福岡空港的看板（/airports 已經在抓、3 分鐘快取）本來就有每班的出發／抵達機場，篩出台灣的就是全部直飛，不用另外接桃園機場。
export const dynamic = "force-dynamic";

export const metadata: Metadata = withShare({
  title: "台灣 ⇄ 福岡直飛班機（今天）：桃園、高雄、台中 · TW⇄FUK — PINGWEI LI",
  description: "今天台灣各機場跟福岡之間的全部直飛班機：桃園、高雄、台中⋯⋯幾點到、幾點飛、哪家航空、有沒有延誤。資料來自福岡空港，每 3 分鐘更新。",
  alternates: { canonical: "/tools/taiwan-fukuoka" },
});

const tone = (f: Flight) =>
  f.kind === "cancelled" || f.kind === "delayed" ? "text-(--warn)" : f.kind === "active" ? "text-(--accent)" : f.kind === "done" ? "text-(--muted)" : "text-(--text)";

function List({ title, flights }: { title: string; flights: Flight[] }) {
  return (
    <div className="border border-(--border) rounded-sm p-5">
      <p className="text-[11px] text-(--muted) font-mono tracking-wide mb-3">{title}</p>
      {flights.length === 0 ? (
        <p className="text-sm text-(--muted) font-light">今天沒有班機</p>
      ) : (
        <ul className="space-y-2.5">
          {flights.map((f) => (
            <li key={f.code + f.sched} className="flex items-baseline gap-3 text-sm font-light flex-wrap">
              <span className="font-mono">
                <span className={f.changed ? "text-(--muted) line-through decoration-(--border)" : "text-(--text)"}>{f.sched}</span>
                {f.changed && <span className={`ml-1.5 ${f.kind === "delayed" ? "text-(--warn)" : "text-(--text)"}`}>{f.changed}</span>}
              </span>
              <span className="font-mono text-(--text)">{f.code}</span>
              <span className="text-(--muted) text-xs">{f.airline}</span>
              <span className={`ml-auto ${tone(f)}`}>{f.status}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function TaiwanFukuokaPage() {
  const { fuk } = await getBoards();
  const groups = taiwanFuk(fuk?.value ?? null);
  const total = groups.reduce((n, g) => n + g.toFuk.length + g.fromFuk.length, 0);

  return (
    <PageShell
      backHref="/tools"
      backLabel="返回小工具"
      eyebrow="Tools · TW ⇄ FUK"
      title={<>台灣 ⇄ 福岡直飛</>}
      intro="今天台灣各機場跟福岡之間的全部直飛班機。時間都是福岡（日本）時間，比台灣快 1 小時；開著這頁會自己刷新。"
    >
      <AutoRefresh everyMs={3 * 60_000} />
      {!fuk ? (
        <p className="text-sm text-(--muted) font-light">福岡空港的航班資料暫時讀不到，晚點再來看看。</p>
      ) : (
        <>
          <p className="text-sm font-light text-(--text) mb-10">
            今天共 <span className="font-mono text-(--accent)">{total}</span> 班：
            {groups.map((g) => `${g.name} ${g.toFuk.length + g.fromFuk.length} 班`).join("、") || "沒有直飛班機"}
          </p>
          {groups.map((g) => (
            <section key={g.code} className="mb-12">
              <SectionHeading en={`${g.code} ⇄ FUK`}>{g.name} ⇄ 福岡</SectionHeading>
              <div className="grid sm:grid-cols-2 gap-4">
                <List title={`${g.name} → 福岡（抵達時間）`} flights={g.toFuk} />
                <List title={`福岡 → ${g.name}（起飛時間）`} flights={g.fromFuk} />
              </div>
            </section>
          ))}
        </>
      )}
      <ToolNote>
        <p>
          資料來自福岡空港官網的航班看板，每 3 分鐘更新；延誤、取消以航空公司公告為準。聯營航班（同一班不同代碼）只列主航班。
        </p>
        <p>
          高雄小港、福岡兩個機場的完整看板在{" "}
          <Link href="/airports" className="text-(--accent) underline underline-offset-4 decoration-(--border) hover:decoration-(--accent)">
            機場時刻表
          </Link>
          。
        </p>
      </ToolNote>
    </PageShell>
  );
}
