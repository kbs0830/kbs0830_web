import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { projects } from "@/lib/projects";
import { EMAIL, GITHUB_URL } from "@/lib/site";
import PageShell from "@/components/ui/PageShell";
import SectionHeading from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "履歷 · Resume — PINGWEI LI",
  description: "PINGWEI LI 履歷：教育背景、技能、作品集。",
  alternates: { canonical: "/resume" },
};

const education = [
  {
    school: "國立高雄科技大學",
    schoolEn: "National Kaohsiung University of Science and Technology",
    program: "智慧商務系",
    period: "2024 – 至今",
  },
  {
    school: "高雄市立中正高級工業職業學校",
    schoolEn: "Kaohsiung Municipal Zhongzheng Vocational High School",
    program: "資訊科",
    period: "2021 – 2024",
  },
];

const skillGroups = [
  { label: "AI / 機器学習", items: ["Python", "YOLOv8", "ONNX Runtime", "TensorFlow.js", "Gemini API", "OpenCV"] },
  { label: "後端", items: ["FastAPI", "Flask", "REST API 設計", "Google Sheets API"] },
  { label: "前端", items: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Three.js / R3F"] },
  { label: "工具", items: ["Git", "Jetson Nano", "Raspberry Pi", "Arduino", "丙級電腦硬體裝修"] },
];

const featured = projects.filter((p) =>
  ["foodlens-advisor", "kbs0830-web", "ticketing-system", "frc-robot", "auto-following-robot"].includes(p.slug)
);

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
          AI 工程師 · 網頁開發者 &nbsp;/&nbsp; AI Engineer · Web Developer
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
          {skillGroups.map((g) => (
            <div key={g.label} className="grid sm:grid-cols-[100px_1fr] gap-1 sm:gap-3">
              <p className="text-xs text-(--muted)">{g.label}</p>
              <p className="text-sm text-(--text)">{g.items.join("、")}</p>
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

      <p className="text-xs text-(--muted) opacity-60 print:hidden">
        完整作品說明與技術細節請見{" "}
        <Link href="/" className="underline hover:text-(--accent) transition-colors">
          kbs0830.com
        </Link>
        。
      </p>
    </PageShell>
  );
}
