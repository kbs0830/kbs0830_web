import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  // 全部測試共用同一個 next dev server，worker 開太多（預設 = CPU 核心數）只會互搶
  // dev 的即時編譯，加上 React Compiler 後更明顯，計時類測試（Konami 彩蛋自動消失、
  // 換頁）會開始隨機失敗。3 個在這台機器上實測穩定。
  workers: 3,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3100",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "node node_modules/next/dist/bin/next dev -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
