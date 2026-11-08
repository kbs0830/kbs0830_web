import type { Metadata } from "next";
import { fontVariables } from "./fonts";
import { EMAIL, GITHUB_URL, INSTAGRAM_URL, PERSON_ID, SITE_URL } from "@/lib/site";
import JsonLd from "@/components/ui/JsonLd";
import WebVitals from "@/components/ui/WebVitals";
import "./globals.css";

export const metadata: Metadata = {
  title: "PINGWEI LI — 学生開発者 · Portfolio",
  description: "高雄出身的學生開発者，專注於 AI 工具應用與網頁開發。就讀國立高科大智慧商務系，使用 Claude & Gemini 構建 AI × Web 専案。",
  metadataBase: new URL(SITE_URL),
  // 子頁面自己宣告 alternates 會整個蓋掉這裡，所以這行的 Markdown 版只對首頁有效（各頁自己有寫）
  alternates: { canonical: "/", types: { "text/markdown": "/index.md", "application/rss+xml": "/feed.xml" } },
  openGraph: {
    title: "PINGWEI LI — Portfolio",
    description: "高雄出身的學生開発者，專注於 AI 工具應用與網頁開發。",
    url: SITE_URL,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PINGWEI LI — 学生開発者 · Portfolio",
    description: "高雄出身的學生開発者，專注於 AI 工具應用與網頁開發。",
  },
};

// Person＋WebSite，全站每頁都有。本名只放在這種不會顯示在頁面上的欄位（CLAUDE.md Key Constraints 1），
// alternateName 列出中文名跟各種英文拼法，讓搜「李秉威」「Li Ping-Wei」的人／AI 能對應到這個網站。
// 只放確定正確的資料：學歷只寫高科大（高中校名的英文寫法還沒跟使用者確認）。
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": PERSON_ID,
      name: "PINGWEI LI",
      alternateName: ["李秉威", "Li Ping-Wei", "Ping-Wei Li", "Pingwei Li", "kbs0830"],
      url: SITE_URL,
      image: `${SITE_URL}${encodeURI("/image/大頭貼.jpg")}`,
      email: EMAIL,
      jobTitle: "AI Engineer / Web Developer",
      description:
        "高雄出身的學生開發者，專注於 AI 工具應用與網頁開發。就讀國立高科大智慧商務系。",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Kaohsiung",
        addressCountry: "TW",
      },
      alumniOf: [
        {
          "@type": "CollegeOrUniversity",
          name: "國立高雄科技大學",
          alternateName: "National Kaohsiung University of Science and Technology",
        },
        {
          "@type": "HighSchool",
          name: "高雄市立中正高級工業職業學校",
          alternateName: "Kaohsiung Municipal Zhongzheng Vocational High School",
        },
      ],
      knowsLanguage: ["zh-TW", "en", "ja"],
      // Facebook 2026-11-05 依使用者要求先拿掉（頁面上也隱藏了），要恢復一起加回來
      sameAs: [GITHUB_URL, INSTAGRAM_URL],
      knowsAbout: ["Python", "FastAPI", "YOLOv8", "Next.js", "React", "TypeScript", "Machine Learning"],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "PINGWEI LI",
      inLanguage: "zh-Hant",
      author: { "@id": PERSON_ID },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="zh-Hant"
      className={`${fontVariables} h-full`}
      // globals.css 對 html 開了 smooth scroll；加這個 Next 換頁時才不會「慢慢捲」回頂端
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        {/* 在 hydration 前同步套用主題，避免先閃一次淺色再切換造成的 FOUC。
            讀不到 localStorage / matchMedia（例如被封鎖或不支援）一律 fallback 回淺色。 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('theme');var t=(s==='dark'||s==='light')?s:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`,
          }}
        />
        <JsonLd data={jsonLd} />
      </head>
      <body className="min-h-full flex flex-col">
        <WebVitals />
        {children}
      </body>
    </html>
  );
}
