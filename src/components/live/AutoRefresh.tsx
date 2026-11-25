"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// 每隔一段時間重新跟伺服器要一次頁面資料（router.refresh：只更新 Server Component 的內容，不整頁重載、捲動位置不動）。
// 分頁在背景時不刷，切回來時如果已經超過間隔就馬上刷一次。/airports 用。
export default function AutoRefresh({ everyMs }: { everyMs: number }) {
  const router = useRouter();
  useEffect(() => {
    let last = Date.now();
    const tick = () => {
      if (document.hidden || Date.now() - last < everyMs) return;
      last = Date.now();
      router.refresh();
    };
    const id = setInterval(tick, 15_000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [router, everyMs]);
  return null;
}
