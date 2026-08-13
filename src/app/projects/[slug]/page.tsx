import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { projects, statusColor } from "@/lib/projects";
import MermaidDiagram from "@/components/ui/MermaidDiagram";
import { GitHubIcon } from "@/components/ui/icons";

type ProjectPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) return {};

  return {
    title: `${project.titleZh} · ${project.title} — PINGWEI LI`,
    description: project.descriptionZh,
    alternates: { canonical: `/projects/${project.slug}` },
  };
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "首頁", item: "https://kbs0830.com" },
      { "@type": "ListItem", position: 2, name: "製作物", item: "https://kbs0830.com/#portfolio" },
      { "@type": "ListItem", position: 3, name: project.titleZh, item: `https://kbs0830.com/projects/${project.slug}` },
    ],
  };

  return (
    <div className="min-h-screen bg-(--bg) px-6 py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-2xl mx-auto">
        <Link
          href="/#portfolio"
          className="inline-block py-3 -my-3 text-xs tracking-[0.2em] text-(--muted) hover:text-(--accent) transition-colors"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          ← 返回作品集
        </Link>

        <div className="flex items-center gap-2 mt-10 mb-4 flex-wrap">
          <p
            className="text-xs tracking-[0.35em] text-(--muted) uppercase"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {project.titleJa}
          </p>
          <span
            className={`text-[10px] px-2 py-0.5 border rounded-sm font-light tracking-wide ${statusColor[project.status]}`}
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {project.status}
          </span>
        </div>

        <h1
          className="text-3xl sm:text-4xl font-light text-(--text) mb-2"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          {project.titleZh}
        </h1>
        <p className="text-sm font-light text-(--muted) mb-8">{project.title}</p>

        {project.github && (
          <div className="mb-8">
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 py-2 -my-2 text-xs text-(--muted) hover:text-(--accent) transition-colors"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              <GitHubIcon />
              原始碼 · Source Code
            </a>
          </div>
        )}

        {project.image && (
          <div className="mb-10 border border-(--border) rounded-sm overflow-hidden">
            <Image
              src={project.image}
              alt={`${project.titleZh} screenshot`}
              width={1200}
              height={800}
              className="w-full h-auto"
            />
          </div>
        )}

        {/* Highlight */}
        <div
          className="text-[13px] text-(--accent) font-light mb-10 pl-3 border-l-2 border-(--accent-lt) space-y-0.5"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <div>{project.highlightZh}</div>
          <div className="opacity-50">{project.highlight}</div>
        </div>

        {/* Intro */}
        <p className="text-sm font-light text-(--text) leading-relaxed mb-4">
          {project.detail ? project.detail.intro : project.descriptionZh}
        </p>
        {!project.detail && (
          <p className="text-xs font-light text-(--muted) leading-relaxed mb-10 opacity-60">
            {project.description}
          </p>
        )}

        {project.detail?.architectureDiagram && (
          <div className="mt-12">
            <p
              className="text-xs tracking-[0.2em] text-(--accent) uppercase mb-4"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              架構圖<span className="text-(--muted) normal-case tracking-normal"> · Architecture</span>
            </p>
            <MermaidDiagram chart={project.detail.architectureDiagram} />
          </div>
        )}

        {/* Sections */}
        {project.detail && (
          <div className="space-y-10 mt-12">
            {project.detail.sections.map((section) => (
              <div key={section.heading}>
                <p
                  className="text-xs tracking-[0.2em] text-(--accent) uppercase mb-4"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {section.heading}
                  {section.headingEn && (
                    <span className="text-(--muted) normal-case tracking-normal"> · {section.headingEn}</span>
                  )}
                </p>
                <ul className="space-y-2.5">
                  {section.body.map((line, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm font-light">
                      <span className="text-(--accent) mt-0.5">▸</span>
                      <span className="text-(--text)">{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {project.detail?.context && (
          <p className="text-xs font-light text-(--muted) mt-12 pt-6 border-t border-(--border) opacity-70">
            {project.detail.context}
          </p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mt-12">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-[11px] font-light text-(--muted) bg-(--surface) border border-(--border) rounded-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
