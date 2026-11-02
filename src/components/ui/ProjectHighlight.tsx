import type { Project } from "@/lib/projects";

// 作品的一句話成果（中文＋淡化英文），作品卡片跟詳細頁共用；字級/間距由 className 決定
export default function ProjectHighlight({ project, className }: { project: Project; className: string }) {
  return (
    <div className={`text-(--accent) font-light pl-3 border-l-2 border-(--accent-lt) space-y-0.5 font-mono ${className}`}>
      <div>{project.highlightZh}</div>
      <div className="opacity-50">{project.highlight}</div>
    </div>
  );
}
