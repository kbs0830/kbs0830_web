import type { Metadata } from "next";
import { withShare } from "@/lib/site/share-meta";
import PageShell from "@/components/layout/PageShell";
import KanjiJp from "@/components/tools/KanjiJp";
import ToolNote from "@/components/tools/ToolNote";

// 2026-11-25（TODO J7）：計算全部在瀏覽器，邏輯在 lib/tools/
export const metadata: Metadata = withShare({
  title: "繁體字轉日文漢字對照：學→学、發→発、國→国 · 日本新字体 — PINGWEI LI",
  description: "輸入繁體中文，標出日文寫法不一樣的漢字（學→学、發→発、鐵→鉄、說→説），台灣人學日文、寫日文時對照用。收錄 200 多組常用字。",
  alternates: { canonical: "/tools/kanji-jp" },
});

export default function Page() {
  return (
    <PageShell backHref="/tools" backLabel="返回小工具" eyebrow="Tools · Kanji" title={<>繁體字 → 日文漢字</>} intro="輸入繁體中文，標出日文（新字体）寫法不一樣的字。台灣人學日文最容易寫錯的就是這些。">
      <KanjiJp />
      <ToolNote>
        <p>只收台灣繁體跟日本常用漢字寫法不同的字（200 多組）。一個字在日文有好幾種對應、要看意思的（例如「著／着」「預／予」）不收，避免換錯。</p>
        <p>這是字形對照，不是翻譯：「車站」換完還是「車站」，日文會說「駅」。</p>
      </ToolNote>
    </PageShell>
  );
}
