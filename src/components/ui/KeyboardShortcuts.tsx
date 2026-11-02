"use client";

import { useEffect, useState } from "react";
import { isTyping } from "@/lib/isTyping";
import Modal from "@/components/ui/Modal";

const sectionKeys: Record<string, string> = {
  "1": "about",
  "2": "portfolio",
  "3": "contact",
};

const shortcuts = [
  { key: "1 / 2 / 3", desc: "跳轉至 自己紹介 / 製作物 / 連絡先" },
  { key: "G", desc: "開啟 GitHub" },
  { key: "E", desc: "寄一封信" },
  { key: "`", desc: "呼出終端機模式" },
  { key: "?", desc: "顯示 / 隱藏這個提示" },
];

export default function KeyboardShortcuts() {
  const [showHelp, setShowHelp] = useState(false);

  // Esc 關閉由 <dialog> 原生處理
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping()) return;

      const key = e.key.toLowerCase();
      if (key === "?") setShowHelp((v) => !v);
      else if (key === "g") window.open("https://github.com/kbs0830", "_blank", "noopener,noreferrer");
      else if (key === "e") window.location.href = "mailto:1394kbs@gmail.com";
      else if (sectionKeys[key]) document.getElementById(sectionKeys[key])?.scrollIntoView({ behavior: "smooth" });
    };
    window.addEventListener("keydown", onKeyDown);
    // 給 E2E 用的「已經可以互動」標記（e2e/helpers.ts gotoReady）：同一次 commit 的
    // passive effects 會一起跑，這裡執行時 TerminalMode/KonamiEgg 的鍵盤監聽也都掛好了。
    // 測試如果 goto 完馬上按鍵，按鍵可能比 hydration 早到、直接被丟掉。
    document.documentElement.dataset.hydrated = "";
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <Modal open={showHelp} onClose={() => setShowHelp(false)} label="鍵盤快捷鍵" className="w-[calc(100%-3rem)] max-w-sm">
      <div className="p-6 border border-(--border) rounded-sm bg-(--surface)">
        <p className="text-xs tracking-[0.25em] text-(--accent) uppercase mb-5 font-mono">
          Keyboard Shortcuts
        </p>
        <div className="space-y-3">
          {shortcuts.map((s) => (
            <div key={s.key} className="flex items-center gap-4">
              <kbd className="shrink-0 min-w-[2.5rem] text-center px-2 py-1 text-[11px] text-(--accent) border border-(--accent-lt) bg-(--accent-lt) rounded-sm font-mono">
                {s.key}
              </kbd>
              <span className="text-sm font-light text-(--muted)">{s.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
