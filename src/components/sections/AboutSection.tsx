"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import Image from "next/image";
import RevealHeading from "@/components/ui/RevealHeading";

const skills = [
  {
    category: "AI · 機器学習",
    categoryEn: "AI / ML",
    items: [
      { name: "Python", level: 5 },
      { name: "YOLOv8", level: 4 },
      { name: "ONNX Runtime Web", level: 3 },
      { name: "TensorFlow.js", level: 3 },
      { name: "Gemini API", level: 4 },
      { name: "Ultralytics", level: 4 },
      { name: "Pydantic v2", level: 3 },
      { name: "Jetson Nano", level: 3 },
      { name: "Raspberry Pi", level: 3 },
      { name: "OpenCV", level: 3 },
    ],
  },
  {
    category: "後端 · バックエンド",
    categoryEn: "Backend",
    items: [
      { name: "FastAPI", level: 4 },
      { name: "Flask", level: 4 },
      { name: "Blueprint 路由", level: 4 },
      { name: "REST API 設計", level: 4 },
      { name: "Google Sheets API", level: 3 },
      { name: "環境変数管理", level: 3 },
      { name: "Render 部署", level: 3 },
    ],
  },
  {
    category: "前端 · フロントエンド",
    categoryEn: "Frontend",
    items: [
      { name: "Next.js 16", level: 4 },
      { name: "React 19", level: 4 },
      { name: "TypeScript", level: 4 },
      { name: "Tailwind CSS v4", level: 4 },
      { name: "Framer Motion", level: 3 },
      { name: "Three.js", level: 3 },
      { name: "React Three Fiber", level: 3 },
      { name: "Vanilla JS (ES6)", level: 4 },
    ],
  },
  {
    category: "工具 · 開発環境",
    categoryEn: "Tools & Environment",
    items: [
      { name: "VSCode", level: 5 },
      { name: "pnpm", level: 4 },
      { name: "Git", level: 4 },
      { name: "Windows 11", level: 5 },
      { name: "Arduino", level: 3 },
      { name: "Gunicorn", level: 3 },
      { name: "LINE Pay API", level: 2 },
      { name: "丙級電腦硬體裝修", level: 3 },
    ],
  },
  {
    category: "学習中 · 探索領域",
    categoryEn: "Currently Learning",
    items: [
      { name: "WebGL Shader", level: 1 },
      { name: "React Three Fiber 進階", level: 2 },
      { name: "Electron 打包部署", level: 1 },
      { name: "エッジ AI 推論", level: 2 },
      { name: "システム設計", level: 2 },
      { name: "日本語 N5", level: 1 },
    ],
  },
];

function ProficiencyDots({ level }: { level: number }) {
  return (
    <span className="inline-flex gap-[2px] ml-1.5 align-middle" aria-hidden>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`w-[3px] h-[3px] rounded-full ${n <= level ? "bg-(--accent)" : "bg-(--border)"}`}
        />
      ))}
    </span>
  );
}

function SkillGroup({ group, defaultOpen }: { group: (typeof skills)[0]; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="pt-3 first:pt-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full grid sm:grid-cols-[180px_1fr] gap-3 sm:gap-6 items-center text-left cursor-pointer"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <motion.span
            className="text-(--accent) text-xs"
            animate={{ rotate: open ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            ▸
          </motion.span>
          <span>
            <p
              className="text-xs tracking-[0.2em] text-(--accent) uppercase"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {group.categoryEn}
            </p>
            <p className="text-xs text-(--muted) font-light mt-0.5">{group.category}</p>
          </span>
        </span>
        {!open && (
          <p className="text-xs font-light text-(--muted) opacity-50 hidden sm:block">
            {group.items.length} 項技能，點擊展開
          </p>
        )}
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        className="overflow-hidden"
      >
        <div className="flex flex-wrap gap-2 pt-4 sm:pl-[204px]">
          {group.items.map((item) => (
            <span
              key={item.name}
              className="inline-flex items-center px-3 py-1 text-xs font-light text-(--muted) border border-(--border) rounded-sm bg-(--surface) tracking-wide hover:border-(--accent) hover:text-(--accent) transition-colors cursor-default"
            >
              {item.name}
              <ProficiencyDots level={item.level} />
            </span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

const visitedCountries = [
  { flag: "🇯🇵", country: "日本", countryEn: "Japan", cities: ["福岡", "大阪", "東京", "京都", "秋田", "沖繩"] },
  { flag: "🇹🇭", country: "泰國", countryEn: "Thailand", cities: ["曼谷"] },
  { flag: "🇭🇰", country: "香港", countryEn: "Hong Kong", cities: [] },
  { flag: "🇺🇸", country: "美國", countryEn: "USA", cities: ["德州"] },
];

const planningCountries = [
  { flag: "🇰🇷", country: "韓國", countryEn: "South Korea" },
  { flag: "🇸🇬", country: "新加坡", countryEn: "Singapore" },
  { flag: "🇲🇾", country: "馬來西亞", countryEn: "Malaysia" },
  { flag: "🇻🇳", country: "越南", countryEn: "Vietnam" },
];

const timeline = [
  {
    year: "2021", zh: "進入市立中正高工 資訊科",                      en: "Enrolled at Zhongzheng Hi-Tech — Information",
    detailZh: "從 HTML/CSS、C、Python 基礎課程開始，第一次接觸程式設計。",
    detailEn: "Started with HTML/CSS, C, and Python fundamentals.",
  },
  {
    year: "2022", zh: "加入 FRC 機器人隊 · 學校電腦工場維護志工",      en: "FRC robotics team · School lab maintenance",
    detailZh: "學習 CNC 加工與電控配線，同時擔任學校電腦工場維護志工。",
    detailEn: "Learned CNC machining and control wiring; also volunteered maintaining the school's computer lab.",
  },
  {
    year: "2023", zh: "自動跟隨機器人 · 全國専題競賽動力機械群佳作",    en: "Auto-following robot · National competition Excellence Award",
    detailZh: "以 Jetson Nano ＋ Arduino 打造即時視覺追蹤系統。",
    detailEn: "Built a Jetson Nano + Arduino real-time vision-tracking system.",
  },
  {
    year: "2024", zh: "高工畢業 · 升讀國立高科大 智慧商務系",          en: "Graduated · Enrolled at NKUST Intelligent Commerce",
    detailZh: "從高工資訊科畢業，升讀國立高雄科技大學智慧商務系。",
    detailEn: "Graduated from the vocational IT program and enrolled at NKUST Intelligent Commerce.",
  },
  {
    year: "2025", zh: "完成 FoodLens Advisor & 購票系統",              en: "Shipped FoodLens Advisor & ticketing platform",
    detailZh: "FoodLens Advisor（YOLOv8 ＋ Gemini）與購票系統（Flask ＋ LINE Pay）皆完成部署。",
    detailEn: "Shipped FoodLens Advisor (YOLOv8 + Gemini) and a Flask + LINE Pay ticketing platform.",
  },
  {
    year: "2026", zh: "持續建構中 · 仕事在進行",                       en: "Continuously building",
    detailZh: "持續打磨個人網站與新專案，同時準備日本語 N5 検定。",
    detailEn: "Continuing to refine this site and new projects while preparing for the JLPT N5.",
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

function TimelineItem({ item, index }: { item: typeof timeline[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      ref={ref}
      className="flex items-start gap-6"
      initial={{ opacity: 0, x: -12 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: index * 0.08 }}
    >
      <p
        className="text-xs text-(--accent) tracking-[0.15em] w-[60px] shrink-0 pt-0.5 text-right"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {item.year}
      </p>
      <div
        className="relative pl-8 cursor-pointer group/item"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
      >
        <motion.div
          className="absolute left-[-4px] top-[5px] w-2 h-2 rounded-full border border-(--accent) bg-(--bg)"
          initial={{ scale: 0 }}
          animate={inView ? { scale: 1 } : {}}
          transition={{ duration: 0.3, delay: index * 0.08 + 0.15 }}
        />
        <p className="text-sm font-light text-(--text) leading-snug group-hover/item:text-(--accent) transition-colors">
          {item.zh}
        </p>
        <p className="text-xs font-light text-(--muted) opacity-50 mt-0.5">{item.en}</p>
        <motion.div
          initial={false}
          animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className="overflow-hidden"
        >
          <div className="pt-2 mt-2 border-t border-(--border) space-y-0.5">
            <p className="text-xs font-light text-(--muted)">{item.detailZh}</p>
            <p className="text-[11px] font-light text-(--muted) opacity-60">{item.detailEn}</p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function AboutSection() {
  return (
    <section id="about" className="py-20 md:py-32 bg-(--surface)">
      <div className="max-w-5xl mx-auto px-6">
        <FadeIn>
          <p
            className="text-xs tracking-[0.35em] text-(--muted) uppercase mb-4"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            About
          </p>
          <RevealHeading
            text="自己紹介　·　關於我"
            className="text-3xl sm:text-4xl font-light text-(--text) mb-10 md:mb-16"
            style={{ fontFamily: "var(--font-serif)" }}
          />
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
              <p className="text-(--text)">
                在<span className="text-(--accent)">台灣高雄</span>與<span className="text-(--accent)">日本福岡</span>之間生活——
                兩座城市的節奏與細節，深深影響了我對軟體設計的思考方式。
              </p>
              <p className="text-(--muted)">
                我的工作落在 AI 與網頁的交叉點：讓模型做它該做的事，
                讓介面不妨礙使用者，讓程式碼能被下一個人讀懂。
              </p>
              <p className="text-(--muted)">
                目前仍在學習中，持續建構 side project，
                探索本地端 ML 推理與精緻 UI 之間的可能性。
              </p>
              <div className="pt-2 border-t border-(--border)">
                <p className="text-(--muted) text-sm">
                  I'm a developer based between Kaohsiung and Fukuoka, exploring the
                  intersection of AI inference, web interfaces, and thoughtful system design.
                </p>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.15}>
            <div
              className="p-6 border border-(--border) rounded-sm bg-(--bg) space-y-4"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              <p className="text-xs tracking-[0.25em] text-(--accent) uppercase">現況 · Status</p>
              <div className="space-y-3 text-sm font-light">
                {[
                  "就讀：國立高科大 · 智慧商務系 二年級（燕巢）",
                  "開放合作・技術交流・有趣對話",
                  "居住地：高雄 🇹🇼 ↔ 福岡 🇯🇵",
                  "日本語 N5 学習中",
                  "得意分野：AI × Web 統合",
                  "開発環境：Zenbook A14 ARM　＋　RTX 3070 Desktop",
                  "興趣：交通運輸 · 鐵道研究",
                ].map((line) => (
                  <div key={line} className="flex items-start gap-3">
                    <span className="text-(--accent) mt-0.5">▸</span>
                    <span className="text-(--muted)">{line}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>

        <FadeIn delay={0.2}>
          <p
            className="text-xs tracking-[0.35em] text-(--muted) uppercase mb-8 mt-12"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            歷程 · Timeline
          </p>
        </FadeIn>

        <div className="relative mb-16">
          <div className="absolute left-[72px] top-2 bottom-2 w-[1px] bg-(--border)" />
          <div className="space-y-6">
            {timeline.map((item, i) => (
              <TimelineItem key={item.year} item={item} index={i} />
            ))}
          </div>
        </div>

        <FadeIn delay={0.25}>
          <p
            className="text-xs tracking-[0.35em] text-(--muted) uppercase mb-8"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            技能 · Skills
          </p>
          <div className="space-y-3 divide-y divide-(--border)">
            {skills.map((group, i) => (
              <SkillGroup key={group.category} group={group} defaultOpen={i === 0} />
            ))}
          </div>
        </FadeIn>

        <FadeIn delay={0.28}>
          <p
            className="text-xs tracking-[0.35em] text-(--muted) uppercase mb-6 mt-16"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            開発活動 · Activity
          </p>
          <div className="p-4 border border-(--border) rounded-sm bg-white overflow-x-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://ghchart.rshah.org/2d5a8e/kbs0830"
              alt="kbs0830 的 GitHub 貢獻熱力圖"
              className="min-w-[640px] w-full"
              loading="lazy"
            />
          </div>
          <p
            className="text-[11px] text-(--muted) font-light mt-2 opacity-60"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            github.com/kbs0830 · 公開貢獻紀錄
          </p>
        </FadeIn>

        <FadeIn delay={0.3}>
          <p
            className="text-xs tracking-[0.35em] text-(--muted) uppercase mb-8 mt-16"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            足跡 · Footprint
          </p>
          <div className="space-y-8">
            <div className="space-y-4">
              {visitedCountries.map((c) => (
                <div
                  key={c.country}
                  className="grid sm:grid-cols-[180px_1fr] gap-3 sm:gap-6 items-start"
                >
                  <div>
                    <p
                      className="text-xs tracking-[0.2em] text-(--accent) uppercase"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {c.flag} {c.countryEn}
                    </p>
                    <p className="text-xs text-(--muted) font-light mt-0.5">{c.country}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {c.cities.length > 0 ? (
                      c.cities.map((city) => (
                        <span
                          key={city}
                          className="px-3 py-1 text-xs font-light text-(--muted) border border-(--border) rounded-sm bg-(--surface) tracking-wide hover:border-(--accent) hover:text-(--accent) transition-colors cursor-default"
                        >
                          {city}
                        </span>
                      ))
                    ) : (
                      <span className="px-3 py-1 text-xs font-light text-(--muted) border border-(--border) rounded-sm bg-(--surface) tracking-wide">
                        已到訪
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid sm:grid-cols-[180px_1fr] gap-3 sm:gap-6 items-start pt-4 border-t border-(--border)">
              <div>
                <p
                  className="text-xs tracking-[0.2em] text-(--muted) uppercase"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  Planning
                </p>
                <p className="text-xs text-(--muted) font-light mt-0.5 opacity-70">規劃中</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {planningCountries.map((c) => (
                  <span
                    key={c.country}
                    className="px-3 py-1 text-xs font-light text-(--muted) border border-dashed border-(--border) rounded-sm tracking-wide opacity-70 cursor-default"
                  >
                    {c.flag} {c.country}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
