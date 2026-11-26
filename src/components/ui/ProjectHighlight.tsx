import type { Project } from "@/lib/content/projects";

// 作品的一句話成果（中文＋灰色英文；2026-11-09 axe 抓到 opacity-50 對比不足），作品卡片跟詳細頁共用；字級/間距由 className 決定
export default function ProjectHighlight({ project, className }: { project: Project; className: string }) {
  return (
    // 2026-11-26（TODO M8）：中文那行改回內文字體＋等寬數字——整句中文用等寬字體時「5 - 40 秒」被拉得很散；英文那行留等寬當技術註記
    <div className={`text-(--accent) font-light pl-3 border-l-2 border-(--accent-lt) space-y-0.5 ${className}`}>
      <div className="tabular-nums">{project.highlightZh}</div>
      <div className="text-(--muted) font-mono">{project.highlight}</div>
    </div>
  );
}
