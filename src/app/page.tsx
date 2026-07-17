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
              className="text-xs text-(--muted) font-light tracking-[0.2em]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              © 2026 PINGWEI LI
            </p>
            <Link
              href="/blog"
              className="text-xs text-(--muted) font-light tracking-[0.2em] hover:text-(--accent) transition-colors"
              style={{ fontFamily: "var(--font-mono)" }}
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
      <TerminalMode />
    </>
  );
}
