import type { ReactNode } from "react";
import { twDateTime } from "@/lib/format";

// 後台的「時間＋一行說明」清單（告警、部署、寄信紀錄共用）。warn＝出事了，用 --warn 色。Server Component
export default function LogList({ rows, empty = "沒有紀錄。" }: { rows: { time: string; text: ReactNode; warn?: boolean }[]; empty?: string }) {
  if (rows.length === 0) return <p className="text-sm font-light text-(--muted)">{empty}</p>;
  return (
    <ul className="border-y border-(--border) divide-y divide-(--border)">
      {rows.map((r, i) => (
        <li key={`${r.time}-${i}`} className="py-2.5 grid grid-cols-[6.5rem_1fr] gap-3 text-sm font-light">
          <span className="font-mono text-xs text-(--muted) pt-0.5">{twDateTime(r.time)}</span>
          <span className={r.warn ? "text-(--warn)" : "text-(--text)"}>{r.text}</span>
        </li>
      ))}
    </ul>
  );
}
