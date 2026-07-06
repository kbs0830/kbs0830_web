"use client";

import { useEffect } from "react";
import MaintenancePage from "@/components/ui/MaintenancePage";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(
      `[error-boundary] ${new Date().toISOString()} digest=${error.digest ?? "n/a"} path=${window.location.pathname}`,
      error
    );
  }, [error]);

  return (
    <MaintenancePage
      onRetry={reset}
      errorMessage={process.env.NODE_ENV === "development" ? error.message : undefined}
    />
  );
}
