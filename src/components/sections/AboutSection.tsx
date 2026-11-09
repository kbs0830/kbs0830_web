// Server Component：整個 section 在 server 產生 HTML，不進 client bundle。
// 需要瀏覽器的只有 <Reveal>/<RevealHeading>（捲動淡入）、<SpotifyNowPlaying>、<Tabs>（只管顯示哪一頁），
// 技能 accordion 用原生 <details>、時間軸展開用 CSS :hover/:focus，都不需要 JS。
// 2026-11-05：歷程／技能／活動／足跡原本一路往下排、整區很長，改成分頁（Tabs），面板內容照樣在 server 產生。
import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import RevealHeading from "@/components/ui/RevealHeading";
import SpotifyNowPlaying from "@/components/ui/SpotifyNowPlaying";
import Eyebrow from "@/components/ui/Eyebrow";
import Link from "next/link";
import Tabs from "@/components/ui/Tabs";
import { flightStats } from "@/lib/flights";
import { hotelStats } from "@/lib/hotels";
import { planningCountries, skills, statusLines, timeline, visitedCountries } from "@/lib/about";

// 技能 chip、到訪城市共用的小膠囊樣式
const pill = "px-3 py-1 text-xs font-light text-(--muted) border border-(--border) rounded-sm bg-(--surface) tracking-wide";
const pillHover = "hover:border-(--accent) hover:text-(--accent) transition-colors cursor-default";
const label = "text-xs tracking-[0.2em] uppercase font-mono";

function ProficiencyDots({ level }: { level: number }) {
  return (
    <span className="inline-flex gap-[2px] ml-1.5 align-middle" aria-hidden>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={`w-[3px] h-[3px] rounded-full ${n <= level ? "bg-(--accent)" : "bg-(--border)"}`} />
      ))}
    </span>
  );
}

// 原生 <details>：開合、鍵盤操作、aria-expanded 都由瀏覽器處理；動畫見 globals.css details.disclosure
function SkillGroup({ group, defaultOpen }: { group: (typeof skills)[0]; defaultOpen: boolean }) {
  return (
    <details open={defaultOpen} className="disclosure group pt-3 first:pt-0">
      <summary className="w-full grid sm:grid-cols-[180px_1fr] gap-3 sm:gap-6 items-center cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          <span className="inline-block text-(--accent) text-xs transition-[rotate] duration-200 group-open:rotate-90">▸</span>
          <span>
            <span className={`block ${label} text-(--accent)`}>{group.categoryEn}</span>
            <span className="block text-xs text-(--muted) font-light mt-0.5">{group.category}</span>
          </span>
        </span>
        <span className="text-xs font-light text-(--muted) opacity-50 hidden sm:block group-open:invisible">
          {group.items.length} 項技能，點擊展開
        </span>
      </summary>
      <div className="flex flex-wrap gap-2 pt-4 sm:pl-[204px]">
        {group.items.map((item) => (
          <span key={item.name} className={`inline-flex items-center ${pill} ${pillHover}`}>
            {item.name}
            <ProficiencyDots level={item.level} />
          </span>
        ))}
      </div>
    </details>
  );
}

// 滑鼠移上去、或鍵盤/觸控 focus 時展開補充說明——純 CSS（group-hover / group-focus），不需要 state
function TimelineItem({ item, index }: { item: (typeof timeline)[0]; index: number }) {
  return (
    <Reveal from="left" duration={0.5} delay={index * 0.08} margin={60} className="group/tl flex items-start gap-6">
      <p className="text-xs text-(--accent) tracking-[0.15em] w-[60px] shrink-0 pt-0.5 text-right font-mono">{item.year}</p>
      <div tabIndex={0} className="relative pl-8 cursor-pointer group/item">
        {/* 外層 Reveal 加上 data-shown 時，圓點跟著放大出現 */}
        <div
          className="absolute left-[-4px] top-[5px] w-2 h-2 rounded-full border border-(--accent) bg-(--bg) scale-0 transition-[scale] duration-300 group-data-shown/tl:scale-100"
          style={{ transitionDelay: `${index * 0.08 + 0.15}s` }}
        />
        <p className="text-sm font-light text-(--text) leading-snug transition-colors group-hover/item:text-(--accent) group-focus/item:text-(--accent)">
          {item.zh}
        </p>
        <p className="text-xs font-light text-(--muted) opacity-50 mt-0.5">{item.en}</p>
        <div className="grid grid-rows-[0fr] opacity-0 transition-[grid-template-rows,opacity] duration-300 ease-(--ease-ma) group-hover/item:grid-rows-[1fr] group-hover/item:opacity-100 group-focus/item:grid-rows-[1fr] group-focus/item:opacity-100">
          <div className="overflow-hidden">
            <div className="pt-2 mt-2 border-t border-(--border) space-y-0.5">
              <p className="text-xs font-light text-(--muted)">{item.detailZh}</p>
              <p className="text-[11px] font-light text-(--muted) opacity-60">{item.detailEn}</p>
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

const skillCount = skills.reduce((n, g) => n + g.items.length, 0);

function TimelinePanel() {
  return (
    <div className="relative">
      <div className="absolute left-[72px] top-2 bottom-2 w-[1px] bg-(--border)" />
      <div className="space-y-6">
        {timeline.map((item, i) => (
          <TimelineItem key={item.year} item={item} index={i} />
        ))}
      </div>
    </div>
  );
}

function SkillsPanel() {
  return (
    <>
      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-(--muted) font-light opacity-70 mb-6 font-mono">
        <span className="inline-flex items-center">
          <ProficiencyDots level={5} />
          <span className="ml-1.5">熟練 Proficient</span>
        </span>
        <span className="inline-flex items-center">
          <ProficiencyDots level={2} />
          <span className="ml-1.5">学習中 Learning</span>
        </span>
      </p>
      <div className="space-y-3 divide-y divide-(--border)">
        {skills.map((group, i) => (
          <SkillGroup key={group.category} group={group} defaultOpen={i === 0} />
        ))}
      </div>
    </>
  );
}

function ActivityPanel() {
  return (
    <>
      <div className="p-4 border border-(--border) rounded-sm bg-white overflow-x-auto">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://ghchart.rshah.org/2d5a8e/kbs0830"
          alt="kbs0830 的 GitHub 貢獻熱力圖"
          width={663}
          height={104}
          className="min-w-[640px] w-full h-auto"
          loading="lazy"
        />
      </div>
      <p className="text-[11px] text-(--muted) font-light mt-2 opacity-60 font-mono">github.com/kbs0830 · 公開貢獻紀錄</p>
    </>
  );
}

function FootprintPanel() {
  return (
    <>
      <p className="text-xs text-(--muted) font-light opacity-70 mb-8 font-mono">
        已到訪 {visitedCountries.length} 個國家 · 規劃中 {planningCountries.length} 個國家
      </p>
      <div className="space-y-8">
        <div className="space-y-4">
          {visitedCountries.map((c) => (
            <div key={c.country} className="grid sm:grid-cols-[180px_1fr] gap-3 sm:gap-6 items-start">
              <div>
                <p className={`${label} text-(--accent)`}>
                  {c.flag} {c.countryEn}
                </p>
                <p className="text-xs text-(--muted) font-light mt-0.5">{c.country}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {c.cities.length > 0 ? (
                  c.cities.map((city) => (
                    <span key={city} className={`${pill} ${pillHover}`}>
                      {city}
                    </span>
                  ))
                ) : (
                  <span className={pill}>已到訪</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-[180px_1fr] gap-3 sm:gap-6 items-start pt-4 border-t border-(--border)">
          <div>
            <p className={`${label} text-(--muted)`}>Planning</p>
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
      {/* 航班明細 2026-11-05 搬到獨立頁面：首頁的主角是程式，足跡只留國家跟城市 */}
      <div className="mt-8 flex flex-wrap gap-x-8 gap-y-2">
        <Link
          href="/flights"
          className="inline-block py-3 -my-3 text-xs text-(--muted) hover:text-(--accent) transition-colors font-mono tracking-wide"
        >
          飛行紀錄 · Flight Log（{flightStats().flights} 航班 · {flightStats().airports} 機場）→
        </Link>
        <Link
          href="/hotels"
          className="inline-block py-3 -my-3 text-xs text-(--muted) hover:text-(--accent) transition-colors font-mono tracking-wide"
        >
          住宿紀錄 · Hotel Log（{hotelStats().hotels} 間 · {hotelStats().cities} 城市）→
        </Link>
      </div>
    </>
  );
}

export default function AboutSection() {
  return (
    <section id="about" className="py-20 md:py-32 bg-(--surface)">
      <div className="max-w-5xl mx-auto px-6">
        <Reveal>
          <Eyebrow className="mb-4">01 — About</Eyebrow>
          <RevealHeading text="自己紹介　·　關於我" className="text-3xl sm:text-4xl font-light text-(--text) mb-10 md:mb-16 font-serif" />
        </Reveal>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 mb-14 md:mb-20">
          <Reveal delay={0.1}>
            <div className="space-y-5 font-light leading-relaxed text-[15px]">
              <div className="mb-6">
                <Image
                  src="/image/大頭貼.jpg"
                  alt="PINGWEI LI"
                  width={108}
                  height={108}
                  className="rounded-sm object-cover object-top grayscale-[15%]"
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
                  I&apos;m a developer based between Kaohsiung and Fukuoka, exploring the
                  intersection of AI inference, web interfaces, and thoughtful system design.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="p-6 border border-(--border) rounded-sm bg-(--bg) space-y-4 font-mono">
              <p className="text-xs tracking-[0.25em] text-(--accent) uppercase">現況 · Status</p>
              <ul className="space-y-3 text-sm font-light">
                {statusLines.map((line) => (
                  <li key={line} className="flex items-start gap-3">
                    <span className="text-(--accent) mt-0.5" aria-hidden>▸</span>
                    <span className="text-(--muted)">{line}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-4">
              <SpotifyNowPlaying />
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.2}>
          <Tabs
            label="關於我的分類"
            items={[
              { key: "timeline", label: "歷程", labelEn: "Timeline", count: timeline.length, panel: <TimelinePanel /> },
              { key: "skills", label: "技能", labelEn: "Skills", count: skillCount, panel: <SkillsPanel /> },
              { key: "activity", label: "開発活動", labelEn: "Activity", panel: <ActivityPanel /> },
              { key: "footprint", label: "足跡", labelEn: "Footprint", count: visitedCountries.length, panel: <FootprintPanel /> },
            ]}
          />
        </Reveal>
      </div>
    </section>
  );
}
