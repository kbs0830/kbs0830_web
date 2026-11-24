import NavBar from "@/components/ui/NavBar";
import BackToTop from "@/components/ui/BackToTop";
import LocalClock from "@/components/ui/LocalClock";
import VisitorStats from "@/components/ui/VisitorStats";
import { PresenceCount } from "@/components/ui/Presence";
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
import SiteFooter from "@/components/ui/SiteFooter";

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
      <SiteFooter
        width="max-w-5xl"
        inset="inner"
        extra={
          <>
            <LocalClock />
            <PresenceCount />
            <VisitorStats />
          </>
        }
      />
      <BackToTop />
      <KeyboardShortcuts />
      <KonamiEgg />
      <TerminalMode projectListing={projectListing} />
    </>
  );
}
