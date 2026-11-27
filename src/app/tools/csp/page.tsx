import type { Metadata } from "next";
import { withShare } from "@/lib/site/share-meta";
import PageShell from "@/components/layout/PageShell";
import CspAnalyzer from "@/components/tools/CspAnalyzer";
import ToolNote from "@/components/tools/ToolNote";
import ToolJsonLd from "@/components/tools/ToolJsonLd";

// CSP 標頭解讀（TODO J16，2026-11-26）
export const metadata: Metadata = withShare({
  title: "CSP 標頭解讀：逐條解釋、標出 unsafe-inline 風險 · CSP Analyzer — PINGWEI LI",
  description: "貼上 Content-Security-Policy，逐條用中文解釋每個指令，標出 unsafe-inline、unsafe-eval、萬用字元、缺少 base-uri 這類常見風險，並給修改建議。全部在瀏覽器裡跑。",
  alternates: { canonical: "/tools/csp" },
});

export default function CspPage() {
  return (
    <PageShell
      backHref="/tools"
      backLabel="返回小工具"
      eyebrow="Tools · CSP"
      title={<>CSP 標頭解讀</>}
      intro="Content-Security-Policy 一長串看不懂？貼進來，每條指令在管什麼、哪裡寫得太鬆、少了什麼，一次看完。"
    >
      <ToolJsonLd href="/tools/csp" />
      <CspAnalyzer />
      <ToolNote>
        <p>
          這個網站自己的 CSP 是從 Report-Only 一路調到正式開的：先收違規報告、把誤擋的來源補進去，再切成會真的擋。
          這個工具把那段過程裡常查的東西整理成檢查表。
        </p>
        <p>
          判斷只看「寫法」：例如 script-src 的 <span className="font-mono">&apos;unsafe-inline&apos;</span>、<span className="font-mono">*</span>、
          整個 <span className="font-mono">https:</span>、公共 CDN 沒加路徑，都會讓 XSS 注入的腳本照樣被放行。
          它不會去連線檢查網址是否存在，也不知道你的網站實際載入了什麼，所以「沒有風險」不等於「沒有問題」。
          框架（例如 Next.js 的行內腳本）有時必須先接受某些寫法，建議拿到結果後搭配 Report-Only 慢慢收緊。
        </p>
        <p>全部在你的瀏覽器裡比對，貼的內容不會送出去。</p>
      </ToolNote>
    </PageShell>
  );
}
