import type { Project } from "@/lib/projects";

// 作品的一句話成果（中文＋灰色英文；2026-11-09 axe 抓到 opacity-50 對比不足），作品卡片跟詳細頁共用；字級/間距由 className 決定
export default function ProjectHighlight({ project, className }: { project: Project; className: string }) {
  return (
    <div className={`text-(--accent) font-light pl-3 border-l-2 border-(--accent-lt) space-y-0.5 font-mono ${className}`}>
      <div>{project.highlightZh}</div>
      <div className="text-(--muted)">{project.highlight}</div>
    </div>
  );
}
