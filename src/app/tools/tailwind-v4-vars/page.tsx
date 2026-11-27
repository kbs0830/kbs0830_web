import type { Metadata } from "next";
import Link from "next/link";
import { withShare } from "@/lib/site/share-meta";
import PageShell from "@/components/layout/PageShell";
import TailwindVarCheck from "@/components/tools/TailwindVarCheck";
import ToolNote from "@/components/tools/ToolNote";
import ToolJsonLd from "@/components/tools/ToolJsonLd";

// Tailwind v4 CSS 變數寫法檢查（TODO J14，2026-11-25）
export const metadata: Metadata = withShare({
  title: "Tailwind v4 CSS 變數寫法檢查：方括號改小括號（bg-(--x)） · Tailwind v4 — PINGWEI LI",
  description: "升級 Tailwind CSS v4 後顏色、背景突然不見？v3 的方括號變數寫法在 v4 會編譯成無效的 CSS。貼上 class 找出要改的地方，一鍵換成 v4 的小括號寫法。",
  alternates: { canonical: "/tools/tailwind-v4-vars" },
});

export default function TailwindVarsPage() {
  return (
    <PageShell
      backHref="/tools"
      backLabel="返回小工具"
      eyebrow="Tools · Tailwind v4"
      title={<>Tailwind v4 變數寫法檢查</>}
      intro="升級到 Tailwind v4 之後，某些按鈕的背景、文字顏色突然不見了？多半是 v3 的「方括號＋CSS 變數」寫法。貼進來，找出要改的地方。"
    >
      <ToolJsonLd href="/tools/tailwind-v4-vars" />
      <TailwindVarCheck />
      <ToolNote href="/tools/tailwind-v4-vars">
        <p>
          v4 把「方括號裡直接放 CSS 變數」的簡寫拿掉了，改成小括號，例如 <span className="font-mono">bg-(--accent)</span>。
          舊寫法不會報錯，而是編譯成一條無效的 CSS（屬性值變成字面上的 <span className="font-mono">--accent</span>，不是 var()），
          瀏覽器直接忽略——所以只有「剛好因為繼承色矇混過關」的主題看起來正常，另一個主題整個看不見。
        </p>
        <p>
          這個網站 2026 年 7 月就是這樣：全站 116 處，淺色模式下首頁按鈕變透明。修法跟踩到的另一個坑（Tailwind 會把 .md 文件裡的反例也當成 class 編進去）
          記在{" "}
          <Link href="/projects/kbs0830-web" className="text-(--accent) underline underline-offset-4 decoration-(--border) hover:decoration-(--accent)">
            這個網站的作品頁
          </Link>
          。方括號留給真正的字面值（<span className="font-mono">w-[1px]</span>、<span className="font-mono">text-[13px]</span>），這個工具不會動它們。
        </p>
        <p>全部在你的瀏覽器裡比對，貼的內容不會送出去。</p>
      </ToolNote>
    </PageShell>
  );
}
