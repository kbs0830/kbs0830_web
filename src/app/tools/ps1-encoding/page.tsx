import type { Metadata } from "next";
import { withShare } from "@/lib/site/share-meta";
import PageShell from "@/components/layout/PageShell";
import Ps1EncodingCheck from "@/components/tools/Ps1EncodingCheck";
import ToolNote from "@/components/tools/ToolNote";

// PowerShell 中文亂碼檢查（TODO J15，2026-11-25）
export const metadata: Metadata = withShare({
  title: "PowerShell 中文亂碼檢查：.ps1 有沒有 BOM（Windows PowerShell 5.1） · PS1 Encoding — PINGWEI LI",
  description: "Windows PowerShell 5.1 執行有中文的 .ps1 出現亂碼或「字串沒有結束字元」？多半是檔案少了 UTF-8 BOM。拖進 .ps1 檢查編碼，一鍵下載補好 BOM 的版本。檔案不上傳。",
  alternates: { canonical: "/tools/ps1-encoding" },
});

export default function Ps1EncodingPage() {
  return (
    <PageShell
      backHref="/tools"
      backLabel="返回小工具"
      eyebrow="Tools · PS1 Encoding"
      title={<>PowerShell 中文亂碼檢查</>}
      intro="有中文的 .ps1 用 Windows PowerShell 5.1 跑，出現亂碼或莫名其妙的「字串沒有結束字元」？拖進來看是不是少了 BOM。"
    >
      <Ps1EncodingCheck />
      <ToolNote>
        <p>
          Windows 內建的 PowerShell 5.1（powershell.exe）讀沒有 BOM 的檔案時，不會猜 UTF-8，而是用系統語系——繁體中文 Windows 就是 Big5。
          UTF-8 的中文一個字 3 個 byte，被當成 Big5 讀會拆錯位，引號跟著被吃掉，於是出現「字串沒有結束字元」這種跟程式邏輯無關的錯誤，而且每次錯的地方還不一樣。
        </p>
        <p>
          修法是存成「UTF-8 with BOM」：檔案最前面多 3 個 byte（EF BB BF），PowerShell 5.1 看到就知道是 UTF-8。PowerShell 7（pwsh）預設就是 UTF-8，沒有這個問題，
          但很多排程工作、舊伺服器還是用 5.1 跑。這個網站自己的監控腳本就踩過一次。
        </p>
        <p>補 BOM 不會改動任何一個字，只是在最前面加 3 個 byte。檔案只在你的瀏覽器裡讀，不會上傳。</p>
      </ToolNote>
    </PageShell>
  );
}
