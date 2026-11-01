"use client";

import { useEffect, useRef, useState } from "react";
import Magnetic from "@/components/ui/Magnetic";
import Reveal from "@/components/ui/Reveal";
import RevealHeading from "@/components/ui/RevealHeading";
import Underline, { underlineLinkClass } from "@/components/ui/Underline";
import { DownloadIcon, FacebookIcon, GitHubIcon, InstagramIcon, MailIcon } from "@/components/ui/icons";
import Eyebrow from "@/components/ui/Eyebrow";

const EMAIL = "1394kbs@gmail.com";
const linkClass = `${underlineLinkClass} text-(--muted) hover:text-(--text)`;

const links = [
  { href: "/resume.pdf", label: "下載履歷 · Resume", icon: <DownloadIcon />, download: true },
  { href: "https://github.com/kbs0830", label: "GitHub", icon: <GitHubIcon size={15} /> },
  { href: "https://www.facebook.com/tra0830", label: "Facebook", icon: <FacebookIcon /> },
  { href: "https://www.instagram.com/pingwei_0830/", label: "Instagram", icon: <InstagramIcon /> },
];

export default function ContactSection() {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const copyEmail = () => {
    navigator.clipboard.writeText(EMAIL).then(() => {
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <section id="contact" className="py-20 md:py-32 bg-(--surface)">
      <div className="max-w-5xl mx-auto px-6">
        <Reveal>
          <Eyebrow className="mb-4">Contact</Eyebrow>
          <RevealHeading
            text="連絡先 · Get in Touch"
            className="text-3xl sm:text-4xl font-light text-(--text) mb-6"
            style={{ fontFamily: "var(--font-serif)" }}
          />
          <p className="text-(--text) font-light text-[15px] max-w-md leading-relaxed mb-3">
            合作・技術交流、或只是一段有趣的対話——關於 AI、網頁、或任何好奇的事。
          </p>
          <p className="text-(--muted) font-light text-sm max-w-md leading-relaxed mb-12">
            Open to collaborations, technical discussions, or just a conversation
            about AI, the web, or anything that sparks curiosity.
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap gap-5 sm:gap-8">
            {/* Email：點了複製到剪貼簿，上方跳「已複製！」 */}
            <div className="relative">
              <Magnetic>
                <button onClick={copyEmail} className={linkClass}>
                  <MailIcon />
                  {EMAIL}
                  <Underline />
                </button>
              </Magnetic>
              <span
                role="status"
                className={`absolute -top-8 left-1/2 -translate-x-1/2 text-xs text-(--accent) bg-(--bg) border border-(--border) px-3 py-1 rounded-sm whitespace-nowrap transition-[opacity,translate,visibility] duration-200 ${
                  copied ? "opacity-100 translate-y-0" : "invisible opacity-0 translate-y-1.5"
                }`}
                style={{ fontFamily: "var(--font-mono)" }}
              >
                已複製！
              </span>
            </div>

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
