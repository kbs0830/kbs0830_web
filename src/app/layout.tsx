import type { Metadata } from "next";
import { fontVariables } from "./fonts";
import { EMAIL, FACEBOOK_URL, GITHUB_URL, INSTAGRAM_URL, SITE_URL } from "@/lib/site";
import JsonLd from "@/components/ui/JsonLd";
import "./globals.css";

export const metadata: Metadata = {
  title: "PINGWEI LI — 学生開発者 · Portfolio",
  description: "高雄出身的學生開発者，專注於 AI 工具應用與網頁開發。就讀國立高科大智慧商務系，使用 Claude & Gemini 構建 AI × Web 専案。",
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },
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

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "PINGWEI LI",
  alternateName: "李秉威",
  url: SITE_URL,
  email: EMAIL,
  jobTitle: "AI Engineer / Web Developer",
  description:
    "高雄出身的學生開發者，專注於 AI 工具應用與網頁開發。就讀國立高科大智慧商務系。",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Kaohsiung",
    addressCountry: "TW",
  },
  sameAs: [GITHUB_URL, FACEBOOK_URL, INSTAGRAM_URL],
  knowsAbout: ["Python", "FastAPI", "YOLOv8", "Next.js", "React", "TypeScript", "Machine Learning"],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="zh-Hant"
      className={`${fontVariables} h-full`}
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
