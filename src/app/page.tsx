import NavBar from "@/components/ui/NavBar";
import BackToTop from "@/components/ui/BackToTop";
import LocalClock from "@/components/ui/LocalClock";
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
          <p
            className="text-xs text-(--muted) font-light tracking-[0.2em]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            © 2026 PINGWEI LI
          </p>
          <LocalClock />
        </div>
      </footer>
      <BackToTop />
      <KeyboardShortcuts />
      <KonamiEgg />
      <TerminalMode />
    </>
  );
}
