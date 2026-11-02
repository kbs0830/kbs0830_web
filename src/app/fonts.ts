import { Geist, Geist_Mono, Noto_Serif_JP } from "next/font/google";

// layout.tsx 跟 global-error.tsx 共用同一份宣告：兩邊各寫一次的話，Next 會產生兩份
// @font-face CSS，global-error 那份每頁都被 preload 卻用不到（Noto Serif JP 一份就 280KB），
// console 會出現「preloaded but not used」警告。
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

export const fontVariables = `${geistSans.variable} ${geistMono.variable} ${notoSerifJP.variable}`;
