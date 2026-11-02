import type { ReactNode } from "react";
import Link from "next/link";

// 首頁以外的獨立頁面（/now、/uses、/blog、/resume、作品詳細頁、404）共用的外框：
// 置中的窄欄 + 左上角「← 返回」小連結。原本 7 個頁面逐字複製同一段。
// printable：/resume 列印成 A4 時拿掉留白跟返回連結。
export default function PageShell({
  backHref = "/",
  backLabel = "返回首頁",
  printable = false,
  children,
}: {
  backHref?: string;
  backLabel?: string;
  printable?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`min-h-screen bg-(--bg) px-6 py-20 ${printable ? "print:py-0 print:px-0" : ""}`}>
      <div className={`max-w-2xl mx-auto ${printable ? "print:max-w-none" : ""}`}>
        <Link
          href={backHref}
          className="inline-block py-3 -my-3 text-xs tracking-[0.2em] text-(--muted) hover:text-(--accent) transition-colors font-mono print:hidden"
        >
          ← {backLabel}
        </Link>
        {children}
      </div>
    </div>
  );
}
