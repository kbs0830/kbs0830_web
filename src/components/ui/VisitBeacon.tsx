"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { setFavicon } from "@/components/ui/StatusFavicon";

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

export default function VisitBeacon() {
  const pathname = usePathname();
  useEffect(() => {
    const newSession = flag(() => sessionStorage, "kbs-session");
    const newVisitor = newSession ? flag(() => localStorage, "kbs-visited") : false;
    const body = JSON.stringify({ path: location.pathname, ref: newSession ? document.referrer : "", newSession, newVisitor });
    fetch("/api/visitor-stats", { method: "POST", keepalive: true, body })
      .then((r) => r.json())
      .then((d: { newFeature?: { until: string } | null }) => {
        // 新功能上線 12 小時內：分頁圖示換成櫻花粉視窗（deploy.ps1 寫 data/feature-release.json）
        if (d.newFeature && Date.parse(d.newFeature.until) > Date.now()) setFavicon("new");
      })
      .catch(() => {});
  }, [pathname]);
  return null;
}
