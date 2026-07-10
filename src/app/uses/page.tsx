import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "/uses — PINGWEI LI",
  description: "開発環境・硬體・軟體工具清單",
  alternates: { canonical: "/uses" },
};

const groups = [
  {
    title: "硬體 · Hardware",
    items: [
      { name: "Desktop", detail: "i7-12700 + RTX 3070（部署主機，跑 Next.js / YOLOv8 推論）" },
      { name: "Laptop", detail: "Zenbook A14 ARM（日常開發）" },
    ],
  },
  {
    title: "編輯器 · Editor",
    items: [
      { name: "VSCode", detail: "主要編輯器" },
      { name: "Claude Code", detail: "AI 輔助開發" },
    ],
  },
  {
    title: "開發工具 · Dev Tools",
    items: [
      { name: "Git / GitHub", detail: "版本控制" },
      { name: "pnpm", detail: "套件管理" },
      { name: "Windows 11", detail: "作業系統" },
      { name: "Cloudflare Tunnel", detail: "本機部署對外服務" },
      { name: "GitHub Actions (self-hosted)", detail: "CI/CD，push 到 main 自動部署" },
    ],
  },
  {
    title: "技術棧 · Stack",
    items: [
      { name: "Next.js 16 + TypeScript", detail: "本網站" },
      { name: "FastAPI / Flask", detail: "後端 API" },
      { name: "YOLOv8 / ONNX Runtime / Gemini API", detail: "AI 推論" },
      { name: "Tailwind CSS v4 + Framer Motion", detail: "樣式與動畫" },
    ],
  },
];

export default function UsesPage() {
  return (
    <div className="min-h-screen bg-(--bg) px-6 py-20">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="text-xs tracking-[0.2em] text-(--muted) hover:text-(--accent) transition-colors"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          ← 返回首頁
        </Link>

        <p
          className="text-xs tracking-[0.35em] text-(--muted) uppercase mt-10 mb-4"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Uses
        </p>
        <h1
          className="text-3xl sm:text-4xl font-light text-(--text) mb-4"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          開発環境 &nbsp;·&nbsp; 我用的工具
        </h1>
        <p className="text-sm font-light text-(--muted) mb-14 leading-relaxed">
          硬體、軟體與日常開發用的工具清單。
        </p>

        <div className="space-y-10">
          {groups.map((group) => (
            <div key={group.title}>
              <p
                className="text-xs tracking-[0.2em] text-(--accent) uppercase mb-4"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {group.title}
              </p>
              <ul className="space-y-2.5">
                {group.items.map((item) => (
                  <li key={item.name} className="flex items-start gap-3 text-sm font-light">
                    <span className="text-(--accent) mt-0.5">▸</span>
                    <span>
                      <span className="text-(--text)">{item.name}</span>
                      <span className="text-(--muted)"> — {item.detail}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
