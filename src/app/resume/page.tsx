import type { Metadata } from "next";
import { withShare } from "@/lib/share-meta";
import Link from "next/link";
import type { ReactNode } from "react";
import { projects } from "@/lib/projects";
import { EMAIL, GITHUB_URL } from "@/lib/site";
import { certifications, education, resumeFeaturedSlugs, resumeRole, resumeSkillGroups } from "@/lib/page-content";
import PageShell from "@/components/ui/PageShell";
import SectionHeading from "@/components/ui/SectionHeading";

export const metadata: Metadata = withShare({
  title: "履歷 · Resume — PINGWEI LI",
  description: "PINGWEI LI 履歷：教育背景、技能、作品集。",
  alternates: { canonical: "/resume", types: { "text/markdown": "/resume.md" } },
});

const featured = projects.filter((p) => resumeFeaturedSlugs.includes(p.slug));

function ResumeSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-10 print:mb-6">
      <SectionHeading className="mb-4 print:mb-2">{title}</SectionHeading>
      {children}
    </section>
  );
}

export default function ResumePage() {
  return (
    <PageShell printable>
      <div className="mt-10 print:mt-0 mb-10 print:mb-6">
        <h1 className="text-3xl font-light text-(--text) mb-1 font-serif">
          PINGWEI LI
        </h1>
        <p className="text-sm text-(--accent) font-light mb-3">
          {resumeRole}
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-(--muted) font-mono">
          <span>{EMAIL}</span>
          <span>{GITHUB_URL.replace("https://", "")}</span>
          <span>高雄，台灣 ↔ 福岡，日本</span>
        </div>
      </div>

      <ResumeSection title="教育 · Education">
        <div className="space-y-4 print:space-y-2">
          {education.map((e) => (
            <div key={e.school} className="grid sm:grid-cols-[1fr_auto] gap-1">
              <div>
                <p className="text-sm text-(--text)">{e.school}　{e.program}</p>
                <p className="text-xs text-(--muted)">{e.schoolEn}</p>
              </div>
              <p className="text-xs text-(--muted) sm:text-right font-mono">
                {e.period}
              </p>
            </div>
          ))}
        </div>
      </ResumeSection>

      <ResumeSection title="技能 · Skills">
        <div className="space-y-2">
          {resumeSkillGroups.map((g) => (
            <div key={g.label} className="grid sm:grid-cols-[100px_1fr] gap-1 sm:gap-3">
              <p className="text-xs text-(--muted)">{g.label}</p>
              <p className="text-sm text-(--text)">{g.items.join("、")}</p>
            </div>
          ))}
        </div>
      </ResumeSection>

      <ResumeSection title="證照 · Certifications">
        <div className="space-y-2">
          {certifications.map((g) => (
            <div key={g.group} className="grid sm:grid-cols-[100px_1fr] gap-1 sm:gap-3">
              <p className="text-xs text-(--muted)">{g.group}</p>
              <ul className="text-sm text-(--text) space-y-0.5">
                {g.items.map((c) => (
                  <li key={c.name}>
                    {c.name}
                    {"detail" in c && c.detail && <span className="text-(--accent) font-mono text-xs">　{c.detail}</span>}
                    {"issuer" in c && c.issuer && <span className="text-(--muted) text-xs">　{c.issuer}</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </ResumeSection>

      <ResumeSection title="作品 · Projects">
        <div className="space-y-5 print:space-y-3">
          {featured.map((p) => (
            <div key={p.slug} className="break-inside-avoid">
              <p className="text-sm text-(--text)">{p.titleZh}　{p.title}</p>
              <p className="text-xs text-(--muted) leading-relaxed mt-0.5">{p.descriptionZh}</p>
              <p className="text-xs text-(--accent) mt-1 font-mono">{p.highlightZh}</p>
            </div>
          ))}
        </div>
      </ResumeSection>

      <p className="text-xs text-(--muted) print:hidden">
        完整作品說明與技術細節請見{" "}
        <Link href="/" className="underline hover:text-(--accent) transition-colors">
          kbs0830.com
        </Link>
        。
      </p>
    </PageShell>
  );
}
