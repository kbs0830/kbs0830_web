import type { Metadata } from "next";
import Link from "next/link";
import { projects } from "@/lib/projects";

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
    school: "市立中正高級工業職業學校",
    schoolEn: "Taipei Municipal Zhongzheng Vocational High School",
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
  ["foodlens-advisor", "yartix-ticketing", "frc-robot", "auto-following-robot"].includes(p.slug)
);

export default function ResumePage() {
  return (
    <div className="min-h-screen bg-(--bg) px-6 py-20 print:py-0 print:px-0">
      <div className="max-w-2xl mx-auto print:max-w-none">
        <Link
          href="/"
          className="text-xs tracking-[0.2em] text-(--muted) hover:text-(--accent) transition-colors print:hidden"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          ← 返回首頁
        </Link>

        <div className="mt-10 print:mt-0 mb-10 print:mb-6">
          <h1
            className="text-3xl font-light text-(--text) mb-1"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            PINGWEI LI
          </h1>
          <p className="text-sm text-(--accent) font-light mb-3">
            AI 工程師 · 網頁開發者 &nbsp;/&nbsp; AI Engineer · Web Developer
          </p>
          <div
            className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-(--muted)"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <span>1394kbs@gmail.com</span>
            <span>github.com/kbs0830</span>
            <span>高雄，台灣 ↔ 福岡，日本</span>
          </div>
        </div>

        <section className="mb-10 print:mb-6">
          <p
            className="text-xs tracking-[0.2em] text-(--accent) uppercase mb-4 print:mb-2"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            教育 · Education
          </p>
          <div className="space-y-4 print:space-y-2">
            {education.map((e) => (
              <div key={e.school} className="grid sm:grid-cols-[1fr_auto] gap-1">
                <div>
                  <p className="text-sm text-(--text)">{e.school}　{e.program}</p>
                  <p className="text-xs text-(--muted)">{e.schoolEn}</p>
                </div>
                <p
                  className="text-xs text-(--muted) sm:text-right"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {e.period}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10 print:mb-6">
          <p
            className="text-xs tracking-[0.2em] text-(--accent) uppercase mb-4 print:mb-2"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            技能 · Skills
          </p>
          <div className="space-y-2">
            {skillGroups.map((g) => (
              <div key={g.label} className="grid sm:grid-cols-[100px_1fr] gap-1 sm:gap-3">
                <p className="text-xs text-(--muted)">{g.label}</p>
                <p className="text-sm text-(--text)">{g.items.join("、")}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10 print:mb-6">
          <p
            className="text-xs tracking-[0.2em] text-(--accent) uppercase mb-4 print:mb-2"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            作品 · Projects
          </p>
          <div className="space-y-5 print:space-y-3">
            {featured.map((p) => (
              <div key={p.slug} className="break-inside-avoid">
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <p className="text-sm text-(--text)">{p.titleZh}　{p.title}</p>
                </div>
                <p className="text-xs text-(--muted) leading-relaxed mt-0.5">{p.descriptionZh}</p>
                <p
                  className="text-xs text-(--accent) mt-1"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {p.highlightZh}
                </p>
              </div>
            ))}
          </div>
        </section>

        <p className="text-xs text-(--muted) opacity-60 print:hidden">
          完整作品說明與技術細節請見{" "}
          <Link href="/" className="underline hover:text-(--accent) transition-colors">
            kbs0830.com
          </Link>
          。
        </p>
      </div>
    </div>
  );
}
