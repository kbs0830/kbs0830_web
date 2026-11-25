import type { ReactNode } from "react";
import { twDateTime } from "@/lib/format";

// 後台的「時間＋一行說明」清單（告警、部署、寄信紀錄共用）。Server Component
// tone：warn＝出事了（--warn）、ok＝成功／恢復（--ok），左邊一個色點。
// 手機：時間在上一行、內容在下一行（原本時間佔左欄 6.5rem，內容被擠成很窄一條）；桌機：兩欄。
// limit：超過就只先顯示前幾筆，其他收在「顯示全部」裡（原生 <details>，不用 JS）。
type Row = { time: string; text: ReactNode; warn?: boolean; tone?: "ok" | "warn" };

const DOT = { ok: "bg-(--ok)", warn: "bg-(--warn)", none: "bg-(--border)" } as const;

// 紀錄內文裡夾的 ISO 時間（watchdog 開機通知會帶 2026-11-26T01:50:03.5000000+08:00）換成「11/26 01:50」
const ISO = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})/g;
const tidy = (t: ReactNode) => (typeof t === "string" ? t.replace(ISO, (m) => twDateTime(m)) : t);

function Item({ r }: { r: Row }) {
  const tone = r.tone ?? (r.warn ? "warn" : undefined);
  return (
    <li className="py-2 grid grid-cols-[0.5rem_1fr] sm:grid-cols-[0.5rem_7rem_1fr] gap-x-2.5 text-sm font-light">
      <span aria-hidden className={`mt-[0.45rem] size-1.5 rounded-full ${DOT[tone ?? "none"]}`} />
      <span className="font-mono text-[11px] text-(--muted) sm:pt-0.5">{twDateTime(r.time)}</span>
      <span className={`col-start-2 sm:col-start-3 sm:row-start-1 break-words min-w-0 ${tone === "warn" ? "text-(--warn)" : "text-(--text)"}`}>{tidy(r.text)}</span>
    </li>
  );
}

export default function LogList({ rows, empty = "沒有紀錄。", limit }: { rows: Row[]; empty?: string; limit?: number }) {
  if (rows.length === 0) return <p className="text-sm font-light text-(--muted)">{empty}</p>;
  const head = limit ? rows.slice(0, limit) : rows;
  const rest = limit ? rows.slice(limit) : [];
  return (
    <div>
      <ul className="border-y border-(--border) divide-y divide-(--border)">
        {head.map((r, i) => (
          <Item key={`${r.time}-${i}`} r={r} />
        ))}
      </ul>
      {rest.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer list-none py-2 text-xs text-(--accent) [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">顯示全部（還有 {rest.length} 筆）</span>
            <span className="hidden group-open:inline">收起</span>
          </summary>
          <ul className="border-b border-(--border) divide-y divide-(--border)">
            {rest.map((r, i) => (
              <Item key={`${r.time}-r${i}`} r={r} />
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
