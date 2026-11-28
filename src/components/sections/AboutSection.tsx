// Server Component：整個 section 在 server 產生 HTML，不進 client bundle。
// 需要瀏覽器的只有 <Reveal>/<RevealHeading>（捲動淡入）、<SpotifyNowPlaying>、<Tabs>（只管顯示哪一頁），
// 技能 accordion 用原生 <details>、時間軸展開用 CSS :hover/:focus，都不需要 JS。
// 2026-11-05：歷程／技能／活動／足跡原本一路往下排、整區很長，改成分頁（Tabs），面板內容照樣在 server 產生。
import ContribHeatmap from "@/components/ui/ContribHeatmap";
import { getContributions } from "@/lib/live/github-contrib";
import ScrollEnd from "@/components/ui/ScrollEnd";
import { Fragment } from "react";
import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import RevealHeading from "@/components/ui/RevealHeading";
import SpotifyNowPlaying from "@/components/live/SpotifyNowPlaying";
import { RadarBadge } from "@/components/live/RadarStatus";
import Eyebrow from "@/components/ui/Eyebrow";
import Link from "next/link";
import Tabs from "@/components/ui/Tabs";
import { flightStats } from "@/lib/travel/flights";
import { hotelStats } from "@/lib/travel/hotels";
import { planningCountries, skills, statusLines, timeline, visitedCountries } from "@/lib/content/about";
import { projectCountForTag, tagForSkill } from "@/lib/content/projects";
import { HOME_WIDTH } from "@/components/layout/home-width";

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

const MOBILE_SKILLS = 5;

function SkillChip({ item, className = "inline-flex" }: { item: (typeof skills)[0]["items"][0]; className?: string }) {
  const tag = tagForSkill(item.name);
  // 有作品用到的技能：點了跳到作品集並篩出那些作品（ProjectFilter 監聽 data-filter-tag，不重新載入頁面）
  return tag ? (
    <a
      href="#portfolio"
      data-filter-tag={tag}
      title={`看用到 ${tag} 的作品（${projectCountForTag(tag)} 個）`}
      className={`${className} items-center ${pill} hover:border-(--accent) hover:text-(--accent) transition-colors underline decoration-dotted decoration-(--border) underline-offset-4`}
    >
      {item.name}
      <ProficiencyDots level={item.level} />
    </a>
  ) : (
    <span className={`${className} items-center ${pill} ${pillHover}`}>
      {item.name}
      <ProficiencyDots level={item.level} />
    </span>
  );
}

// 原生 <details>：開合、鍵盤操作、aria-expanded 都由瀏覽器處理；動畫見 globals.css details.disclosure
function SkillGroup({ group, defaultOpen }: { group: (typeof skills)[0]; defaultOpen: boolean }) {
  const sorted = group.items.toSorted((a, b) => b.level - a.level);
  const [top, rest] = sorted.length > MOBILE_SKILLS + 1 ? [sorted.slice(0, MOBILE_SKILLS), sorted.slice(MOBILE_SKILLS)] : [sorted, []];
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
        <span className="text-xs font-light text-(--muted) hidden sm:block group-open:invisible">
          {group.items.length} 項技能，點擊展開
        </span>
      </summary>
      {/* 熟練度高的排前面（同分照原本順序）。手機（TODO P7，2026-11-28）：一類 7 個以上時只先露前 5 個，
          其他收在「還有 N 個」裡（巢狀 <details>，零 JS）；桌機全部攤開，跟以前一樣 */}
      <div className="flex flex-wrap gap-2 pt-4 sm:pl-[204px]">
        {top.map((item) => (
          <SkillChip key={item.name} item={item} />
        ))}
        {rest.map((item) => (
          <SkillChip key={item.name} item={item} className="hidden sm:inline-flex" />
        ))}
      </div>
      {rest.length > 0 && (
        <details className="sm:hidden group/more">
          <summary className="inline-flex items-center gap-1.5 mt-3 py-1.5 text-xs font-light text-(--muted) cursor-pointer list-none [&::-webkit-details-marker]:hidden">
            <span className="group-open/more:hidden">還有 {rest.length} 個</span>
            <span className="hidden group-open/more:inline">收起</span>
            <span aria-hidden className="text-(--accent) text-[10px] transition-[rotate] duration-200 group-open/more:rotate-180">▾</span>
          </summary>
          <div className="flex flex-wrap gap-2 pt-2">
            {rest.map((item) => (
              <SkillChip key={item.name} item={item} />
            ))}
          </div>
        </details>
      )}
    </details>
  );
}

// 滑鼠移上去、或鍵盤/觸控 focus 時展開補充說明——純 CSS（group-hover / group-focus），不需要 state
function TimelineItem({ item, index }: { item: (typeof timeline)[0]; index: number }) {
  return (
    <Reveal from="left" duration={0.5} delay={index * 0.08} margin={60} className="group/tl flex items-start gap-6">
      <p className="text-xs text-(--accent) tracking-[0.15em] w-[60px] shrink-0 pt-0.5 text-right font-mono">{item.year}</p>
      <div tabIndex={0} className="relative flex-1 pl-8 pr-8 sm:pr-0 cursor-pointer group/item">
        {/* 手機看不出可以點開（TODO P8，2026-11-28）：右邊一個淡淡的「＋」，點開（focus）時轉 45° 變成「×」，跟技能分類 ▸ 轉向同一套語言。
            桌機是滑鼠移上去就展開，不需要提示 */}
        <span
          aria-hidden
          className="sm:hidden absolute right-0 top-0 grid place-items-center size-6 -mt-1 text-base font-light leading-none text-(--muted) transition-[rotate,color] duration-300 ease-(--ease-ma) group-focus/item:rotate-45 group-focus/item:text-(--accent)"
        >
          +
        </span>
        {/* 外層 Reveal 加上 data-shown 時，圓點跟著放大出現 */}
        <div
          className="absolute left-[-4px] top-[5px] w-2 h-2 rounded-full border border-(--accent) bg-(--bg) scale-0 transition-[scale] duration-300 group-data-shown/tl:scale-100"
          style={{ transitionDelay: `${index * 0.08 + 0.15}s` }}
        />
        <p className="text-sm 3xl:text-[15px] font-light text-(--text) leading-snug transition-colors group-hover/item:text-(--accent) group-focus/item:text-(--accent)">
          {item.zh}
        </p>
        <p className="text-xs 3xl:text-[13px] font-light text-(--muted) mt-0.5">{item.en}</p>
        <div className="grid grid-rows-[0fr] opacity-0 transition-[grid-template-rows,opacity] duration-300 ease-(--ease-ma) group-hover/item:grid-rows-[1fr] group-hover/item:opacity-100 group-focus/item:grid-rows-[1fr] group-focus/item:opacity-100">
          <div className="overflow-hidden">
            <div className="pt-2 mt-2 border-t border-(--border) space-y-0.5">
              <p className="text-xs 3xl:text-[13px] font-light text-(--muted)">{item.detailZh}</p>
              <p className="text-[11px] 3xl:text-xs font-light text-(--muted)">{item.detailEn}</p>
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
      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-(--muted) font-light mb-6 font-mono">
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

async function ActivityPanel() {
  // 自己畫的熱力圖（TODO D1）；抓不到 GitHub 資料時退回舊的 ghchart 圖片（P4：手機先捲到最近）
  const days = await getContributions("kbs0830").catch(() => null);
  return (
    <>
      {days ? (
        <div className="p-4 border border-(--border) rounded-sm bg-(--bg)">
          <ContribHeatmap user="kbs0830" days={days} />
        </div>
      ) : (
        <>
      {/* 手機放不下整年：先捲到最右邊（最近的月份）、邊緣淡出提示可以滑（TODO P4）；底色跟著主題，不再是寫死的白底 */}
      <ScrollEnd className="p-4 border border-(--border) rounded-sm bg-(--bg) overflow-x-auto">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://ghchart.rshah.org/2d5a8e/kbs0830"
          alt="kbs0830 的 GitHub 貢獻熱力圖"
          width={663}
          height={104}
          className="min-w-[640px] w-full h-auto"
          loading="lazy"
        />
      </ScrollEnd>
        </>
      )}
      <p className="text-[11px] text-(--muted) font-light mt-2 font-mono">github.com/kbs0830 · 公開貢獻紀錄</p>
    </>
  );
}

function FootprintPanel() {
  return (
    <>
      <p className="text-xs text-(--muted) font-light mb-8 font-mono">
        已到訪 {visitedCountries.length} 個國家 · 規劃中 {planningCountries.length} 個國家
      </p>
      {/* 手機改成清單式（TODO P6，2026-11-27）：一國一行，城市用「·」接成一行字；沒有城市的國家只放國名，不放佔一整行卻沒資訊的「已到訪」方框。
          811px → 約 350px。桌機維持下面的方框樣式（寬螢幕放得下、比較好看） */}
      <ul className="sm:hidden space-y-2.5 text-[15px] font-light leading-relaxed">
        {visitedCountries.map((c) => (
          <li key={c.country}>
            <span aria-hidden className="mr-1.5">{c.flag}</span>
            <span className="text-(--text)">{c.country}</span>
            {c.cities.length > 0 && <span className="text-(--muted) break-keep">　{c.cities.join(" · ")}</span>}
          </li>
        ))}
        <li className="pt-2.5 border-t border-(--border) text-(--muted)">
          規劃中　
          {planningCountries.map((c, i) => (
            <span key={c.country}>
              {i > 0 && " · "}
              <span aria-hidden>{c.flag} </span>
              {c.country}
            </span>
          ))}
        </li>
      </ul>
      <div className="hidden sm:block space-y-8">
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
            <p className="text-xs text-(--muted) font-light mt-0.5">規劃中</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {planningCountries.map((c) => (
              <span
                key={c.country}
                className="px-3 py-1 text-xs font-light text-(--muted) border border-dashed border-(--border) rounded-sm tracking-wide cursor-default"
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
        <Link
          href="/radar"
          className="inline-block py-3 -my-3 text-xs text-(--muted) hover:text-(--accent) transition-colors font-mono tracking-wide"
        >
          自家雷達 · My Radar（即時）→
        </Link>
      </div>
    </>
  );
}

export default function AboutSection() {
  return (
    <section id="about" className="py-20 md:py-32 bg-(--surface)">
      <div className={`${HOME_WIDTH} mx-auto px-6`}>
        <Reveal>
          <Eyebrow className="mb-4">01 — About</Eyebrow>
          <RevealHeading text="自己紹介 · 關於我" className="text-3xl sm:text-4xl 3xl:text-5xl font-light text-(--text) mb-10 md:mb-16 font-serif" />
        </Reveal>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 mb-14 md:mb-20">
          <Reveal delay={0.1}>
            <div className="space-y-5 font-light leading-relaxed text-[15px] 3xl:text-[17px] break-keep">
              {/* 手機（TODO P1，2026-11-28）：照片縮成 64px、跟第一段並排（圖左字右），不再自己佔一行；桌機照舊照片在上 */}
              <div className="flex items-start gap-4 sm:block">
                <Image
                  src="/image/大頭貼.jpg"
                  alt="PINGWEI LI"
                  width={108}
                  height={108}
                  className="size-16 sm:size-[108px] shrink-0 sm:mb-6 rounded-sm object-cover object-top grayscale-[15%]"
                />
                {/* 2026-11-26 文案重寫（TODO N10，使用者選 1B＋2＋3）：一段一個具體事實，不用「深深」「探索…的可能性」這類空泛詞 */}
                {/* 中文句子在 JSX 裡不要換行：換行會變成一個半形空格（「福岡； 一半」）。外層 break-keep：只在標點、空格換行，不會斷成「靈／感」「程式／碼」 */}
                {/* min-w-0＋<wbr>：跟照片並排後一行變窄，break-keep 下「一半的靈感來自…航程」整串沒有斷點，360px 會把頁面撐到 404px（E2E 抓到）。
                    在詞組之間給斷點，不會斷在詞的中間 */}
                <p className="min-w-0 text-(--text)">
                  我在<span className="text-(--accent)">高雄</span>念書，常往返<span className="text-(--accent)">福岡</span>；一半的靈感<wbr />來自這兩座城市<wbr />之間的那段航程。
                </p>
              </div>
              <p className="text-(--muted)">
                我做的東西落在 AI 跟網頁之間：模型負責判斷，介面負責好用，程式碼負責讓下一個人看得懂。
              </p>
              <p className="text-(--muted)">
                這個網站就是例子——自己寫、架在家裡的桌機上，出問題會自己寄信通知我。
              </p>
              {/* 英文段落手機不顯示（TODO P1）：跟作品區「手機一行中文就好」同一個原則；桌機照舊 */}
              <div className="hidden sm:block pt-2 border-t border-(--border)">
                <p className="text-(--muted) text-sm 3xl:text-[15px]">
                  Student developer between Kaohsiung and Fukuoka. I work where AI meets the web —
                  and I host what I build: this site runs on a desktop at home.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="p-6 border border-(--border) rounded-sm bg-(--bg) space-y-4 font-mono">
              <p className="text-xs tracking-[0.25em] text-(--accent) uppercase">現況 · Status</p>
              {/* 手機（TODO P2，2026-11-28）：7 行清單約 330px → 兩欄小格子（標籤小字在上、值在下），資訊全部保留、高度約減半。
                  值很長的（就讀）佔滿兩欄。桌機照舊「▸ 標籤　值」一行一項 */}
              <ul className="grid grid-cols-2 gap-x-4 gap-y-3.5 sm:block sm:space-y-3 text-sm 3xl:text-[15px] font-light">
                {/* 每行「標籤＋全形空格＋值」：標籤固定一欄，值換行時對齊值的開頭（手機上就讀那行會換行） */}
                {statusLines.map((line) => {
                  const [key, value] = line.split("　");
                  return (
                    <li key={line} className={`flex items-start gap-3 ${value && value.length > 16 ? "col-span-2" : ""}`}>
                      <span className="hidden sm:inline text-(--accent) mt-0.5" aria-hidden>▸</span>
                      {value ? (
                        <span className="flex flex-col gap-0.5 sm:flex-row sm:gap-3 text-(--text) sm:text-(--muted)">
                          <span className="shrink-0 text-[11px] tracking-wide text-(--muted) sm:text-sm 3xl:text-[15px] sm:tracking-normal">{key}</span>
                          {/* 只在「 · 」之間換行，每一段不拆開（2026-11-26 使用者：手機上「三年級（燕巢）」被拆成兩行、括號掉到下一行開頭）。
                              「·」留在上一行行尾 */}
                          <span>
                            {/* 空格放在 nowrap 外面，才是可以換行的地方 */}
                            {value.split(" · ").map((seg, i, all) => (
                              <Fragment key={seg}>
                                <span className="whitespace-nowrap">
                                  {seg}
                                  {i < all.length - 1 && " ·"}
                                </span>
                                {i < all.length - 1 && " "}
                              </Fragment>
                            ))}
                          </span>
                        </span>
                      ) : (
                        <span className="text-(--muted)">{line}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="mt-4 space-y-3">
              <SpotifyNowPlaying />
              {/* 自家 FR24 雷達即時小卡（2026-11-21） */}
              <RadarBadge />
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.2}>
          <Tabs
            label="關於我的分類"
            // 各分頁高度差很多（390px 實測：歷程 481、技能 427、足跡 410、開発活動 209），給同一個最小高度（以最高的為準），切換時下面的作品區不會整塊上下跳（TODO P5）。
            // 只加在顯示中的那頁：hidden="until-found" 的面板還佔版面（content-visibility），加了會多出好幾頁空白
            panelClassName="[&:not([hidden])]:min-h-[30.5rem] sm:[&:not([hidden])]:min-h-[29rem]"
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
