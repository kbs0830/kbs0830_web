import { AdminSection, AdminTiles, type Tone } from "@/components/admin/AdminShell";
import LogList from "@/components/admin/LogList";
import SeriesChart, { type SeriesPoint } from "@/components/admin/SeriesChart";
import { ShareList } from "@/components/ui/StatCharts";

// 後台頁面的「畫面」那一層（TODO G4，2026-11-26）：真後台（lib/admin/views.ts 從檔案／資料庫產生）跟
// 訪客參觀（lib/admin/demo-data.ts 的範例）給同一種資料，畫面只有一份。Server Component，資料要能序列化。

export type ViewTile = { label: string; value: string; tone?: Tone; sub?: string };
export type ViewLogRow = { time: string; text: string; tone?: "ok" | "warn" };
export type ViewBlock =
  | { kind: "log"; title: string; en?: string; rows: ViewLogRow[]; limit?: number; empty?: string }
  | { kind: "share"; title: string; en?: string; entries: [string, number][]; total: number; note?: string }
  | { kind: "series"; title: string; en?: string; points: SeriesPoint[]; unit: string; warn?: number; min?: number; max?: number }
  | { kind: "facts"; title: string; en?: string; rows: [string, string][] };
export type ViewModel = { tiles: ViewTile[]; blocks: ViewBlock[] };

export default function AdminView({ model }: { model: ViewModel }) {
  return (
    <>
      <AdminTiles items={model.tiles} />
      {model.blocks.map((b) =>
        b.kind === "log" ? (
          <AdminSection key={b.title} title={b.title} en={b.en} count={b.rows.length}>
            <LogList rows={b.rows} limit={b.limit} empty={b.empty} />
          </AdminSection>
        ) : b.kind === "series" ? (
          <AdminSection key={b.title} title={b.title} en={b.en}>
            <SeriesChart points={b.points} unit={b.unit} warn={b.warn} min={b.min} max={b.max} label={b.title} />
          </AdminSection>
        ) : b.kind === "facts" ? (
          <AdminSection key={b.title} title={b.title} en={b.en}>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              {b.rows.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-(--muted) font-light">{k}</dt>
                  <dd className="text-(--text) font-light break-words">{v}</dd>
                </div>
              ))}
            </dl>
          </AdminSection>
        ) : (
          <AdminSection key={b.title} title={b.title} en={b.en}>
            <ShareList entries={b.entries} total={b.total} />
            {b.note && <p className="mt-3 text-[13px] font-light text-(--muted) leading-relaxed">{b.note}</p>}
          </AdminSection>
        ),
      )}
    </>
  );
}
