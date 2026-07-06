"use client";

import { useEffect } from "react";
import { Geist, Geist_Mono, Noto_Serif_JP } from "next/font/google";
import MaintenancePage from "@/components/ui/MaintenancePage";
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

// global-error 取代整個 root layout，需要自帶 <html>/<body> 與字型
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(
      `[global-error-boundary] ${new Date().toISOString()} digest=${error.digest ?? "n/a"} path=${window.location.pathname}`,
      error
    );
  }, [error]);

  return (
    <html
      lang="zh-Hant"
      className={`${geistSans.variable} ${geistMono.variable} ${notoSerifJP.variable} h-full`}
    >
      <body className="min-h-full">
        <MaintenancePage
          onRetry={reset}
          errorMessage={process.env.NODE_ENV === "development" ? error.message : undefined}
        />
      </body>
    </html>
  );
}
