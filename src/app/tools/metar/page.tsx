import type { Metadata } from "next";
import { withShare } from "@/lib/site/share-meta";
import PageShell from "@/components/layout/PageShell";
import MetarDecoder from "@/components/tools/MetarDecoder";
import ToolNote from "@/components/tools/ToolNote";
import ToolJsonLd from "@/components/tools/ToolJsonLd";

// METAR 翻譯機（2026-11-29）。解碼：lib/tools/metar.ts（純函式、有測試）；最新電報：/api/metar（NOAA 航空氣象中心，伺服器 5 分鐘抓一次）
export const metadata: Metadata = withShare({
  title: "METAR 翻譯機：機場天氣電報白話解讀、VFR／IFR 分類 · METAR Decoder — PINGWEI LI",
  description: "貼上機場的 METAR 天氣電報，逐個欄位翻成白話：風向風速、能見度、雲底高度、氣溫露點、氣壓、天氣現象，還有 VFR／MVFR／IFR／LIFR 分類。在你的瀏覽器裡解碼，不送出去。",
  alternates: { canonical: "/tools/metar" },
});

export default function MetarPage() {
  return (
    <PageShell
      backHref="/tools"
      backLabel="返回小工具"
      eyebrow="Tools · METAR"
      title={<>METAR 翻譯機</>}
      intro="RCKH 281800Z 20004KT 9999 FEW020 23/15 Q1021⋯⋯機場的天氣電報長這樣。貼進來，每個欄位是什麼意思、現在飛機好不好飛，一次看懂。"
    >
      <ToolJsonLd href="/tools/metar" />
      <MetarDecoder />
      <ToolNote href="/tools/metar">
        <p>
          METAR 是機場的例行天氣電報（通常每半小時一次），全世界用同一套寫法：風、能見度、天氣、雲、氣溫露點、氣壓。
          我自己有一台接收飛機訊號的接收器，所以常常想知道「今天風從哪邊來、跑道會往哪邊起降」，就做了這個。
        </p>
        <p>
          解碼完全在你的瀏覽器裡做：純規則比對，不連網、不用 AI，所以結果一定跟電報對得上；看不懂的欄位會原樣標出來，不亂猜。
          飛航天氣分類用常見的標準（能見度 1／3／5 英里、雲幕 500／1,000／3,000 呎）。這只是方便閱讀的翻譯，<strong>不能拿來做飛行決策</strong>。
        </p>
        <p>
          「載入」會請這個網站的伺服器去拿 NOAA 航空氣象中心（aviationweather.gov）的公開資料，5 分鐘內只抓一次，只支援表上的機場；原文拿到之後一樣在你的瀏覽器裡解碼。
        </p>
      </ToolNote>
    </PageShell>
  );
}
