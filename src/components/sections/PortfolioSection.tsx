"use client";

import { useState, ViewTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { projects, personalProjects, courseProjects, statusColor } from "@/lib/projects";
import Reveal from "@/components/ui/Reveal";
import RevealHeading from "@/components/ui/RevealHeading";
import { GitHubIcon } from "@/components/ui/icons";
import Eyebrow from "@/components/ui/Eyebrow";
import TagBadge from "@/components/ui/TagBadge";

const allTags = Array.from(new Set(projects.flatMap((p) => p.tags))).sort((a, b) =>
  a.localeCompare(b, "en")
);

function ProjectCard({
  project,
  index,
}: {
  project: (typeof projects)[0];
  index: number;
}) {
  // 淡入（Reveal 的 translate）跟 hover 上浮（卡片本身的 translate）分在兩層，互不覆蓋
  return (
    <Reveal distance={28} delay={index * 0.1} margin={60} className="flex">
      <div className="group relative flex-1 border border-(--border) bg-(--bg) rounded-sm p-7 hover:border-(--accent) hover:-translate-y-1 transition-all duration-300 flex flex-col">
        <Link
          href={`/projects/${project.slug}`}
          className="absolute inset-0 z-0 rounded-sm"
          aria-label={`查看「${project.titleZh}」詳情`}
        />
        <div className="absolute top-0 left-0 h-[2px] w-0 bg-(--accent) group-hover:w-full transition-all duration-500 rounded-t-sm" />

        <div className="relative z-10 flex flex-col flex-1 pointer-events-none">
          {project.image && (
            <ViewTransition name={`project-image-${project.slug}`} share="morph" default="none">
              <div className="relative -mx-7 -mt-7 mb-5 aspect-video overflow-hidden rounded-t-sm bg-(--surface)">
                <Image
                  src={project.image}
                  alt={`${project.titleZh} 截圖`}
                  fill
                  className="object-cover grayscale-[10%] group-hover:grayscale-0 transition-[filter] duration-500"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </ViewTransition>
          )}
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
              {/* 跟 /projects/[slug] 的 <h1> 同名，點進詳細頁時標題會 morph 過去 */}
              <ViewTransition name={`project-title-${project.slug}`} share="morph" default="none">
                <h3 className="text-base font-light text-(--text) leading-snug group-hover:text-(--accent) transition-colors">
                  {project.titleZh}
                </h3>
              </ViewTransition>
              <p className="text-xs text-(--muted) font-light mt-0.5 opacity-60">{project.title}</p>
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
          <div className="flex flex-wrap gap-1.5 mt-auto mb-3">
            {project.tags.map((tag) => (
              <TagBadge key={tag}>{tag}</TagBadge>
            ))}
          </div>

          <p
            className="text-[11px] text-(--muted) group-hover:text-(--accent) transition-colors"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            查看詳情 · View Details →
          </p>
        </div>
      </div>
    </Reveal>
  );
}

function SectionLabel({ label, labelZh }: { label: string; labelZh: string }) {
  return (
    <Reveal from="left" duration={0.5} margin={60} className="flex items-center gap-4 mb-6">
      <div className="w-5 h-[1px] bg-(--accent)" />
      <p
        className="text-xs tracking-[0.3em] text-(--accent) uppercase"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {label} &nbsp;·&nbsp; {labelZh}
      </p>
    </Reveal>
  );
}

function TagFilterBar({
  activeTag,
  onSelect,
}: {
  activeTag: string | null;
  onSelect: (tag: string | null) => void;
}) {
  const chip = (label: string, tag: string | null) => (
    <button
      key={label}
      onClick={() => onSelect(tag)}
      aria-pressed={activeTag === tag}
      className={`px-3 py-1 text-[11px] font-light rounded-sm border tracking-wide transition-colors ${
        activeTag === tag
          ? "text-(--accent) border-(--accent) bg-(--accent-lt)"
          : "text-(--muted) border-(--border) bg-(--surface) hover:border-(--accent) hover:text-(--accent)"
      }`}
      style={{ fontFamily: "var(--font-mono)" }}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-wrap gap-2 mb-10 md:mb-14">
      {chip("全部 · All", null)}
      {allTags.map((tag) => chip(tag, tag))}
    </div>
  );
}

export default function PortfolioSection() {
  const [activeTag, setActiveTag] = useState<string | null>(null);
  // 不用 useMemo：React Compiler 會自動 memoize
  const matches = (p: (typeof projects)[0]) => !activeTag || p.tags.includes(activeTag);
  const filteredPersonal = personalProjects.filter(matches);
  const filteredCourse = courseProjects.filter(matches);
  // 再點一次目前選中的 tag = 取消篩選
  const selectTag = (tag: string | null) => setActiveTag((cur) => (cur === tag ? null : tag));

  return (
    <section id="portfolio" className="py-20 md:py-32">
      <div className="max-w-5xl mx-auto px-6">

        {/* Title */}
        <Reveal className="mb-10 md:mb-16">
          <Eyebrow className="mb-4">Work</Eyebrow>
          <RevealHeading
            text="製作物 · Portfolio"
            className="text-3xl sm:text-4xl font-light text-(--text) mb-3"
            style={{ fontFamily: "var(--font-serif)" }}
          />
          <p className="text-sm font-light text-(--muted)">
            自分で開発した作品と、課程中の学習専題。
          </p>
        </Reveal>

        <TagFilterBar activeTag={activeTag} onSelect={selectTag} />

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

        <Reveal delay={0.3} distance={0}>
          <p
            className="text-xs text-(--muted) font-light mt-10 text-center tracking-wide opacity-50"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            学習記録は非公開リポジトリに保存されています。
          </p>
        </Reveal>
      </div>
    </section>
  );
}
