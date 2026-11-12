"use client";

import { useEffect } from "react";
import MaintenancePage from "@/components/ui/MaintenancePage";

// Next 16.3 起用 retry（重新向伺服器要資料再 render）取代 reset（只重 render，暫時性的伺服器錯誤按了也救不回來）
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(
      `[error-boundary] ${new Date().toISOString()} digest=${error.digest ?? "n/a"} path=${window.location.pathname}`,
      error
    );
  }, [error]);

  return (
    <MaintenancePage
      onRetry={retry}
      errorMessage={process.env.NODE_ENV === "development" ? error.message : undefined}
    />
  );
}
