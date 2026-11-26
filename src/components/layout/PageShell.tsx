import type { ReactNode } from "react";
import type { Route } from "next";
import Link from "next/link";
import Eyebrow from "@/components/ui/Eyebrow";
import QuickJumpButton from "@/components/layout/QuickJumpButton";
import SiteFooter from "@/components/layout/SiteFooter";
import ThemeToggle from "@/components/layout/ThemeToggle";
import BackToTop from "@/components/layout/BackToTop";
import PageMenu from "@/components/layout/PageMenu";
import PageTopBar from "@/components/layout/PageTopBar";

// 首頁以外的獨立頁面（/now、/uses、/blog、/resume、作品詳細頁、404）共用的外框：
// 置中的窄欄 + 左上角「← 返回」小連結。原本 7 個頁面逐字複製同一段。
// eyebrow / title / intro：/now、/uses、/blog、404 共用的「小標 + 大標 + 一段說明」開頭。
// printable：/resume 列印成 A4 時拿掉留白跟返回連結。
// 2026-11-23：右上角「搜尋」打開快速跳轉（QuickJump），最下面接全站頁尾（頁面索引），子頁面不再是死路。
// 2026-11-24：右上角再加主題切換（TODO F1）。
// 2026-11-26：頁首固定在上方（TODO F2，PageTopBar），後台（compact）不固定。
// 外框用 flex-1（body 是 flex-col）把頁尾推到底，短頁面（404）頁尾也在畫面裡，不用 min-h-svh 把它擠出去。
export default function PageShell({
  backHref = "/",
  backLabel = "返回首頁",
  printable = false,
  compact = false,
  eyebrow,
  title,
  intro,
  children,
}: {
  backHref?: Route;
  backLabel?: string;
  printable?: boolean;
  /** 站長後台用：上下留白、標題、說明都縮小（手機上一打開就看到內容） */
  compact?: boolean;
  eyebrow?: string;
  title?: ReactNode;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <div className={`flex-1 bg-(--bg) px-6 ${compact ? "pb-6 sm:pb-12" : "pb-20"} ${printable ? "print:py-0 print:px-0" : ""}`}>
        <div aria-hidden className="scroll-progress fixed top-0 left-0 right-0 z-50 h-[2px] bg-(--accent) print:hidden" />
        <PageTopBar width={`${compact ? "max-w-3xl" : "max-w-2xl"} ${printable ? "print:max-w-none" : ""}`} sticky={!compact}>
            <Link
              href={backHref}
              className="inline-block py-3 -my-3 text-xs tracking-[0.2em] text-(--muted) hover:text-(--accent) transition-colors font-mono"
            >
              ← {backLabel}
            </Link>
            {/* 2026-11-24 TODO F1：子頁面也能切深色模式。手機：搜尋改成圖示、多一個選單（全站目錄收在裡面） */}
            <div className="flex items-center gap-4">
              <span className="hidden sm:contents">
                <QuickJumpButton className="py-3 -my-3" />
              </span>
              <QuickJumpButton icon className="sm:hidden w-10 h-11 -mx-2 -my-3.5 flex items-center justify-center text-(--muted) hover:text-(--accent) transition-colors" />
              <ThemeToggle className="w-10 h-11 -mx-2 -my-3.5 flex items-center justify-center text-(--muted) hover:text-(--accent) transition-colors" />
              <PageMenu />
            </div>
        </PageTopBar>
        <main id="main" tabIndex={-1} className={`outline-none ${compact ? "max-w-3xl" : "max-w-2xl"} mx-auto ${printable ? "print:max-w-none" : ""}`}>
          {eyebrow && <Eyebrow className={compact ? "mt-2 mb-2" : "mt-8 mb-4"}>{eyebrow}</Eyebrow>}
          {title && <h1 className={`font-light text-(--text) font-serif ${compact ? "text-2xl sm:text-3xl mb-1" : "text-3xl sm:text-4xl mb-4"}`}>{title}</h1>}
          {intro && <p className={`text-sm font-light text-(--muted) leading-relaxed ${compact ? "mb-5" : "mb-14"}`}>{intro}</p>}
          {children}
        </main>
      </div>
      <SiteFooter />
      {/* 2026-11-24：子頁面在手機上也有右下角 ↑（桌機維持原樣，不加） */}
      <div className="print:hidden sm:hidden">
        <BackToTop />
      </div>
    </>
  );
}
