// Server Component；互動只有複製 Email（CopyEmailButton）跟磁吸效果（Magnetic），兩地時刻在 ContactRoute
//
// 2026-11-27（TODO M16，使用者：「按下連絡先的時候頁面自動往下以外還要放大滿版有視覺衝擊」；決定「1 保留 2 做」）：
//   - 整區是一整個螢幕高的色塊（.contact-stage）：淺色模式是淡藍灰的和紙色、深色模式是偏藍的墨色。
//     2026-11-28 使用者：「連絡先太黑了，太突兀了」→ 原本淺色模式也整區反白成深墨（data-theme="dark"），拿掉了
//   - 底部留 pb-24：右下角「↑ 回頂端」（bottom-8＋40px 高）不會蓋到最底下的航線（2026-11-28 使用者：被右下角的按鈕擋住）
//   - 捲到時從內縮的圓角卡片推成滿版（globals.css .contact-stage，CSS 捲動動畫，區塊填滿螢幕時剛好展開完）。
//     NavBar／封面的「聯絡我」只負責捲下來，展開是捲動自己播的；用滾輪捲的人也看得到
//   - 標題保留「連絡先 · Get in Touch」（決定 1），放大；Email 當主角；最底下高雄 → 福岡的航線收尾
import type { ReactNode } from "react";
import Magnetic from "@/components/ui/Magnetic";
import Underline, { underlineLinkClass } from "@/components/ui/Underline";
import { GitHubIcon, InstagramIcon } from "@/components/ui/icons";
import Eyebrow from "@/components/ui/Eyebrow";
import CopyEmailButton from "@/components/sections/CopyEmailButton";
import ContactRoute from "@/components/sections/ContactRoute";
import { EMAIL, GITHUB_URL, INSTAGRAM_URL } from "@/lib/site/site";
import { HOME_WIDTH } from "@/components/layout/home-width";

const linkClass = `${underlineLinkClass} text-(--muted) hover:text-(--text)`;

// 「下載履歷 · Resume」按鈕 2026-11-05 依使用者要求先隱藏（public/resume.pdf 照常在部署時自動重印）。
// 要恢復：把下面這行加回 links 最前面，並 import DownloadIcon
//   { href: "/resume.pdf", label: "下載履歷 · Resume", icon: <DownloadIcon />, download: true },
const links: { href: string; label: string; icon: ReactNode; download?: boolean }[] = [
  { href: GITHUB_URL, label: "GitHub", icon: <GitHubIcon size={15} /> },
  // Facebook 2026-11-05 依使用者要求先隱藏；要恢復：加回這行並 import FacebookIcon、FACEBOOK_URL
  //   { href: FACEBOOK_URL, label: "Facebook", icon: <FacebookIcon /> },
  { href: INSTAGRAM_URL, label: "Instagram", icon: <InstagramIcon /> },
];

export default function ContactSection() {
  return (
    <section id="contact" className="contact-stage relative min-h-svh flex bg-(--bg) text-(--text)">
      <div className={`contact-inner ${HOME_WIDTH} w-full mx-auto px-6 pt-28 pb-24 flex flex-col`}>
        <div className="flex-1 flex flex-col justify-center">
          <Eyebrow className="mb-6 sm:mb-8">03 — Contact</Eyebrow>
          <h2 className="contact-title font-serif font-light leading-[1.1] text-[clamp(2.75rem,11vw,6rem)] tracking-[0.01em] mb-8 sm:mb-10">
            <span className="block sm:inline">連絡先</span>
            <span aria-hidden className="hidden sm:inline text-(--muted)"> · </span>
            <span className="block sm:inline">Get in Touch</span>
          </h2>
          <p className="font-light text-[15px] sm:text-base 3xl:text-lg max-w-xl leading-relaxed break-keep mb-2">
            想合作、聊技術，或只是聊聊 AI、網頁跟飛機——都歡迎寫信來。
          </p>
          <p className="text-(--muted) font-light text-sm 3xl:text-[15px] max-w-xl leading-relaxed mb-12 sm:mb-16">
            Collaborations, tech talk, or just a chat about AI, the web, or planes — my inbox is open.
          </p>

          {/* Email 是主角：大字，點一下複製；其他連結小字放下面 */}
          <CopyEmailButton
            email={EMAIL}
            className="group relative inline-flex items-center gap-3 sm:gap-4 pb-2 text-[clamp(1.375rem,6.5vw,3rem)] font-light tracking-wide text-(--text) hover:text-(--accent) transition-colors whitespace-nowrap [&>svg]:size-[0.7em]"
          />
          <div className="flex flex-wrap gap-x-8 gap-y-3 mt-8">
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
        </div>

        <div className="mt-16">
          <ContactRoute />
        </div>
      </div>
    </section>
  );
}
