import type { Metadata } from "next";
import { withShare } from "@/lib/site/share-meta";
import PageShell from "@/components/layout/PageShell";
import PowerCost from "@/components/tools/PowerCost";
import ToolNote from "@/components/tools/ToolNote";

// 2026-11-25（TODO J11）：計算全部在瀏覽器，邏輯在 lib/tools/
export const metadata: Metadata = withShare({
  title: "家裡電腦 24 小時架站一年多少電費？跟 VPS 月租比較 · Power Cost — PINGWEI LI",
  description: "輸入電腦平均耗電（瓦）跟每度電價，算出 24 小時開機一個月、一年的用電度數跟電費，再跟租 VPS 的月租比較，看幾個月回本。",
  alternates: { canonical: "/tools/power-cost" },
});

export default function Page() {
  return (
    <PageShell backHref="/tools" backLabel="返回小工具" eyebrow="Tools · Power" title={<>家裡電腦架站一年多少電費？</>} intro="輸入平均耗電跟電價，算出 24 小時開機一個月、一年要多少電費，跟租 VPS 比划不划算。">
      <PowerCost />
      <ToolNote>
        <p>台電是累進電價、夏月跟非夏月不同，所以電價讓你自己填：拿最近一期帳單的「總金額 ÷ 用電度數」最準。耗電建議用插座電表實際量，閒置跟滿載差很多。</p>
        <p>這個網站就是架在家裡的桌機上（Cloudflare Tunnel），電費以外的成本：要自己顧停電、斷網、硬體壞掉。</p>
      </ToolNote>
    </PageShell>
  );
}
