"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

// 真人造訪計數（TODO「造訪數改成每一頁都算」，2026-11-09）。之前只有首頁頁尾的 VisitorStats 會回報，
// 直接打開文章、作品頁的訪客都沒算到。掛在 layout，每換一頁（含站內 client 換頁）回報一次。
// 只有真的執行 JS 的瀏覽器才會送；伺服器端再擋沒 cf-ipcountry（測試、本機）跟機器人 UA（見 /api/visitor-stats）。
// 首頁頁尾的 VisitorStats 改成只讀（GET），不然首頁會算兩次。
export default function VisitBeacon() {
  const pathname = usePathname();
  useEffect(() => {
    fetch("/api/visitor-stats", { method: "POST", keepalive: true }).catch(() => {});
  }, [pathname]);
  return null;
}
