"use client";

import { useEffect } from "react";
import MaintenancePage from "@/components/ui/MaintenancePage";
import { fontVariables } from "./fonts";
import "./globals.css";

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
      className={`${fontVariables} h-full`}
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
