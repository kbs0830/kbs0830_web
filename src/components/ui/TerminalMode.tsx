"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { isTyping } from "@/lib/isTyping";
import Modal from "@/components/ui/Modal";

const HELP_TEXT = [
  "help                          查看可用指令",
  "ls projects                   列出所有作品",
  "cat about.txt                 關於我",
  "ssh kbs0830@kbs0830.com       連絡方式",
  "clear                         清除畫面",
  "exit                          離開終端機",
].join("\n");

const ABOUT_TXT = [
  "PINGWEI LI",
  "高雄 🇹🇼 ↔ 福岡 🇯🇵",
  "AI 工程師 · 網頁開發者",
  "日本語 N5 学習中",
  "國立高雄科技大學 智慧商務系 二年級",
].join("\n");

type Result = { type: "print"; text: string } | { type: "clear" } | { type: "exit" };

function runCommand(raw: string, projectListing: string): Result {
  const cmd = raw.trim();
  const print = (text: string): Result => ({ type: "print", text });
  if (cmd === "") return print("");
  if (cmd === "help") return print(HELP_TEXT);
  if (cmd === "ls projects" || cmd === "ls") {
    return print(projectListing);
  }
  if (cmd === "cat about.txt") return print(ABOUT_TXT);
  if (cmd.startsWith("ssh")) {
    return print("connecting to kbs0830@kbs0830.com...\n→ 1394kbs@gmail.com ・ github.com/kbs0830");
  }
  if (cmd === "clear") return { type: "clear" };
  if (cmd === "exit") return { type: "exit" };
  return print(`command not found: ${cmd}（輸入 help 查看指令）`);
}

// projectListing 由 page.tsx（server）先排好傳進來，這個 client 元件不用 import 整份 projects.ts
export default function TerminalMode({ projectListing }: { projectListing: string }) {
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<string[]>(["kbs0830 terminal — 輸入 help 開始"]);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Esc 由 <dialog> 原生處理，這裡只管 ` 開關
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "`" || (!open && isTyping())) return;
      e.preventDefault();
      setOpen((v) => !v);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // showModal() 會 focus 第一個可聚焦元素（右上角的 esc 按鈕），改成直接 focus 輸入框
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const result = runCommand(input, projectListing);
    if (result.type === "clear") setLines([]);
    else if (result.type === "exit") setOpen(false);
    else setLines((prev) => [...prev, `$ ${input}`, ...(result.text ? [result.text] : [])]);
    setInput("");
  };

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      label="終端機模式"
      className="w-full sm:max-w-xl mb-0 sm:mb-auto"
    >
      <div className="border border-(--border) sm:rounded-sm bg-(--surface)">
        <div className="px-4 py-2 border-b border-(--border) flex items-center justify-between">
          <p className="text-xs text-(--muted) font-mono">
            kbs0830@terminal ~ %
          </p>
          <button
            onClick={() => setOpen(false)}
            className="text-(--muted) hover:text-(--accent) text-xs transition-colors font-mono"
          >
            esc
          </button>
        </div>
        <div
          ref={scrollRef}
          data-testid="terminal-output"
          className="p-4 h-64 sm:h-72 overflow-y-auto text-xs whitespace-pre-wrap leading-relaxed font-mono"
        >
          {lines.map((l, i) => (
            <div key={i} className="text-(--muted) mb-1">
              {l}
            </div>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 py-3 border-t border-(--border)">
          <span className="text-(--accent) text-xs font-mono">
            $
          </span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-transparent outline-none text-xs text-(--text) font-mono"
            autoComplete="off"
            spellCheck={false}
            aria-label="終端機指令輸入"
          />
        </form>
      </div>
    </Modal>
  );
}
