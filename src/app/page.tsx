import Link from "next/link";
import NavBar from "@/components/ui/NavBar";
import BackToTop from "@/components/ui/BackToTop";
import LocalClock from "@/components/ui/LocalClock";
import VisitorStats from "@/components/ui/VisitorStats";
import KeyboardShortcuts from "@/components/ui/KeyboardShortcuts";
import KonamiEgg from "@/components/ui/KonamiEgg";
import TerminalMode from "@/components/ui/TerminalMode";
import HeroSection from "@/components/sections/HeroSection";
import AboutSection from "@/components/sections/AboutSection";
import PortfolioSection from "@/components/sections/PortfolioSection";
import ContactSection from "@/components/sections/ContactSection";
import LatestPosts from "@/components/sections/LatestPosts";
import { projects } from "@/lib/projects";
import { PERSON_ID, SITE_URL } from "@/lib/site";
import JsonLd from "@/components/ui/JsonLd";
import BuildInfo from "@/components/ui/BuildInfo";

// 終端機 `ls projects` 的輸出，在 server 排好再傳給 client 元件
const projectListing = projects.map((p) => `${p.slug.padEnd(24)} ${p.status}`).join("\n");

export default function Home() {
  return (
    <>
      {/* 告訴搜尋引擎「首頁就是這個人的個人檔案頁」，人名搜尋比較容易把首頁對上 layout 的 Person */}
      <JsonLd data={{ "@context": "https://schema.org", "@type": "ProfilePage", url: SITE_URL, mainEntity: { "@id": PERSON_ID } }} />
      <NavBar />
      <main>
        <HeroSection />
        <AboutSection />
        <PortfolioSection />
        <LatestPosts />
        <ContactSection />
      </main>
      <footer className="py-8 border-t border-(--border)">
        {/* 右下角固定的 BackToTop 按鈕會壓到內容（寬螢幕時在欄位外面，xl 以下才需要）——右側多留按鈕的寬度，不然頁底最後一行會被它蓋住 */}
        <div className="max-w-5xl mx-auto pl-6 pr-20 xl:pr-6 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <p
              className="text-xs text-(--muted) font-light tracking-[0.2em] font-mono"
            >
              © 2026 PINGWEI LI
            </p>
            <Link
              href="/blog"
              className="text-xs text-(--muted) font-light tracking-[0.2em] hover:text-(--accent) transition-colors font-mono"
            >
              Blog
            </Link>
            <Link
              href="/stats"
              className="text-xs text-(--muted) font-light tracking-[0.2em] hover:text-(--accent) transition-colors font-mono"
            >
              Stats
            </Link>
            <BuildInfo className="text-xs text-(--muted) font-light tracking-[0.1em] font-mono opacity-70" />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <LocalClock />
            <VisitorStats />
          </div>
        </div>
      </footer>
      <BackToTop />
      <KeyboardShortcuts />
      <KonamiEgg />
      <TerminalMode projectListing={projectListing} />
    </>
  );
}
