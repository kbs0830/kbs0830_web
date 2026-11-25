// Server Component：卡片在 server 產生 HTML，projects.ts（含詳細頁才用到的長篇說明、
// 架構圖）不再進首頁的 client bundle。互動只有 tag 篩選（ProjectFilter）。
import { ViewTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { projects, personalProjects, courseProjects } from "@/lib/content/projects";
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
for (const tag of [...personalProjects, ...courseProjects].flatMap((p) => p.tags)) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
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
  // min-w-0（Reveal、卡片兩層都要）：讓卡片能縮到螢幕寬，裡面不換行的「英文 · 日文」才會截斷，
  // 不然整頁被撐得比手機螢幕寬（2026-11-24 在 360px 實測 401px，頂端導覽列跟著變寬、選單按鈕被擠出畫面）
  // 2026-11-24 手機精簡版（使用者：「手機每次要滑到最底下都很久」，首頁 14.6 個螢幕、作品集一區就 9 個）：
  // 640px 以下改成「左邊小縮圖＋右邊標題、兩行說明、前 3 個 tag」，英文說明、成果、「查看詳情」只在 sm 以上顯示。
  // 整張卡片本來就是連結，點了進詳細頁看完整內容
  return (
    <Reveal distance={28} delay={index * 0.1} margin={60} className="flex min-w-0">
      <div className="group relative flex-1 min-w-0 border border-(--border) bg-(--bg) rounded-sm p-4 sm:p-7 hover:border-(--accent) hover:-translate-y-1 transition-all duration-300 flex flex-col">
        <Link
          href={`/projects/${project.slug}`}
          className="absolute inset-0 z-0 rounded-sm"
          aria-label={`查看「${project.titleZh}」詳情`}
        />
        <div className="absolute top-0 left-0 h-[2px] w-0 bg-(--accent) group-hover:w-full transition-all duration-500 rounded-t-sm" />

        <div className="relative z-10 flex flex-row items-start gap-4 sm:flex-col sm:items-stretch sm:gap-0 flex-1 pointer-events-none">
          {project.image && (
            <ViewTransition name={`project-image-${project.slug}`} share="morph" default="none">
              {/* 桌機的大圖（使用者：桌機不用改）。手機 display:none，lazy 圖不會下載 */}
              <div className="relative hidden sm:block overflow-hidden rounded-sm bg-(--surface) -mx-7 -mt-7 mb-5 aspect-video rounded-b-none">
                <Image
                  src={project.image}
                  alt={project.imageAlt ?? `${project.titleZh} 截圖`}
                  fill
                  className="object-cover grayscale-[10%] group-hover:grayscale-0 transition-[filter] duration-500"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </ViewTransition>
          )}
          {/* 手機：左邊一個小圖示，截圖點進作品頁才看（2026-11-25 使用者：「截圖好醜，點進去再顯示截圖」
              「先畫，畫不出來再用 emoji」）：有畫好的 thumb 用圖，沒有才用 emoji */}
          {project.thumb ? (
            <div aria-hidden className="sm:hidden relative w-16 h-16 shrink-0 overflow-hidden rounded-sm">
              <Image src={project.thumb} alt="" fill className="object-cover" sizes="64px" />
            </div>
          ) : (
            <div
              aria-hidden
              className="sm:hidden w-16 h-16 shrink-0 grid place-items-center rounded-sm bg-(--surface) text-[30px] leading-none select-none"
            >
              {project.icon}
            </div>
          )}
          <div className="flex flex-col flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-2 sm:mb-4">
            <div className="flex-1 min-w-0">
              {/* 桌機：原本的「日文小字＋狀態 → 中文標題 → 英文」（使用者：桌機不用改） */}
              <div className="hidden sm:flex items-center gap-2 mb-1 flex-wrap">
                <p className="text-xs tracking-[0.25em] text-(--muted) font-mono">{project.titleJa}</p>
                <StatusBadge status={project.status} />
              </div>
              {/* 跟 /projects/[slug] 的 <h1> 同名，點進詳細頁時標題會 morph 過去 */}
              {/* items-baseline：狀態標籤對齊標題第一行的文字（2026-11-25 使用者：「藍底的完成飄掉了，沒有對齊」，原本 items-start＋mt-0.5 偏下） */}
              <div className="flex items-baseline gap-2">
                <ViewTransition name={`project-title-${project.slug}`} share="morph" default="none">
                  <h3 className="text-base font-light text-(--text) leading-snug group-hover:text-(--accent) transition-colors">
                    {project.titleZh}
                  </h3>
                </ViewTransition>
                {/* 手機：狀態跟中文標題同一行；課程專題那一區的標題已經寫了，不再重複「課程専題」（會把標題擠成兩行） */}
                {project.status !== "課程専題" && (
                  <span className="sm:hidden shrink-0">
                    <StatusBadge status={project.status} />
                  </span>
                )}
              </div>
              <p className="hidden sm:block text-xs text-(--muted) font-light mt-0.5">{project.title}</p>
              {/* 手機（使用者：「中文大字、英文備註、最後才是日文」）：英文 · 日文併一行、不換行，放不下就截斷（日文先截） */}
              <p className="sm:hidden mt-1 flex items-baseline gap-x-2 text-xs text-(--muted) font-light whitespace-nowrap overflow-hidden">
                <span className="truncate min-w-0">{project.title}</span>
                <span aria-hidden className="shrink-0">·</span>
                <span className="tracking-[0.15em] font-mono truncate min-w-0 shrink-[2]">{project.titleJa}</span>
              </p>
            </div>
            {project.github && (
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:block pointer-events-auto relative z-20 text-(--border) hover:text-(--accent) transition-colors ml-3 mt-1 shrink-0"
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
      {/* 手機只放中文（英文太長會把「· 課程専題」擠到第二行）；桌機維持原本「英文 · 中文」 */}
      <p className="text-xs tracking-[0.18em] sm:tracking-[0.3em] text-(--accent) uppercase font-mono">
        <span className="hidden sm:inline">{label} &nbsp;·&nbsp; </span>
        <span className="whitespace-nowrap">{labelZh}</span>
      </p>
    </Reveal>
  );
}

// 手機上個人専案只先露出這兩個（2026-11-25 使用者：「自架 FR24 雷達站跟個人網站（本站）精選，剩下的照課程專題」收起來）。
// 只影響 640px 以下：精選排到最前、其他收進「顯示全部」；桌機的順序跟顯示都不變
const MOBILE_FEATURED = ["fr24-receiver", "kbs0830-web"];

const toItems = (list: typeof projects) =>
  list.map((p, i) => ({ slug: p.slug, tags: p.tags, mobileFeatured: MOBILE_FEATURED.includes(p.slug), card: <ProjectCard project={p} index={i} /> }));

// grid-cols-1 要明確寫：沒寫的話手機那一欄是 auto，會被卡片裡不換行的「英文 · 日文」撐寬，
// 整頁變得比螢幕寬（2026-11-24 在 360px 實測 401px，固定在頂端的導覽列跟著變寬、選單按鈕被擠出畫面）
const groups: FilterGroup[] = [
  {
    key: "personal",
    className: "mb-10 md:mb-16",
    gridClassName: "grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5",
    label: <SectionLabel label="Personal Projects" labelZh="個人専案" />,
    items: toItems(personalProjects),
    mobileLimit: MOBILE_FEATURED.length,
  },
  {
    key: "course",
    className: "",
    gridClassName: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5",
    label: <SectionLabel label="Course Projects" labelZh="課程専題 · 学習記録" />,
    items: toItems(courseProjects),
    mobileLimit: 2,
  },
];

export default function PortfolioSection() {
  return (
    <section id="portfolio" className="pt-20 pb-12 sm:pb-20 md:py-32">
      {/* 手機底部留白縮小：下面「最新文章」自己有一條分隔線＋上方留白，兩個加起來之前快 130px */}
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
