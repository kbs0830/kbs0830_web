import type { Metadata } from "next";
import { withShare } from "@/lib/share-meta";
import Image from "next/image";
import { ViewTransition } from "react";
import { notFound } from "next/navigation";
import { projects } from "@/lib/projects";
import { SITE_URL } from "@/lib/site";
import ArchitectureDiagram from "@/components/ui/ArchitectureDiagram";
import { GitHubIcon } from "@/components/ui/icons";
import Eyebrow from "@/components/ui/Eyebrow";
import TagBadge from "@/components/ui/TagBadge";
import StatusBadge from "@/components/ui/StatusBadge";
import SectionHeading from "@/components/ui/SectionHeading";
import BulletList from "@/components/ui/BulletList";
import JsonLd from "@/components/ui/JsonLd";
import PageShell from "@/components/ui/PageShell";
import ProjectHighlight from "@/components/ui/ProjectHighlight";

type ProjectPageProps = { params: Promise<{ slug: string }> };

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

      <div className="flex items-center gap-2 mt-10 mb-4 flex-wrap">
        <Eyebrow>{project.titleJa}</Eyebrow>
        <StatusBadge status={project.status} />
      </div>

      {/* 跟 PortfolioSection 作品卡片的 <h3> 同名，從卡片點進來時標題會 morph 過來 */}
      <ViewTransition name={`project-title-${project.slug}`} share="morph" default="none">
        <h1 className="text-3xl sm:text-4xl font-light text-(--text) mb-2 font-serif">
          {project.titleZh}
        </h1>
      </ViewTransition>
      <p className="text-sm font-light text-(--muted) mb-8">{project.title}</p>

      {project.github && (
        <div className="mb-8">
          <a
            href={project.github}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 py-2 -my-2 text-xs text-(--muted) hover:text-(--accent) transition-colors font-mono"
          >
            <GitHubIcon />
            原始碼 · Source Code
          </a>
        </div>
      )}

      {project.image && (
        <ViewTransition name={`project-image-${project.slug}`} share="morph" default="none">
          <div className="mb-10 border border-(--border) rounded-sm overflow-hidden">
            <Image
              src={project.image}
              alt={`${project.titleZh} screenshot`}
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
        <p className="text-xs font-light text-(--muted) leading-relaxed mb-10 opacity-60">
          {project.description}
        </p>
      )}

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
            </div>
          ))}
        </div>
      )}

      {project.detail?.context && (
        <p className="text-xs font-light text-(--muted) mt-12 pt-6 border-t border-(--border) opacity-70">
          {project.detail.context}
        </p>
      )}

      <div className="flex flex-wrap gap-1.5 mt-12">
        {project.tags.map((tag) => (
          <TagBadge key={tag}>{tag}</TagBadge>
        ))}
      </div>
    </PageShell>
  );
}
