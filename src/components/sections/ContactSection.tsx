// Server Component；互動只有複製 Email（CopyEmailButton）跟磁吸效果（Magnetic）
import type { ReactNode } from "react";
import Magnetic from "@/components/ui/Magnetic";
import Reveal from "@/components/ui/Reveal";
import RevealHeading from "@/components/ui/RevealHeading";
import Underline, { underlineLinkClass } from "@/components/ui/Underline";
import { FacebookIcon, GitHubIcon, InstagramIcon } from "@/components/ui/icons";
import Eyebrow from "@/components/ui/Eyebrow";
import CopyEmailButton from "@/components/sections/CopyEmailButton";
import { EMAIL, FACEBOOK_URL, GITHUB_URL, INSTAGRAM_URL } from "@/lib/site";

const linkClass = `${underlineLinkClass} text-(--muted) hover:text-(--text)`;

// 「下載履歷 · Resume」按鈕 2026-11-05 依使用者要求先隱藏（public/resume.pdf 照常在部署時自動重印）。
// 要恢復：把下面這行加回 links 最前面，並 import DownloadIcon
//   { href: "/resume.pdf", label: "下載履歷 · Resume", icon: <DownloadIcon />, download: true },
const links: { href: string; label: string; icon: ReactNode; download?: boolean }[] = [
  { href: GITHUB_URL, label: "GitHub", icon: <GitHubIcon size={15} /> },
  { href: FACEBOOK_URL, label: "Facebook", icon: <FacebookIcon /> },
  { href: INSTAGRAM_URL, label: "Instagram", icon: <InstagramIcon /> },
];

export default function ContactSection() {
  return (
    <section id="contact" className="py-20 md:py-32 bg-(--surface)">
      <div className="max-w-5xl mx-auto px-6">
        <Reveal>
          <Eyebrow className="mb-4">Contact</Eyebrow>
          <RevealHeading text="連絡先 · Get in Touch" className="text-3xl sm:text-4xl font-light text-(--text) mb-6 font-serif" />
          <p className="text-(--text) font-light text-[15px] max-w-md leading-relaxed mb-3">
            合作・技術交流、或只是一段有趣的対話——關於 AI、網頁、或任何好奇的事。
          </p>
          <p className="text-(--muted) font-light text-sm max-w-md leading-relaxed mb-12">
            Open to collaborations, technical discussions, or just a conversation
            about AI, the web, or anything that sparks curiosity.
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap gap-5 sm:gap-8">
            <CopyEmailButton email={EMAIL}className={linkClass} />
            {links.map(({ href, label, icon, download }) => (
              <Magnetic key={href}>
                <a
                  href={href}
                  className={linkClass}
                  {...(download ? { download: true } : { target: "_blank", rel: "noopener noreferrer" })}
                >
                  {icon}
                  {label}
                  <Underline />
                </a>
              </Magnetic>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
