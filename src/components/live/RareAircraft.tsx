import { connection } from "next/server";
import Link from "next/link";
import { rareToday } from "@/lib/live/rare-today";

// 首頁頁尾的一行：「今日は珍しい機体：Boeing 747-8」（TODO B16，2026-11-26）。雷達今天沒收到稀有機型就什麼都不顯示。
// 點了到機體図鑑。只寫機型，不寫時間跟數量（雷達隱私）。
export default async function RareAircraft({ className = "" }: { className?: string }) {
  await connection();
  const rare = rareToday();
  if (rare.length === 0) return null;
  return (
    <Link href="/radar/zukan" className={`${className} transition-colors hover:text-(--accent)`} title="機體図鑑 · Zukan">
      今日は珍しい機体：{rare.map((e) => e.name).join("、")}
    </Link>
  );
}
