"use client";

import { useEffect, useRef, type ReactNode } from "react";

// 原生 <dialog> + showModal()：focus 鎖在對話框內、Esc 關閉、背景遮罩（::backdrop）
// 都由瀏覽器處理，取代原本 framer AnimatePresence + 手刻遮罩/Escape 監聽。
// 進出場動畫在 globals.css 的 dialog.modal（@starting-style + allow-discrete）。
export default function Modal({
  open,
  onClose,
  label,
  className = "",
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      className={`modal ${className}`}
      onClose={onClose}
      // dialog 本身沒有 padding，點到 dialog 元素本身 = 點到外面的遮罩
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {children}
    </dialog>
  );
}
