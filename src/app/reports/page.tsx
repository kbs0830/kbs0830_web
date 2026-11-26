import { notFound } from "next/navigation";

// 日報／週報／月報已經搬進站長後台（/admin/reports，2026-11-26 TODO G8）。公開的舊網址回 404：
// 報表有流量、維運的細節，不該讓任何人打得開（之前是 noindex 但網址是通的）。
export default function ReportsMoved() {
  notFound();
}
