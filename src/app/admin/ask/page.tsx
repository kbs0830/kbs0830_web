import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import AdminShell from "@/components/admin/AdminShell";
import LoadingBlock from "@/components/ui/LoadingBlock";
import PageShell from "@/components/layout/PageShell";
import { Tiles } from "@/components/ui/StatCharts";
import { KEEP_DAYS, readAskLog, summarizeAsk, type AskEntry } from "@/lib/ai/ask-log";
import { nf } from "@/lib/format";

// 站長後台 · 問我（2026-11-27）：訪客在 /ask 問過什麼、小助理怎麼答、哪些沒答完、沒有來源的（＝知識庫可能缺東西）。
// 資料 data/ask-log.jsonl（lib/ai/ask-log.ts）：不含 IP，email／電話已遮掉，保留 90 天。訪客參觀（/demo/admin）看不到這頁。
export const metadata: Metadata = { title: "問我紀錄" };

const intro = `訪客在 /ask 問的問題與小助理的回答，保留 ${KEEP_DAYS} 天。不含 IP。`;

export default function Page() {
  return (
    <Suspense fallback={<PageShell compact eyebrow="站長後台 · Admin" title="問我紀錄" intro={intro}><LoadingBlock /></PageShell>}>
      <AdminAsk />
    </Suspense>
  );
}

// 台灣時間 MM/DD HH:mm（放元件外：Date 的運算不要在元件本體跑）
const twTime = (t: number) => new Date(t + 8 * 3600_000).toISOString().slice(5, 16).replace("T", " ").replace("-", "/");

function load() {
  const entries = readAskLog({ limit: 300 });
  return { entries, stats: summarizeAsk(entries, Date.now()) };
}

async function AdminAsk() {
  await connection();
  const { entries, stats } = load();
  return (
    <AdminShell title="問我紀錄" intro={intro}>
      <Tiles
        items={[
          [nf.format(stats.total), "總共 · Total"],
          [nf.format(stats.week), "近 7 天 · 7 days"],
          [stats.avgMs === null ? "–" : `${(stats.avgMs / 1000).toFixed(1)} 秒`, "平均回應 · Avg"],
          [nf.format(stats.failed), "沒答完 · Failed", "逾時、模型沒開、或訪客中途關掉。"],
        ]}
      />
      {stats.top.length > 0 && (
        <p className="mb-6 text-sm text-(--muted) font-light">
          重複被問：{stats.top.map(([q, n]) => `「${q}」×${n}`).join("、")}
        </p>
      )}
      {entries.length === 0 ? (
        <p className="text-sm text-(--muted) font-light">還沒有人問過。</p>
      ) : (
        <>
          <p className="mb-3 text-xs text-(--muted) font-light">
            最近 {entries.length} 筆，新的在上面。「無來源」是答案沒有對應的作品／文章（可能來自基本資料，也可能是知識庫缺東西）。
          </p>
          <ul className="divide-y divide-(--border) border-y border-(--border)">
            {entries.map((e) => (
              <Row key={e.t} e={e} />
            ))}
          </ul>
        </>
      )}
    </AdminShell>
  );
}

function Row({ e }: { e: AskEntry }) {
  return (
    <li className="py-3">
      <details>
        <summary className="cursor-pointer list-none flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm font-light">
          <span className="font-mono text-xs text-(--muted) shrink-0 w-24">{twTime(e.t)}</span>
          <span className="order-last basis-full sm:order-none sm:basis-0 min-w-0 flex-1 text-(--text) wrap-anywhere">{e.q}</span>
          <span className="shrink-0 font-mono text-[11px] text-(--muted)">
            {e.ok ? `${(e.ms / 1000).toFixed(1)}s` : "失敗"}
            {e.turn > 1 && ` · 第${e.turn}問`}
            {e.ok && e.src.length === 0 && " · 無來源"}
          </span>
        </summary>
        <div className="mt-2 ml-0 sm:ml-27 space-y-2 text-sm font-light text-(--muted) leading-relaxed">
          <p className="whitespace-pre-wrap wrap-anywhere">{e.a || "（沒有回答）"}</p>
          {e.src.length > 0 && <p className="font-mono text-xs">來源：{e.src.join("、")}</p>}
        </div>
      </details>
    </li>
  );
}
