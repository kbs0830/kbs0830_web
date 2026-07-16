"use client";

import { useMemo, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { projects, personalProjects, courseProjects } from "@/lib/projects";
import RevealHeading from "@/components/ui/RevealHeading";

const allTags = Array.from(new Set(projects.flatMap((p) => p.tags))).sort((a, b) =>
  a.localeCompare(b, "en")
);

const statusColor: Record<string, string> = {
  "完成":     "text-(--accent) border-(--accent-lt) bg-(--accent-lt)",
  "製作中":   "text-amber-600 border-amber-100 bg-amber-50",
  "課程専題": "text-violet-600 border-violet-100 bg-violet-50",
  "學習記録": "text-(--muted) border-(--border) bg-(--surface)",
};

function ProjectCard({
  project,
  index,
}: {
  project: (typeof projects)[0];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1], delay: index * 0.1 }}
      className="group relative border border-(--border) bg-(--bg) rounded-sm p-7 hover:border-(--accent) hover:-translate-y-1 transition-all duration-300 flex flex-col"
    >
      <div className="absolute top-0 left-0 h-[2px] w-0 bg-(--accent) group-hover:w-full transition-all duration-500 rounded-t-sm" />

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p
              className="text-xs tracking-[0.25em] text-(--muted)"
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
          <h3 className="text-base font-light text-(--text) leading-snug">{project.titleZh}</h3>
          <p className="text-xs text-(--muted) font-light mt-0.5 opacity-60">{project.title}</p>
        </div>
        {project.github && (
          <a
            href={project.github}
            target="_blank"
            rel="noopener noreferrer"
            className="text-(--border) hover:text-(--accent) transition-colors ml-3 mt-1 shrink-0"
            aria-label="GitHub"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
          </a>
        )}
      </div>

      {/* 中文說明（主） */}
      <p className="text-[13px] font-light text-(--text) leading-relaxed mb-2">
        {project.descriptionZh}
      </p>
      <p className="text-[12px] font-light text-(--muted) leading-relaxed mb-4 opacity-60">
        {project.description}
      </p>

      {/* Highlight */}
      <div
        className="text-[11px] text-(--accent) font-light mb-4 pl-3 border-l-2 border-(--accent-lt) space-y-0.5"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        <div>{project.highlightZh}</div>
        <div className="opacity-50">{project.highlight}</div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mt-auto">
        {project.tags.map((tag) => (
          <span
            key={tag}
            className="px-2 py-0.5 text-[11px] font-light text-(--muted) bg-(--surface) border border-(--border) rounded-sm"
          >
            {tag}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

function SectionLabel({ label, labelZh }: { label: string; labelZh: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -12 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5 }}
      className="flex items-center gap-4 mb-6"
    >
      <div className="w-5 h-[1px] bg-(--accent)" />
      <p
        className="text-xs tracking-[0.3em] text-(--accent) uppercase"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {label} &nbsp;·&nbsp; {labelZh}
      </p>
    </motion.div>
  );
}

function TagFilterBar({
  activeTag,
  onSelect,
}: {
  activeTag: string | null;
  onSelect: (tag: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-10 md:mb-14">
      <button
        onClick={() => onSelect(null)}
        className={`px-3 py-1 text-[11px] font-light rounded-sm border tracking-wide transition-colors ${
          activeTag === null
            ? "text-(--accent) border-(--accent) bg-(--accent-lt)"
            : "text-(--muted) border-(--border) bg-(--surface) hover:border-(--accent) hover:text-(--accent)"
        }`}
        style={{ fontFamily: "var(--font-mono)" }}
      >
        全部 · All
      </button>
      {allTags.map((tag) => (
        <button
          key={tag}
          onClick={() => onSelect(activeTag === tag ? null : tag)}
          className={`px-3 py-1 text-[11px] font-light rounded-sm border tracking-wide transition-colors ${
            activeTag === tag
              ? "text-(--accent) border-(--accent) bg-(--accent-lt)"
              : "text-(--muted) border-(--border) bg-(--surface) hover:border-(--accent) hover:text-(--accent)"
          }`}
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}

export default function PortfolioSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const filteredPersonal = useMemo(
    () => (activeTag ? personalProjects.filter((p) => p.tags.includes(activeTag)) : personalProjects),
    [activeTag]
  );
  const filteredCourse = useMemo(
    () => (activeTag ? courseProjects.filter((p) => p.tags.includes(activeTag)) : courseProjects),
    [activeTag]
  );

  return (
    <section id="portfolio" className="py-20 md:py-32">
      <div className="max-w-5xl mx-auto px-6">

        {/* Title */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="mb-10 md:mb-16"
        >
          <p
            className="text-xs tracking-[0.35em] text-(--muted) uppercase mb-4"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Work
          </p>
          <RevealHeading
            text="製作物 · Portfolio"
            className="text-3xl sm:text-4xl font-light text-(--text) mb-3"
            style={{ fontFamily: "var(--font-serif)" }}
          />
          <p className="text-sm font-light text-(--muted)">
            自分で開発した作品と、課程中の学習専題。
          </p>
        </motion.div>

        <TagFilterBar activeTag={activeTag} onSelect={setActiveTag} />

        {/* 個人専案 */}
        {filteredPersonal.length > 0 && (
          <div className="mb-10 md:mb-16">
            <SectionLabel label="Personal Projects" labelZh="個人専案" />
            <div className="grid md:grid-cols-2 gap-5">
              {filteredPersonal.map((p, i) => (
                <ProjectCard key={p.slug} project={p} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* 課程専題 */}
        {filteredCourse.length > 0 && (
          <div>
            <SectionLabel label="Course Projects" labelZh="課程専題 · 学習記録" />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCourse.map((p, i) => (
                <ProjectCard key={p.slug} project={p} index={i} />
              ))}
            </div>
          </div>
        )}

        {filteredPersonal.length === 0 && filteredCourse.length === 0 && (
          <p className="text-sm font-light text-(--muted) text-center py-12">
            沒有符合「{activeTag}」的作品。
          </p>
        )}

        <motion.p
          className="text-xs text-(--muted) font-light mt-10 text-center tracking-wide opacity-50"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 0.5 } : {}}
          transition={{ delay: 0.8 }}
          style={{ fontFamily: "var(--font-mono)" }}
        >
          学習記録は非公開リポジトリに保存されています。
        </motion.p>
      </div>
    </section>
  );
}
