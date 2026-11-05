import type { ReactNode } from "react";
import type { Route } from "next";
import Link from "next/link";
import Eyebrow from "@/components/ui/Eyebrow";

// 首頁以外的獨立頁面（/now、/uses、/blog、/resume、作品詳細頁、404）共用的外框：
// 置中的窄欄 + 左上角「← 返回」小連結。原本 7 個頁面逐字複製同一段。
// eyebrow / title / intro：/now、/uses、/blog、404 共用的「小標 + 大標 + 一段說明」開頭。
// printable：/resume 列印成 A4 時拿掉留白跟返回連結。
export default function PageShell({
  backHref = "/",
  backLabel = "返回首頁",
  printable = false,
  eyebrow,
  title,
  intro,
  children,
}: {
  backHref?: Route;
  backLabel?: string;
  printable?: boolean;
  eyebrow?: string;
  title?: ReactNode;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={`min-h-screen bg-(--bg) px-6 py-20 ${printable ? "print:py-0 print:px-0" : ""}`}>
      <div aria-hidden className="scroll-progress fixed top-0 left-0 right-0 z-50 h-[2px] bg-(--accent) print:hidden" />
      <div className={`max-w-2xl mx-auto ${printable ? "print:max-w-none" : ""}`}>
        <Link
          href={backHref}
          className="inline-block py-3 -my-3 text-xs tracking-[0.2em] text-(--muted) hover:text-(--accent) transition-colors font-mono print:hidden"
        >
          ← {backLabel}
        </Link>
        {eyebrow && <Eyebrow className="mt-10 mb-4">{eyebrow}</Eyebrow>}
        {title && <h1 className="text-3xl sm:text-4xl font-light text-(--text) mb-4 font-serif">{title}</h1>}
        {intro && <p className="text-sm font-light text-(--muted) mb-14 leading-relaxed">{intro}</p>}
        {children}
      </div>
    </div>
  );
}
