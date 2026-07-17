import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { projects } from "@/lib/projects";
import MermaidDiagram from "@/components/ui/MermaidDiagram";

const statusColor: Record<string, string> = {
  "完成": "text-(--accent) border-(--accent-lt) bg-(--accent-lt)",
  "製作中": "text-amber-600 border-amber-100 bg-amber-50",
  "課程専題": "text-violet-600 border-violet-100 bg-violet-50",
  "學習記録": "text-(--muted) border-(--border) bg-(--surface)",
};

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

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  if (!project) notFound();

  return (
    <div className="min-h-screen bg-(--bg) px-6 py-20">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/#portfolio"
          className="text-xs tracking-[0.2em] text-(--muted) hover:text-(--accent) transition-colors"
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
          <a
            href={project.github}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs text-(--muted) hover:text-(--accent) transition-colors mb-10"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <GitHubIcon />
            {project.github.replace("https://", "")}
          </a>
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
