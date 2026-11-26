import { connection } from "next/server";
import Link from "next/link";
import { readUptime } from "@/lib/ops/status";

// 首頁頁尾「● 正常運作」（TODO F11，2026-11-26）：讀 /status 同一份 uptime.log，看今天（台灣）。
// 今天每次檢查都通＝綠點；有失敗的檢查（watchdog 每 5 分鐘一次）＝--warn 色、寫「今天有約 N 分鐘中斷」；今天還沒有紀錄就不顯示。
export default async function StatusDot({ className = "" }: { className?: string }) {
  await connection();
  const today = readUptime(1).at(-1);
  if (!today || today.checks === 0) return null;
  const down = (today.checks - today.up) * 5;
  const ok = down === 0;
  return (
    <Link href="/status" className={`${className} inline-flex items-center gap-1.5 py-1 -my-1 transition-colors hover:text-(--accent)`} title="維運狀態 · Status">
      <span aria-hidden className={`size-1.5 rounded-full ${ok ? "bg-(--ok)" : "bg-(--warn)"}`} />
      <span className={ok ? "" : "text-(--warn)"}>{ok ? "正常運作" : `今天有約 ${down} 分鐘中斷`}</span>
    </Link>
  );
}
