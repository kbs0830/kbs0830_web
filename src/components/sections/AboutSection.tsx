"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";

const skills = [
  {
    category: "AI · 機器学習",
    categoryEn: "AI / ML",
    items: [
      "Python", "YOLOv8", "ONNX Runtime Web",
      "TensorFlow.js", "Gemini API", "Ultralytics",
      "Pydantic v2", "Jetson Nano", "Raspberry Pi", "OpenCV",
    ],
  },
  {
    category: "後端 · バックエンド",
    categoryEn: "Backend",
    items: [
      "FastAPI", "Flask", "Blueprint 路由",
      "REST API 設計", "Google Sheets API",
      "環境変数管理", "Render 部署",
    ],
  },
  {
    category: "前端 · フロントエンド",
    categoryEn: "Frontend",
    items: [
      "Next.js 16", "React 19", "TypeScript",
      "Tailwind CSS v4", "Framer Motion", "Three.js",
      "React Three Fiber", "Vanilla JS (ES6)",
    ],
  },
  {
    category: "工具 · 開発環境",
    categoryEn: "Tools & Environment",
    items: [
      "VSCode", "pnpm", "Git", "Windows 11",
      "Arduino", "Gunicorn", "LINE Pay API",
      "丙級電腦硬體裝修",
    ],
  },
  {
    category: "学習中 · 探索領域",
    categoryEn: "Currently Learning",
    items: [
      "WebGL Shader", "React Three Fiber 進階",
      "Electron 打包部署", "エッジ AI 推論",
      "システム設計", "日本語 N5",
    ],
  },
];

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

export default function AboutSection() {
  return (
    <section id="about" className="py-20 md:py-32 bg-[--surface]">
      <div className="max-w-5xl mx-auto px-6">
        <FadeIn>
          <p
            className="text-xs tracking-[0.35em] text-[--muted] uppercase mb-4"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            About
          </p>
          <h2
            className="text-3xl sm:text-4xl font-light text-[--text] mb-10 md:mb-16"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            自己紹介 &nbsp;·&nbsp; 關於我
          </h2>
        </FadeIn>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 mb-12 md:mb-20">
          <FadeIn delay={0.1}>
            <div className="space-y-5 font-light leading-relaxed text-[15px]">
              <div className="mb-6">
                <Image
                  src="/image/大頭貼.jpg"
                  alt="PINGWEI LI"
                  width={108}
                  height={108}
                  className="rounded-sm object-cover object-top grayscale-[15%]"
                  priority
                />
              </div>
              <p className="text-[--text]">
                在<span className="text-[--accent]">台灣高雄</span>與<span className="text-[--accent]">日本福岡</span>之間生活——
                兩座城市的節奏與細節，深深影響了我對軟體設計的思考方式。
              </p>
              <p className="text-[--muted]">
                我的工作落在 AI 與網頁的交叉點：讓模型做它該做的事，
                讓介面不妨礙使用者，讓程式碼能被下一個人讀懂。
              </p>
              <p className="text-[--muted]">
                目前仍在學習中，持續建構 side project，
                探索本地端 ML 推理與精緻 UI 之間的可能性。
              </p>
              <div className="pt-2 border-t border-[--border]">
                <p className="text-[--muted] text-sm">
                  I'm a developer based between Kaohsiung and Fukuoka, exploring the
                  intersection of AI inference, web interfaces, and thoughtful system design.
                </p>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.15}>
            <div
              className="p-6 border border-[--border] rounded-sm bg-[--bg] space-y-4"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              <p className="text-xs tracking-[0.25em] text-[--accent] uppercase">現況 · Status</p>
              <div className="space-y-3 text-sm font-light">
                <div className="flex items-start gap-3">
                  <span className="text-[--accent] mt-0.5">▸</span>
                  <span className="text-[--muted]">就讀：國立高科大 · 智慧商務系 二年級（燕巢）</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[--accent] mt-0.5">▸</span>
                  <span className="text-[--muted]">開放合作・技術交流・有趣對話</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[--accent] mt-0.5">▸</span>
                  <span className="text-[--muted]">居住地：高雄 🇹🇼 ↔ 福岡 🇯🇵</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[--accent] mt-0.5">▸</span>
                  <span className="text-[--muted]">日本語 N5 学習中</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[--accent] mt-0.5">▸</span>
                  <span className="text-[--muted]">得意分野：AI × Web 統合</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[--accent] mt-0.5">▸</span>
                  <span className="text-[--muted]">開発環境：Zenbook A14 ARM &nbsp;＋&nbsp; RTX 3070 Desktop</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[--accent] mt-0.5">▸</span>
                  <span className="text-[--muted]">興趣：交通運輸 · 鐵道研究</span>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>

        <FadeIn delay={0.2}>
          <p
            className="text-xs tracking-[0.35em] text-[--muted] uppercase mb-8 mt-12"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            歷程 · Timeline
          </p>
          <div className="relative mb-16">
            <div className="absolute left-[72px] top-2 bottom-2 w-[1px] bg-[--border]" />
            <div className="space-y-6">
              {[
                { year: "2021", zh: "進入市立中正高工 資訊科", en: "Enrolled at Zhongzheng Hi-Tech — Information" },
                { year: "2022", zh: "加入 FRC 機器人隊 · 學校電腦工場維護志工", en: "FRC robotics team · School lab maintenance" },
                { year: "2023", zh: "自動跟隨機器人 · 全國専題競賽動力機械群佳作", en: "Auto-following robot · National competition Excellence Award" },
                { year: "2024", zh: "高工畢業 · 升讀國立高科大 智慧商務系", en: "Graduated · Enrolled at NKUST Intelligent Commerce" },
                { year: "2025", zh: "完成 FoodLens Advisor & 購票系統", en: "Shipped FoodLens Advisor & ticketing platform" },
                { year: "2026", zh: "持續建構中 · 仕事在進行", en: "Continuously building" },
              ].map((item) => (
                <div key={item.year} className="flex items-start gap-6">
                  <p
                    className="text-xs text-[--accent] tracking-[0.15em] w-[60px] shrink-0 pt-0.5 text-right"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {item.year}
                  </p>
                  <div className="relative pl-8">
                    <div className="absolute left-[-4px] top-[5px] w-2 h-2 rounded-full border border-[--accent] bg-[--bg]" />
                    <p className="text-sm font-light text-[--text] leading-snug">{item.zh}</p>
                    <p className="text-xs font-light text-[--muted] opacity-50 mt-0.5">{item.en}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.25}>
          <p
            className="text-xs tracking-[0.35em] text-[--muted] uppercase mb-8"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            技能 · Skills
          </p>
          <div className="space-y-8">
            {skills.map((group) => (
              <div key={group.category} className="grid sm:grid-cols-[180px_1fr] gap-3 sm:gap-6 items-start">
                <div>
                  <p
                    className="text-xs tracking-[0.2em] text-[--accent] uppercase"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {group.categoryEn}
                  </p>
                  <p className="text-xs text-[--muted] font-light mt-0.5">{group.category}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <span
                      key={item}
                      className="px-3 py-1 text-xs font-light text-[--muted] border border-[--border] rounded-sm bg-[--surface] tracking-wide"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
