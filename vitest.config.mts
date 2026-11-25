import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
      // Next 內建處理 server-only（不用裝套件）；vitest 不是 Next，指到 Next 附的空模組
      "server-only": path.resolve(import.meta.dirname, "./node_modules/next/dist/compiled/server-only/empty.js"),
    },
  },
});
