"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { projects } from "@/lib/projects";
import { isTyping } from "@/lib/isTyping";

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

function runCommand(raw: string): string {
  const cmd = raw.trim();
  if (cmd === "") return "";
  if (cmd === "help") return HELP_TEXT;
  if (cmd === "ls projects" || cmd === "ls") {
    return projects.map((p) => `${p.slug.padEnd(24)} ${p.status}`).join("\n");
  }
  if (cmd === "cat about.txt") return ABOUT_TXT;
  if (cmd.startsWith("ssh")) {
    return "connecting to kbs0830@kbs0830.com...\n→ 1394kbs@gmail.com ・ github.com/kbs0830";
  }
  if (cmd === "clear") return "__CLEAR__";
  if (cmd === "exit") return "__EXIT__";
  return `command not found: ${cmd}（輸入 help 查看指令）`;
}

export default function TerminalMode() {
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<string[]>(["kbs0830 terminal — 輸入 help 開始"]);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "`") {
        if (!open && isTyping()) return;
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const output = runCommand(input);
    if (output === "__CLEAR__") {
      setLines([]);
    } else if (output === "__EXIT__") {
      setOpen(false);
    } else {
      setLines((prev) => [...prev, `$ ${input}`, ...(output ? [output] : [])]);
    }
    setInput("");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            className="absolute inset-0"
            style={{ backgroundColor: "var(--bg)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.85 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setOpen(false)}
          />
          <motion.div
            className="relative w-full sm:max-w-xl sm:rounded-sm border border-(--border) bg-(--surface)"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="px-4 py-2 border-b border-(--border) flex items-center justify-between">
              <p className="text-xs text-(--muted)" style={{ fontFamily: "var(--font-mono)" }}>
                kbs0830@terminal ~ %
              </p>
              <button
                onClick={() => setOpen(false)}
                className="text-(--muted) hover:text-(--accent) text-xs transition-colors"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                esc
              </button>
            </div>
            <div
              ref={scrollRef}
              className="p-4 h-64 sm:h-72 overflow-y-auto text-xs whitespace-pre-wrap leading-relaxed"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {lines.map((l, i) => (
                <div key={i} className="text-(--muted) mb-1">
                  {l}
                </div>
              ))}
            </div>
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2 px-4 py-3 border-t border-(--border)"
            >
              <span className="text-(--accent) text-xs" style={{ fontFamily: "var(--font-mono)" }}>
                $
              </span>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-transparent outline-none text-xs text-(--text)"
                style={{ fontFamily: "var(--font-mono)" }}
                autoComplete="off"
                spellCheck={false}
                aria-label="終端機指令輸入"
              />
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
