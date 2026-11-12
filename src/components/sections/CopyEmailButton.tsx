"use client";

import { useEffect, useRef, useState } from "react";
import Magnetic from "@/components/ui/Magnetic";
import Underline from "@/components/ui/Underline";
import { MailIcon } from "@/components/ui/icons";

// 點了把 Email 複製到剪貼簿，上方跳「已複製！」1.8 秒
export default function CopyEmailButton({ email, className }: { email: string; className: string }) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      return; // 沒權限（非 https、被瀏覽器擋）：不顯示「已複製」
    }
    setCopied(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="relative">
      <Magnetic>
        <button onClick={copy} className={className}>
          <MailIcon />
          {email}
          <Underline />
        </button>
      </Magnetic>
      <span
        role="status"
        className={`absolute -top-8 left-1/2 -translate-x-1/2 text-xs text-(--accent) bg-(--bg) border border-(--border) px-3 py-1 rounded-sm whitespace-nowrap transition-[opacity,translate,visibility] duration-200 font-mono ${
          copied ? "opacity-100 translate-y-0" : "invisible opacity-0 translate-y-1.5"
        }`}
      >
        已複製！
      </span>
    </div>
  );
}
