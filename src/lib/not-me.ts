// 「這個瀏覽器不計入統計」（2026-11-23，使用者：「排除自己的開關」）：
// 站長自己的瀏覽混在真人訪客裡（11/21～23 幾乎全是自己），在 /stats 最下面的開關打開後，
// localStorage 記一個旗標；VisitBeacon 照樣回報（要拿新功能指示燈），但帶 notMe，伺服器就不計入。
// 只影響這一台、這一個瀏覽器（無痕視窗、別的瀏覽器、手機要各自開一次）。不影響「いま N 人」跟 Web Vitals。
export const NOT_ME_KEY = "kbs-not-me";
export const NOT_ME_EVENT = "kbs-not-me-change";

export function isNotMe(): boolean {
  try {
    return localStorage.getItem(NOT_ME_KEY) === "1";
  } catch {
    return false;
  }
}

export function setNotMe(on: boolean) {
  try {
    if (on) localStorage.setItem(NOT_ME_KEY, "1");
    else localStorage.removeItem(NOT_ME_KEY);
  } catch {
    // 存不了（無痕、被擋）就算了
  }
  window.dispatchEvent(new Event(NOT_ME_EVENT));
}
