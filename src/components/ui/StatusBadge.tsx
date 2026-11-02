import type { Project } from "@/lib/projects";

const statusColor: Record<Project["status"], string> = {
  "完成":     "text-(--accent) border-(--accent-lt) bg-(--accent-lt)",
  "製作中":   "text-amber-600 border-amber-100 bg-amber-50",
  "課程専題": "text-violet-600 border-violet-100 bg-violet-50",
  "學習記録": "text-(--muted) border-(--border) bg-(--surface)",
};

// 作品狀態小標籤（作品卡片、作品詳細頁）
export default function StatusBadge({ status }: { status: Project["status"] }) {
  return (
    <span className={`text-[10px] px-2 py-0.5 border rounded-sm font-light tracking-wide font-mono ${statusColor[status]}`}>
      {status}
    </span>
  );
}
