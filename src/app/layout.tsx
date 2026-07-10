import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Serif_JP } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["300", "400"],
});

const notoSerifJP = Noto_Serif_JP({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PINGWEI LI — 学生開発者 · Portfolio",
  description: "高雄出身的學生開発者，專注於 AI 工具應用與網頁開發。就讀國立高科大智慧商務系，使用 Claude & Gemini 構建 AI × Web 専案。",
  metadataBase: new URL("https://kbs0830.com"),
  alternates: { canonical: "/" },
  openGraph: {
    title: "PINGWEI LI — Portfolio",
    description: "高雄出身的學生開発者，專注於 AI 工具應用與網頁開發。",
    url: "https://kbs0830.com",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PINGWEI LI — 学生開発者 · Portfolio",
    description: "高雄出身的學生開発者，專注於 AI 工具應用與網頁開發。",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "PINGWEI LI",
  alternateName: "李秉威",
  url: "https://kbs0830.com",
  email: "1394kbs@gmail.com",
  jobTitle: "AI Engineer / Web Developer",
  description:
    "高雄出身的學生開發者，專注於 AI 工具應用與網頁開發。就讀國立高科大智慧商務系。",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Kaohsiung",
    addressCountry: "TW",
  },
  sameAs: [
    "https://github.com/kbs0830",
    "https://www.facebook.com/tra0830",
    "https://www.instagram.com/pingwei_0830/",
  ],
  knowsAbout: ["Python", "FastAPI", "YOLOv8", "Next.js", "React", "TypeScript", "Machine Learning"],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="zh-Hant"
      className={`${geistSans.variable} ${geistMono.variable} ${notoSerifJP.variable} h-full`}
    >
      <head>
        {/* 在 hydration 前同步套用主題，避免先閃一次淺色再切換造成的 FOUC。
            讀不到 localStorage / matchMedia（例如被封鎖或不支援）一律 fallback 回淺色。 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('theme');var t=(s==='dark'||s==='light')?s:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
