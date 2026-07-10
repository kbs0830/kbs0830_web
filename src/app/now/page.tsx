import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "/now — PINGWEI LI",
  description: "現在在做什麼、在學什麼",
};

const now = [
  "就讀國立高科大 智慧商務系 二年級（燕巢）",
  "持續建構這個個人網站，累積 side project",
  "學習 React Three Fiber 進階、WebGL Shader",
  "研究本地端 ML 推理（edge AI）與 Electron 打包部署",
  "日本語 N5 学習中",
  "維護 FoodLens Advisor 與購票系統兩個個人専案",
];

export default function NowPage() {
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
          Now
        </p>
        <h1
          className="text-3xl sm:text-4xl font-light text-(--text) mb-4"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          現在 &nbsp;·&nbsp; What I&apos;m doing
        </h1>
        <p className="text-sm font-light text-(--muted) mb-14 leading-relaxed">
          這個頁面記錄我當下的狀態，會不定期更新。
          <br />
          靈感來自{" "}
          <a
            href="https://nownownow.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-(--accent) hover:opacity-70 transition-opacity"
          >
            nownownow.com
          </a>{" "}
          的傳統。
        </p>

        <ul className="space-y-4">
          {now.map((line) => (
            <li key={line} className="flex items-start gap-3 text-sm font-light">
              <span className="text-(--accent) mt-0.5">▸</span>
              <span className="text-(--text)">{line}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
