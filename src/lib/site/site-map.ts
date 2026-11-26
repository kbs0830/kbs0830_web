import type { Route } from "next";
import { EMAIL, GITHUB_URL } from "@/lib/site/site";

// 全站頁面索引（2026-11-23，「頁面瀏覽方便程度」）：頁尾的頁面清單（SiteFooter）跟 Ctrl+K 快速跳轉（QuickJump）共用這一份。
// 新增獨立頁面時加進對應的分組，兩邊就都找得到（還是要另外加進 sitemap.ts）。
// desc 只在快速跳轉裡顯示、也拿來比對關鍵字；不要寫進雷達位置、本名這類不公開的東西。
interface SitePage {
  href: Route;
  zh: string;
  en: string;
  desc: string;
}

const HOME_SECTIONS: SitePage[] = [
  { href: "/", zh: "首頁", en: "Home", desc: "PINGWEI LI 個人網站首頁" },
  { href: "/#about", zh: "自己紹介", en: "About", desc: "關於我、歷程、技能、足跡" },
  { href: "/#portfolio", zh: "製作物", en: "Work", desc: "作品集：個人専案、課程専題" },
  { href: "/#contact", zh: "連絡先", en: "Contact", desc: "Email、GitHub" },
];

export const SITE_GROUPS: { label: string; pages: SitePage[] }[] = [
  {
    label: "文章 · Writing",
    pages: [
      { href: "/blog", zh: "技術部落格", en: "Blog", desc: "真的踩過的坑跟修法" },
      { href: "/now", zh: "近況", en: "Now", desc: "現在在做什麼、在學什麼" },
      { href: "/uses", zh: "開発環境", en: "Uses", desc: "硬體、軟體、工具" },
      { href: "/resume", zh: "履歷", en: "Resume", desc: "教育、技能、作品、證照" },
    ],
  },
  {
    label: "旅 · Travel",
    pages: [
      { href: "/travel", zh: "旅行地球", en: "Travel", desc: "搭過的航線跟住過的城市畫在地球上" },
      { href: "/flights", zh: "飛行紀錄", en: "Flights", desc: "航班、機場、航空公司" },
      { href: "/hotels", zh: "住宿紀錄", en: "Hotels", desc: "住過的飯店、會籍" },
      { href: "/airports", zh: "機場時刻表", en: "Airports", desc: "小港、福岡機場即時航班" },
      { href: "/radar", zh: "自家雷達", en: "Radar", desc: "ADS-B 接收器收到的飛機" },
      { href: "/radar/zukan", zh: "機體図鑑", en: "Zukan", desc: "自家雷達收到過的機型，收到過的點亮" },
    ],
  },
  {
    label: "本站 · Site",
    pages: [
      { href: "/tools", zh: "小工具", en: "Tools", desc: "日幣換匯、台灣⇄福岡直飛、福岡穿搭、機場距離、日本消費稅、AI 爬蟲檢查" },
      { href: "/colophon", zh: "本站構造", en: "Colophon", desc: "網站架構、部署方式" },
      { href: "/status", zh: "維運狀態", en: "Status", desc: "可用率、部署紀錄、事故報告" },
      { href: "/stats", zh: "訪客分析", en: "Stats", desc: "流量、來源、裝置" },
      { href: "/changelog", zh: "更新紀錄", en: "Changelog", desc: "新功能上線紀錄" },
      { href: "/developers", zh: "開發者", en: "API & MCP", desc: "公開 JSON API、MCP 伺服器" },
    ],
  },
];

// 小工具（2026-11-24 決策表 J 系列）：頁尾只放一個「小工具」入口（7 個塞進頁尾會擠成兩行），
// 完整清單在 /tools 總覽跟 Ctrl+K 快速跳轉
export const TOOL_PAGES: SitePage[] = [
  { href: "/tools/jpy", zh: "日幣換匯比價", en: "JPY", desc: "台銀、玉山日幣牌價，換一筆台幣各家差多少、現在算便宜還是貴" },
  { href: "/tools/taiwan-fukuoka", zh: "台灣⇄福岡直飛", en: "TW⇄FUK", desc: "今天台灣各機場跟福岡之間的直飛班機、時間、狀態" },
  { href: "/tools/fukuoka-weather", zh: "福岡穿搭", en: "Weather", desc: "福岡跟高雄現在差幾度、這幾天要帶什麼衣服" },
  { href: "/tools/airport-distance", zh: "機場距離", en: "Distance", desc: "兩個機場代碼算大圓距離、大概飛多久" },
  { href: "/tools/japan-tax", zh: "日本消費稅", en: "Tax", desc: "含稅未稅、8%／10% 換算，順便換成台幣" },
  { href: "/tools/ai-crawlers", zh: "AI 爬蟲檢查", en: "robots.txt", desc: "輸入網域，看 GPTBot、ClaudeBot 等 AI 爬蟲有沒有被擋" },
  { href: "/tools/user-agent", zh: "UA 是爬蟲嗎", en: "User-Agent", desc: "貼一串 User-Agent，判斷是瀏覽器、搜尋引擎、AI 爬蟲還是機器人" },
  { href: "/tools/tailwind-v4-vars", zh: "Tailwind v4 變數檢查", en: "Tailwind v4", desc: "升級 v4 後顏色不見？找出方括號變數寫法、一鍵改成小括號" },
  { href: "/tools/ps1-encoding", zh: "PowerShell 亂碼檢查", en: "PS1 BOM", desc: "有中文的 .ps1 在 PowerShell 5.1 變亂碼？檢查有沒有 BOM、一鍵補上" },
  { href: "/tools/kanji-jp", zh: "繁體→日文漢字", en: "Kanji", desc: "輸入繁體中文，標出日文寫法不一樣的字（學→学、發→発）" },
  { href: "/tools/vram", zh: "顯存計算機", en: "VRAM", desc: "顯卡跑得動幾 B 模型？選顯存、量化、context 估算本機 LLM 要多少 VRAM" },
  { href: "/tools/power-cost", zh: "架站電費", en: "Power", desc: "家裡電腦 24 小時開機一年多少電費、跟租 VPS 比划不划算" },
];

/** 快速跳轉的一筆結果（頁面、作品、文章共用） */
export interface JumpItem {
  href: string;
  title: string;
  sub: string;
  /** 只拿來比對，不顯示 */
  keywords?: string;
}

export const OPEN_QUICK_JUMP = "quickjump:open";

const pageItem = (p: SitePage): JumpItem => ({ href: p.href, title: p.zh, sub: p.en, keywords: `${p.desc} ${p.href}` });

export const PAGE_ITEMS: JumpItem[] = [...HOME_SECTIONS, ...SITE_GROUPS.flatMap((g) => g.pages), ...TOOL_PAGES].map(pageItem);

/** 多個詞 AND、不分大小寫的「包含」比對；標題開頭符合的排前面 */
export function matchItems(items: JumpItem[], query: string): JumpItem[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return items;
  const scored: { item: JumpItem; score: number }[] = [];
  for (const item of items) {
    const title = item.title.toLowerCase();
    const hay = `${title} ${item.sub} ${item.keywords ?? ""}`.toLowerCase();
    if (!terms.every((t) => hay.includes(t))) continue;
    const score = title.startsWith(terms[0]) ? 0 : title.includes(terms[0]) ? 1 : 2;
    scored.push({ item, score });
  }
  return scored.sort((a, b) => a.score - b.score).map((s) => s.item);
}

// 頁尾「找我」一欄（TODO F8，2026-11-26）：外部連結跟 mailto 不是站內 Route，獨立一份；之後 /hire、贊助連結也加在這。
export const CONTACT_LINKS: { label: string; en: string; href: string; external?: boolean }[] = [
  { label: "GitHub", en: "kbs0830", href: GITHUB_URL, external: true },
  { label: "Email", en: "寫信", href: `mailto:${EMAIL}` },
  { label: "API", en: "/developers", href: "/developers" },
];
