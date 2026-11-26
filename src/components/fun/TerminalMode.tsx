"use client";

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type SubmitEvent } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { isTyping } from "@/lib/client/is-typing";
import { EMAIL, GITHUB_URL } from "@/lib/site/site";
import Modal from "@/components/ui/Modal";

// 首頁的終端機彩蛋（` 鍵開關）。2026-11-26 B2 加：neofetch、uptime、status、blog、open、history、hero，
// Tab 自動補完、↑↓ 叫回之前的指令。即時數字（執行時間、記憶體、可用率）打 /api/terminal，只回 /colophon 已公開的東西。

const HELP_TEXT = [
  "help                          查看可用指令",
  "ls projects                   列出所有作品",
  "cat about.txt                 關於我",
  "blog                          最新文章",
  "open <路徑>                    打開頁面（例：open /blog）",
  "neofetch                      這台伺服器的規格",
  "uptime                        網站跑了多久",
  "status                        網站狀態（可用率、上次部署、雷達）",
  "hero <webgpu|gl|name|routes|icon|cities|stars>  首頁背景",
  "history                       打過的指令",
  "ssh kbs0830@kbs0830.com       連絡方式",
  "clear                         清除畫面",
  "exit                          離開終端機",
  "",
  "Tab 自動補完 · ↑↓ 叫回之前的指令",
].join("\n");

const ABOUT_TXT = [
  "PINGWEI LI",
  "高雄 🇹🇼 ↔ 福岡 🇯🇵",
  "AI 工程師 · 網頁開發者",
  "日本語 N5 学習中",
  "國立高雄科技大學 智慧商務系 三年級 · 20 歲",
].join("\n");

const HERO_SHAPES = ["stars", "name", "routes", "icon", "cities"] as const;

/** Tab 補完的候選（完整指令） */
const COMPLETIONS = [
  "help", "ls projects", "cat about.txt", "blog", "open /blog", "open /status", "open /colophon", "open /uses", "open /now",
  "neofetch", "uptime", "status", "history", "ssh kbs0830@kbs0830.com", "clear", "exit",
  "hero webgpu", "hero gl", ...HERO_SHAPES.map((s) => `hero ${s}`),
];

type Facts = {
  uptimeSec: number;
  memoryMB: number;
  node: string;
  uptime30: number | null;
  lastDeploy: string | null;
  deploys90: number;
  rollbacks90: number;
  radar: { online: boolean; aircraftNow: number } | null;
};

type Result =
  | { type: "print"; text: string }
  | { type: "clear" }
  | { type: "exit" }
  | { type: "async"; run: () => Promise<string> }
  | { type: "open"; path: string; text: string };

function span(sec: number) {
  const d = Math.floor(sec / 86400), h = Math.floor((sec % 86400) / 3600), m = Math.floor((sec % 3600) / 60);
  return d > 0 ? `${d} 天 ${h} 小時` : h > 0 ? `${h} 小時 ${m} 分` : `${m} 分`;
}

const twTime = (iso: string) => new Date(new Date(iso).getTime() + 8 * 3600_000).toISOString().slice(5, 16).replace("T", " ");

async function facts(): Promise<Facts> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 6000);
  try {
    const r = await fetch("/api/terminal", { signal: ac.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return (await r.json()) as Facts;
  } finally {
    clearTimeout(timer);
  }
}

const fail = (e: unknown) => `連不上伺服器（${e instanceof Error ? e.message : "?"}）`;

async function neofetch() {
  try {
    const f = await facts();
    const art = ["    /\\    ", "   /  \\   ", "  / /\\ \\  ", " /_/  \\_\\ ", "          ", "          ", "          ", "          "];
    const info = [
      "kbs0830@kbs0830.com",
      "-------------------",
      "Host:    自家桌機（Windows 11）",
      "CPU:     Intel Core i7-12700",
      "GPU:     NVIDIA GeForce RTX 3070",
      `Runtime: Node ${f.node} · Next.js 16`,
      `Uptime:  ${span(f.uptimeSec)}`,
      `Memory:  ${f.memoryMB} MB（網站這個 process）`,
      "Network: Cloudflare Tunnel",
    ];
    return info.map((l, i) => `${art[i] ?? "          "}${l}`).join("\n");
  } catch (e) {
    return fail(e);
  }
}

async function uptime() {
  try {
    const f = await facts();
    return `up ${span(f.uptimeSec)} · memory ${f.memoryMB} MB · node ${f.node}`;
  } catch (e) {
    return fail(e);
  }
}

async function status() {
  try {
    const f = await facts();
    return [
      "網站        ● online",
      `近 30 天     ${f.uptime30 === null ? "可用率累積中" : `可用 ${(f.uptime30 * 100).toFixed(2)}%`}`,
      `上次部署    ${f.lastDeploy ? twTime(f.lastDeploy) : "—"}（90 天 ${f.deploys90} 次、退回 ${f.rollbacks90} 次）`,
      `自家雷達    ${f.radar ? (f.radar.online ? `在線 · 現在 ${f.radar.aircraftNow} 架` : "離線") : "—"}`,
      "詳細：open /status",
    ].join("\n");
  } catch (e) {
    return fail(e);
  }
}

/** hero 形狀：丟事件給 WebGPU 版（HeroSceneGPU 有聽就會把 handled 設成 true） */
function heroShape(shape: string): string {
  const detail = { shape, handled: false };
  window.dispatchEvent(new CustomEvent("kbs:hero-shape", { detail }));
  return detail.handled
    ? `首頁背景 → ${shape}（10 秒後自己回星空）`
    : "這個要 WebGPU 版的首頁背景：輸入 hero webgpu（要有支援 WebGPU 的顯卡跟瀏覽器）";
}

function runCommand(raw: string, ctx: { projectListing: string; blogListing: string; history: string[] }): Result {
  const cmd = raw.trim().replace(/\s+/g, " ");
  const print = (text: string): Result => ({ type: "print", text });
  if (cmd === "") return print("");
  if (cmd === "help") return print(HELP_TEXT);
  if (cmd === "ls projects" || cmd === "ls") return print(ctx.projectListing);
  if (cmd === "cat about.txt") return print(ABOUT_TXT);
  if (cmd === "blog" || cmd === "ls blog") return print(`${ctx.blogListing}\n\n打開文章：open /blog/<slug>`);
  if (cmd === "neofetch") return { type: "async", run: neofetch };
  if (cmd === "uptime") return { type: "async", run: uptime };
  if (cmd === "status") return { type: "async", run: status };
  if (cmd === "history") {
    return print(ctx.history.length ? ctx.history.map((h, i) => `${String(i + 1).padStart(4)}  ${h}`).join("\n") : "（還沒有打過指令）");
  }
  if (cmd === "open" || cmd === "cd") return print("用法：open /blog、open /status、open /blog/<slug>");
  if (cmd.startsWith("open ") || cmd.startsWith("cd ")) {
    const path = cmd.split(" ")[1];
    // 只開站內路徑（/ 開頭、不能是 //別的網站）
    if (!/^\/(?!\/)[\w\-./]*$/.test(path)) return print(`只能打開站內頁面，例如 open /blog`);
    return { type: "open", path, text: `→ ${path}` };
  }
  if (cmd === "hero") return print("用法：hero webgpu（換 WebGPU 粒子版）、hero gl（換回線條版）、hero name|routes|icon|cities|stars（WebGPU 版排形狀）");
  if (cmd === "hero webgpu") return { type: "open", path: "/?hero=webgpu", text: "→ 換成 WebGPU 粒子版（電腦要支援 WebGPU）" };
  if (cmd === "hero gl" || cmd === "hero webgl") return { type: "open", path: "/?hero=webgl", text: "→ 換回線條版" };
  if (cmd.startsWith("hero ")) {
    const shape = cmd.slice(5);
    if ((HERO_SHAPES as readonly string[]).includes(shape)) return print(heroShape(shape));
    return print(`沒有這個形狀：${shape}（可以用 ${HERO_SHAPES.join("、")}）`);
  }
  if (cmd.startsWith("ssh")) {
    return print(`connecting to kbs0830@kbs0830.com...\n→ ${EMAIL} ・ ${GITHUB_URL.replace("https://", "")}`);
  }
  if (cmd === "clear") return { type: "clear" };
  if (cmd === "exit") return { type: "exit" };
  return print(`command not found: ${cmd}（輸入 help 查看指令）`);
}

/** 多個候選的共同開頭（Tab 補到這裡為止，像 bash） */
function commonPrefix(list: string[]) {
  let p = list[0] ?? "";
  for (const s of list) while (!s.startsWith(p)) p = p.slice(0, -1);
  return p;
}

// projectListing、blogListing 由 page.tsx（server）先排好傳進來，這個 client 元件不用 import 整份 projects.ts／文章
export default function TerminalMode({ projectListing, blogListing }: { projectListing: string; blogListing: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<string[]>(["kbs0830 terminal — 輸入 help 開始"]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const historyPos = useRef<number | null>(null);
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

  const append = (...more: string[]) => setLines((prev) => [...prev, ...more]);

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const typed = input;
    const result = runCommand(typed, { projectListing, blogListing, history });
    if (typed.trim()) setHistory((h) => (h.at(-1) === typed.trim() ? h : [...h, typed.trim()].slice(-50)));
    historyPos.current = null;
    setInput("");
    if (result.type === "clear") return setLines([]);
    if (result.type === "exit") return setOpen(false);
    if (result.type === "open") {
      append(`$ ${typed}`, result.text);
      setOpen(false);
      router.push(result.path as Route);
      return;
    }
    if (result.type === "async") {
      append(`$ ${typed}`);
      void result.run().then((text) => append(text));
      return;
    }
    append(`$ ${typed}`, ...(result.text ? [result.text] : []));
  };

  const onInputKey = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const typed = input.replace(/^\s+/, "");
      if (!typed) return;
      const matches = COMPLETIONS.filter((c) => c.startsWith(typed));
      if (matches.length === 1) setInput(matches[0]);
      else if (matches.length > 1) {
        const prefix = commonPrefix(matches);
        if (prefix.length > typed.length) setInput(prefix);
        else append(`$ ${typed}`, matches.join("   "));
      }
      return;
    }
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      if (history.length === 0) return;
      e.preventDefault();
      const cur = historyPos.current ?? history.length;
      const next = e.key === "ArrowUp" ? Math.max(0, cur - 1) : Math.min(history.length, cur + 1);
      historyPos.current = next;
      setInput(next === history.length ? "" : history[next]);
    }
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
            onKeyDown={onInputKey}
            className="flex-1 bg-transparent outline-none text-xs text-(--text) font-mono"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="send"
            aria-label="終端機指令輸入"
          />
        </form>
      </div>
    </Modal>
  );
}
