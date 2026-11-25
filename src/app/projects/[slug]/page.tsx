import type { Metadata } from "next";
import { withShare } from "@/lib/site/share-meta";
import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";
import { notFound } from "next/navigation";
import { projects } from "@/lib/content/projects";
import { SITE_URL } from "@/lib/site/site";
import ArchitectureDiagram from "@/components/content/ArchitectureDiagram";
import JpyRateLive from "@/components/live/JpyRateLive";
import AirQualityLive from "@/components/live/AirQualityLive";
import { GitHubIcon } from "@/components/ui/icons";
import TagBadge from "@/components/ui/TagBadge";
import Eyebrow from "@/components/ui/Eyebrow";
import StatusBadge from "@/components/ui/StatusBadge";
import SectionHeading from "@/components/ui/SectionHeading";
import BulletList from "@/components/ui/BulletList";
import JsonLd from "@/components/ui/JsonLd";
import PageShell from "@/components/layout/PageShell";
import ProjectHighlight from "@/components/ui/ProjectHighlight";
import CaseStudy from "@/components/content/CaseStudy";

type ProjectPageProps = { params: Promise<{ slug: string }> };

// 整頁一定要是靜態（Next 16.4，TODO C13）：清單外的網址會等整頁產生完才回應，notFound() 才會是真的 404（不加的話先串流外殼、狀態碼變 200）；
// 以後有人在這頁加了即時資料，build 會直接失敗
export const ensureStatic = "navigation";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) return {};

  // 分享圖是同資料夾的 opengraph-image.tsx（每個作品一張）
  return withShare(
    {
      title: `${project.titleZh} · ${project.title} — PINGWEI LI`,
      description: project.descriptionZh,
      alternates: { canonical: `/projects/${project.slug}`, types: { "text/markdown": `/projects/${project.slug}.md` } },
    },
    { ownImage: true },
  );
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) notFound();

  return (
    <PageShell backHref="/#portfolio" backLabel="返回作品集">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "首頁", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "製作物", item: `${SITE_URL}/#portfolio` },
            { "@type": "ListItem", position: 3, name: project.titleZh, item: `${SITE_URL}/projects/${project.slug}` },
          ],
        }}
      />

      {/* 桌機：原本的「日文小字＋狀態 → 中文標題 → 英文」（使用者：桌機不用改） */}
      <div className="hidden sm:flex items-center gap-2 mt-10 mb-4 flex-wrap">
        <Eyebrow>{project.titleJa}</Eyebrow>
        <StatusBadge status={project.status} />
      </div>

      {/* 跟 PortfolioSection 作品卡片的 <h3> 同名，從卡片點進來時標題會 morph 過來 */}
      <ViewTransition name={`project-title-${project.slug}`} share="morph" default="none">
        <h1 className="mt-10 sm:mt-0 text-3xl sm:text-4xl font-light text-(--text) mb-3 sm:mb-2 font-serif">
          {project.titleZh}
        </h1>
      </ViewTransition>
      <p className="hidden sm:block text-sm font-light text-(--muted) mb-8">{project.title}</p>
      {/* 手機（2026-11-24）：中文 → 英文 · 日文 ＋狀態 */}
      <div className="sm:hidden flex flex-wrap items-center gap-x-3 gap-y-1 mb-8 text-sm font-light text-(--muted)">
        <span>{project.title}</span>
        <span aria-hidden>·</span>
        <span className="text-xs tracking-[0.2em] font-mono">{project.titleJa}</span>
        <StatusBadge status={project.status} />
      </div>

      {(project.github || project.live) && (
        <div className="mb-8 flex flex-wrap gap-x-6 gap-y-3">
          {project.live && (
            <Link
              href={project.live.href}
              className="inline-flex items-center gap-2 py-2 -my-2 text-xs text-(--accent) hover:underline underline-offset-4 font-mono"
            >
              {project.live.label} →
            </Link>
          )}
          {project.github && (
          <a
            href={project.github}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 py-2 -my-2 text-xs text-(--muted) hover:text-(--accent) transition-colors font-mono"
          >
            <GitHubIcon />
            原始碼 · Source Code
          </a>
          )}
        </div>
      )}

      {project.image && (
        <ViewTransition name={`project-image-${project.slug}`} share="morph" default="none">
          <div className="mb-10 border border-(--border) rounded-sm overflow-hidden">
            <Image
              src={project.image}
              alt={project.imageAlt ?? `${project.titleZh} 截圖`}
              width={1200}
              height={800}
              className="w-full h-auto"
            />
          </div>
        </ViewTransition>
      )}

      <ProjectHighlight project={project} className="text-[13px] mb-10" />

      {/* Intro */}
      <p className="text-[15px] sm:text-sm font-light text-(--text) leading-[1.9] sm:leading-relaxed mb-4">
        {project.detail ? project.detail.intro : project.descriptionZh}
      </p>
      {!project.detail && (
        <p className="text-xs font-light text-(--muted) leading-relaxed mb-10">
          {project.description}
        </p>
      )}

      {/* 課程作品的「線上版」：client 元件自己跟 /api 要資料（作品頁是預先產生的靜態頁） */}
      {project.liveWidget === "jpy-rate" && <JpyRateLive />}
      {project.liveWidget === "air-quality" && <AirQualityLive />}

      {/* 案例：背景 → 角色 → 關鍵決定 → 取捨 → 成果（TODO B9）；下面的架構圖、條列是技術細節 */}
      {project.detail?.caseStudy && <CaseStudy data={project.detail.caseStudy} />}

      {project.detail?.architectureDiagram && (
        <div className="mt-12">
          <SectionHeading en="Architecture">架構圖</SectionHeading>
          <ArchitectureDiagram chart={project.detail.architectureDiagram} />
        </div>
      )}

      {project.detail && (
        <div className="space-y-10 mt-12">
          {project.detail.sections.map((section) => (
            <div key={section.heading}>
              <SectionHeading en={section.headingEn}>{section.heading}</SectionHeading>
              <BulletList items={section.body} />
              {section.images && (
                <div className={`mt-5 grid gap-3 ${section.images.length > 1 ? "sm:grid-cols-2" : ""}`}>
                  {section.images.map((img) => (
                    <figure key={img.src} className={section.images!.length === 3 && img === section.images![0] ? "sm:col-span-2" : ""}>
                      <Image src={img.src} alt={img.alt} width={img.width} height={img.height} className="w-full h-auto rounded-sm border border-(--border)" sizes="(max-width: 639px) 100vw, 640px" />
                      {img.caption && <figcaption className="mt-1.5 text-[11px] text-(--muted) font-mono">{img.caption}</figcaption>}
                    </figure>
                  ))}
                </div>
              )}
              {section.links?.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="inline-block mt-3 py-2 -my-2 text-xs text-(--accent) underline underline-offset-4 decoration-(--border) hover:decoration-(--accent) transition-colors font-mono"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}

      {project.detail?.context && (
        <p className="text-xs font-light text-(--muted) mt-12 pt-6 border-t border-(--border)">
          {project.detail.context}
        </p>
      )}

      {/* tag 連回首頁作品集並篩好（ProjectFilter 讀 ?tag=）。用一般 <a>：client 換頁時網址參數不一定已經換好 */}
      <div className="flex flex-wrap gap-1.5 mt-12">
        {project.tags.map((tag) => (
          <a
            key={tag}
            href={`/?tag=${encodeURIComponent(tag)}#portfolio`}
            title={`看其他用到 ${tag} 的作品`}
            className="hover:opacity-70 transition-opacity"
          >
            <TagBadge>{tag}</TagBadge>
          </a>
        ))}
      </div>
    </PageShell>
  );
}
