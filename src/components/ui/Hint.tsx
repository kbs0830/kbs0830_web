import type { ReactNode } from "react";

// 一句話的說明泡泡（TODO O2，2026-11-26）：給新手看不懂的數字、縮寫用，例如雷達的「在線率」「架次」。
// 原生 Popover API＋CSS Anchor Positioning，零 JS：
//   - 點「?」打開、點旁邊或按 Esc 關（popover="auto" 的 light dismiss），鍵盤 Tab 得到、讀屏會唸 aria-label
//   - 支援 anchor positioning 的瀏覽器：泡泡貼在「?」上方，碰到視窗邊緣自己翻到下方（globals.css .hint-pop）
//   - 不支援的瀏覽器：退回瀏覽器預設的置中彈出，一樣看得到內容
// id 由呼叫端給（同一頁要唯一），Server Component 不能用 useId 以外的方式保證唯一。
export default function Hint({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  const popId = `hint-${id}`;
  return (
    <>
      <button
        type="button"
        popoverTarget={popId}
        aria-label={`說明：${label}`}
        className="hint-trigger relative inline-grid place-items-center size-3.5 ml-1 align-[-1px] rounded-full border border-(--border) text-[9px] leading-none text-(--muted) hover:text-(--accent) hover:border-(--accent) transition-colors cursor-help before:absolute before:-inset-1.5 before:content-['']"
      >
        ?
      </button>
      <span popover="auto" id={popId} className="hint-pop">
        {children}
      </span>
    </>
  );
}
