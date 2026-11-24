"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { setFavicon } from "@/components/ui/StatusFavicon";
import { isNotMe } from "@/lib/not-me";

// 真人造訪計數（TODO「造訪數改成每一頁都算」，2026-11-09）。掛在 layout，每換一頁（含站內 client 換頁）回報一次。
// 只有真的執行 JS 的瀏覽器才會送；伺服器端再擋沒 cf-ipcountry（測試、本機）跟機器人 UA（見 /api/visitor-stats）。
// 首頁頁尾的 VisitorStats 只讀（GET），不然首頁會算兩次。
//
// 訪客分析（2026-11-09）多帶幾個欄位，伺服器只存彙總（lib/visit-detail.ts）：
//   - path：這一頁的路徑
//   - ref：從哪個網站點進來（只在工作階段第一頁帶；伺服器只留網域）
//   - newSession：這個分頁這次是不是第一頁（sessionStorage，關掉分頁就清）
//   - newVisitor：這個瀏覽器有沒有來過（localStorage 記一個「來過」，不是 ID、不會送出去）
// 讀不到 storage（無痕、被擋）就當成新的，不影響計數。
function flag(storage: () => Storage, key: string): boolean {
  try {
    const s = storage();
    if (s.getItem(key)) return false;
    s.setItem(key, "1");
    return true;
  } catch {
    return true;
  }
}

/** 發文標記（TODO I9）：網址的 ?ref=reddit-selfhosted → "ref:reddit-selfhosted"。
 *  很多 App 內建瀏覽器不送 Referer，沒有這個就分不出是哪個管道帶來的。讀完就從網址拿掉，
 *  訪客再分享出去的連結不會一直帶著同一個標記。不用 cookie、不存任何東西 */
function campaignRef(): string | null {
  const url = new URL(location.href);
  const tag = url.searchParams.get("ref")?.toLowerCase() ?? "";
  if (!url.searchParams.has("ref")) return null;
  url.searchParams.delete("ref");
  history.replaceState(history.state, "", url.pathname + url.search + url.hash);
  return /^[a-z0-9-]{1,40}$/.test(tag) ? `ref:${tag}` : null;
}

export default function VisitBeacon() {
  const pathname = usePathname();
  useEffect(() => {
    // 站長在 /stats 打開「不計入」：照樣送（要拿 newFeature），但只帶 notMe，伺服器不計（lib/not-me.ts）
    const body = isNotMe()
      ? JSON.stringify({ notMe: true })
      : (() => {
          const newSession = flag(() => sessionStorage, "kbs-session");
          const newVisitor = newSession ? flag(() => localStorage, "kbs-visited") : false;
          return JSON.stringify({ path: location.pathname, ref: newSession ? (campaignRef() ?? document.referrer) : "", newSession, newVisitor });
        })();
    // 不 abort：keepalive 就是要換頁後也送得出去
    (async () => {
      try {
        const res = await fetch("/api/visitor-stats", { method: "POST", keepalive: true, body });
        const d: { newFeature?: { until: string } | null } = await res.json();
        // 新功能上線 12 小時內：分頁圖示右上角指示燈亮櫻花粉（deploy.ps1 寫 data/feature-release.json）
        if (d.newFeature && Date.parse(d.newFeature.until) > Date.now()) setFavicon("new");
      } catch {
        // 回報失敗不影響頁面
      }
    })();
  }, [pathname]);
  return null;
}
