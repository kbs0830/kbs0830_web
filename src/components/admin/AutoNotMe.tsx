"use client";

import { useEffect } from "react";
import { isNotMe, setNotMe } from "@/lib/client/not-me";

// 打開後台的瀏覽器＝站長自己的裝置，自動標成「不計入真人訪客」（2026-11-28，使用者：「判斷還要手動，我就手機跟桌機最常進去」）。
// 伺服器拿不到裝置的 MAC，所以用「進過後台」當辨認：手機、桌機各開一次後台就永久生效（localStorage `kbs-not-me`）。
// 只在 AdminShell 裡（通過門禁的真後台）才會放這個元件，訪客參觀的 /demo/admin 不會。
// 每個分頁只自動開一次（sessionStorage）：在 /admin/traffic 手動關掉之後，同一個分頁換後台頁不會又被打開。
const DONE = "kbs-not-me-auto";

export default function AutoNotMe() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem(DONE)) return;
      sessionStorage.setItem(DONE, "1");
    } catch {
      // sessionStorage 不能用：就每次都檢查，反正只是確保旗標存在
    }
    if (!isNotMe()) setNotMe(true);
  }, []);
  return null;
}
