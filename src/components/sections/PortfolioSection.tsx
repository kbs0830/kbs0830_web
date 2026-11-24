// Server Component：卡片在 server 產生 HTML，projects.ts（含詳細頁才用到的長篇說明、
// 架構圖）不再進首頁的 client bundle。互動只有 tag 篩選（ProjectFilter）。
import { ViewTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { projects, personalProjects, courseProjects } from "@/lib/projects";
import Reveal from "@/components/ui/Reveal";
import RevealHeading from "@/components/ui/RevealHeading";
import { GitHubIcon } from "@/components/ui/icons";
import Eyebrow from "@/components/ui/Eyebrow";
import TagBadge from "@/components/ui/TagBadge";
import StatusBadge from "@/components/ui/StatusBadge";
import ProjectHighlight from "@/components/ui/ProjectHighlight";
import ProjectFilter, { type FilterGroup } from "@/components/sections/ProjectFilter";

// 篩選列：2 個以上作品用到的 tag 直接列出（多的排前面），只出現一次的收進「更多」。
// 2026-11-09 作品加到 13 個、tag 變 42 個，全部攤開桌機要排 5 行。
const tagCounts = new Map<string, number>();
for (const tag of projects.flatMap((p) => p.tags)) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
const byCountThenName = ([a, ca]: [string, number], [b, cb]: [string, number]) => cb - ca || a.localeCompare(b, "en");
const sortedTags = [...tagCounts].sort(byCountThenName);
const mainTags = sortedTags.filter(([, c]) => c >= 2).map(([t]) => t);
const moreTags = sortedTags
  .filter(([, c]) => c < 2)
  .map(([t]) => t)
  .sort((a, b) => a.localeCompare(b, "en"));

function ProjectCard({
  project,
  index,
}: {
  project: (typeof projects)[0];
  index: number;
}) {
  // 淡入（Reveal 的 translate）跟 hover 上浮（卡片本身的 translate）分在兩層，互不覆蓋
  // 2026-11-24 手機精簡版（使用者：「手機每次要滑到最底下都很久」，首頁 14.6 個螢幕、作品集一區就 9 個）：
  // 640px 以下改成「左邊小縮圖＋右邊標題、兩行說明、前 3 個 tag」，英文說明、成果、「查看詳情」只在 sm 以上顯示。
  // 整張卡片本來就是連結，點了進詳細頁看完整內容
  return (
    <Reveal distance={28} delay={index * 0.1} margin={60} className="flex">
      <div className="group relative flex-1 border border-(--border) bg-(--bg) rounded-sm p-4 sm:p-7 hover:border-(--accent) hover:-translate-y-1 transition-all duration-300 flex flex-col">
        <Link
          href={`/projects/${project.slug}`}
          className="absolute inset-0 z-0 rounded-sm"
          aria-label={`查看「${project.titleZh}」詳情`}
        />
        <div className="absolute top-0 left-0 h-[2px] w-0 bg-(--accent) group-hover:w-full transition-all duration-500 rounded-t-sm" />

        <div className="relative z-10 flex flex-row items-start gap-4 sm:flex-col sm:items-stretch sm:gap-0 flex-1 pointer-events-none">
          {project.image && (
            <ViewTransition name={`project-image-${project.slug}`} share="morph" default="none">
              <div className="relative w-20 h-20 shrink-0 overflow-hidden rounded-sm bg-(--surface) sm:w-auto sm:h-auto sm:-mx-7 sm:-mt-7 sm:mb-5 sm:aspect-video sm:rounded-b-none">
                <Image
                  src={project.image}
                  alt={`${project.titleZh} 截圖`}
                  fill
                  className="object-cover grayscale-[10%] group-hover:grayscale-0 transition-[filter] duration-500"
                  sizes="(max-width: 639px) 80px, (max-width: 768px) 100vw, 50vw"
                />
              </div>
            </ViewTransition>
          )}
          <div className="flex flex-col flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-2 sm:mb-4">
            <div className="flex-1 min-w-0">
              {/* 標題順序（2026-11-24 使用者：「一行中文一行日文有點浪費，應該中文大字、英文備註、最後才是日文」）：
                  中文大字一行，英文跟日文併成下面一行小字＋狀態 */}
              {/* 跟 /projects/[slug] 的 <h1> 同名，點進詳細頁時標題會 morph 過去 */}
              <div className="flex items-start gap-2">
                <ViewTransition name={`project-title-${project.slug}`} share="morph" default="none">
                  <h3 className="text-base sm:text-lg font-light text-(--text) leading-snug group-hover:text-(--accent) transition-colors">
                    {project.titleZh}
                  </h3>
                </ViewTransition>
                <span className="shrink-0 mt-0.5 sm:mt-1">
                  <StatusBadge status={project.status} />
                </span>
              </div>
              {/* 英文 · 日文固定一行：太長就截掉日文的尾巴（日文本來就排最後），不會再多換一行 */}
              <p className="mt-1 flex items-baseline gap-x-2 text-xs text-(--muted) font-light whitespace-nowrap overflow-hidden">
                <span className="shrink-0">{project.title}</span>
                <span aria-hidden className="shrink-0">·</span>
                <span className="tracking-[0.15em] font-mono truncate min-w-0">{project.titleJa}</span>
              </p>
            </div>
            {project.github && (
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                className="pointer-events-auto relative z-20 text-(--border) hover:text-(--accent) transition-colors ml-3 mt-1 shrink-0"
                aria-label="GitHub"
              >
                <GitHubIcon />
              </a>
            )}
          </div>

          {/* 中文說明（主） */}
          <p className="text-sm sm:text-[13px] font-light text-(--text) leading-relaxed mb-2 line-clamp-2 sm:line-clamp-none">
            {project.descriptionZh}
          </p>
          <p className="hidden sm:block text-[12px] font-light text-(--muted) leading-relaxed mb-4">
            {project.description}
          </p>

          <ProjectHighlight project={project} className="hidden sm:block text-[11px] mb-4" />

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mt-auto sm:mb-3">
            {project.tags.map((tag, i) => (
              <TagBadge key={tag} className={i >= 3 ? "hidden sm:inline" : ""}>
                {tag}
              </TagBadge>
            ))}
          </div>

          <p className="hidden sm:block text-[11px] text-(--muted) group-hover:text-(--accent) transition-colors font-mono">
            查看詳情 · View Details →
          </p>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

function SectionLabel({ label, labelZh }: { label: string; labelZh: string }) {
  return (
    <Reveal from="left" duration={0.5} margin={60} className="flex items-center gap-4 mb-6">
      <div className="w-5 h-[1px] bg-(--accent)" />
      <p className="text-xs tracking-[0.18em] sm:tracking-[0.3em] text-(--accent) uppercase font-mono">
        {/* 手機寬度不夠時，中文那段整塊換行，不要把「学習記録」拆成兩半 */}
        {label} &nbsp;·&nbsp; <span className="whitespace-nowrap">{labelZh}</span>
      </p>
    </Reveal>
  );
}

const toItems = (list: typeof projects) =>
  list.map((p, i) => ({ slug: p.slug, tags: p.tags, card: <ProjectCard project={p} index={i} /> }));

const groups: FilterGroup[] = [
  {
    key: "personal",
    className: "mb-10 md:mb-16",
    gridClassName: "grid md:grid-cols-2 gap-3 sm:gap-5",
    label: <SectionLabel label="Personal Projects" labelZh="個人専案" />,
    items: toItems(personalProjects),
  },
  {
    key: "course",
    className: "",
    gridClassName: "grid md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5",
    label: <SectionLabel label="Course Projects" labelZh="課程専題 · 学習記録" />,
    items: toItems(courseProjects),
  },
];

export default function PortfolioSection() {
  return (
    <section id="portfolio" className="py-20 md:py-32">
      <div className="max-w-5xl mx-auto px-6">

        {/* Title */}
        <Reveal className="mb-10 md:mb-16">
          <Eyebrow className="mb-4">02 — Work</Eyebrow>
          <RevealHeading
            text="製作物 · Portfolio"
            className="text-3xl sm:text-4xl font-light text-(--text) mb-3 font-serif"
          />
          <p className="text-sm font-light text-(--muted)">
            自分で開発した作品と、課程中の学習専題。
          </p>
        </Reveal>

        <ProjectFilter tags={mainTags} moreTags={moreTags} groups={groups} />

        <Reveal delay={0.3} distance={0}>
          <p className="text-xs text-(--muted) font-light mt-10 text-center tracking-wide font-mono">
            学習記録は非公開リポジトリに保存されています。
          </p>
        </Reveal>
      </div>
    </section>
  );
}
