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
    description: "高雄出身的學生開達者，專注於 AI 工具應用與網頁開發。",
    url: "https://kbs0830.com",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="zh-Hant"
      className={`${geistSans.variable} ${geistMono.variable} ${notoSerifJP.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
