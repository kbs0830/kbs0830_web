import NavBar from "@/components/layout/NavBar";
import BackToTop from "@/components/layout/BackToTop";
import FooterLive from "@/components/live/FooterLive";
import LocalClock from "@/components/live/LocalClock";
import VisitorStats from "@/components/live/VisitorStats";
import { PresenceCount } from "@/components/live/Presence";
import KeyboardShortcuts from "@/components/layout/KeyboardShortcuts";
import KonamiEgg from "@/components/fun/KonamiEgg";
import TerminalMode from "@/components/fun/TerminalMode";
import HeroSection from "@/components/sections/HeroSection";
import AboutSection from "@/components/sections/AboutSection";
import PortfolioSection from "@/components/sections/PortfolioSection";
import ContactSection from "@/components/sections/ContactSection";
import LatestPosts from "@/components/sections/LatestPosts";
import { listedProjects as projects } from "@/lib/content/projects";
import { getAllPosts } from "@/lib/content/blog";
import { PERSON_ID, SITE_URL } from "@/lib/site/site";
import JsonLd from "@/components/ui/JsonLd";
import SiteFooter from "@/components/layout/SiteFooter";
import { HOME_WIDTH } from "@/components/layout/home-width";

// 終端機 `ls projects` 的輸出，在 server 排好再傳給 client 元件
const projectListing = projects.map((p) => `${p.slug.padEnd(24)} ${p.status}`).join("\n");
// 終端機 `blog` 的輸出：最新 8 篇（日期＋標題＋網址），一樣在 server 排好
const blogListing = getAllPosts()
  .slice(0, 8)
  .map((p) => `${p.date}  ${p.title}\n            /blog/${p.slug}`)
  .join("\n");

export default function Home() {
  return (
    <>
      {/* 告訴搜尋引擎「首頁就是這個人的個人檔案頁」，人名搜尋比較容易把首頁對上 layout 的 Person */}
      <JsonLd data={{ "@context": "https://schema.org", "@type": "ProfilePage", url: SITE_URL, mainEntity: { "@id": PERSON_ID } }} />
      <NavBar />
      <main id="main" tabIndex={-1} className="outline-none">
        <HeroSection />
        <AboutSection />
        <PortfolioSection />
        <LatestPosts />
        <ContactSection />
      </main>
      <SiteFooter
        width={HOME_WIDTH}
        inset="inner"
        findMe={false}
        extra={
          <>
            <LocalClock />
            <PresenceCount />
            <VisitorStats />
            <FooterLive className="text-xs text-(--muted) font-light font-mono" />
          </>
        }
      />
      <BackToTop />
      <KeyboardShortcuts />
      <KonamiEgg />
      <TerminalMode projectListing={projectListing} blogListing={blogListing} />
    </>
  );
}
