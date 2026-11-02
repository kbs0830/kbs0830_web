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
import { projects } from "@/lib/projects";

// 終端機 `ls projects` 的輸出，在 server 排好再傳給 client 元件
const projectListing = projects.map((p) => `${p.slug.padEnd(24)} ${p.status}`).join("\n");

export default function Home() {
  return (
    <>
      <NavBar />
      <main>
        <HeroSection />
        <AboutSection />
        <PortfolioSection />
        <ContactSection />
      </main>
      <footer className="py-8 border-t border-(--border)">
        <div className="max-w-5xl mx-auto px-6 flex flex-wrap items-center justify-between gap-2">
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
