// 重新產生 public/resume.pdf。
//
// /resume 頁面的內容改了（教育、技能、作品）之後要重跑這支腳本，PDF 不會自動更新——
// 它是「印出來的一張快照」，不是即時渲染的頁面。
//
// 前提：本機（或這台桌機）已經有 Playwright 的 chromium 瀏覽器可以用
// （跑過 `npx playwright install chromium` 或本來就因為其他用途裝過），
// 且要有一個跑得起來的 server 可以連（本機 `next dev`，或桌機本來就在跑的正式站）。
//
// 用法：
//   node scripts/generate-resume-pdf.js                          # 預設打 http://localhost:3000
//   node scripts/generate-resume-pdf.js http://localhost:3100    # 指定其他 URL

const path = require("path");
const { chromium } = require("playwright");

const baseUrl = process.argv[2] || "http://localhost:3000";
const outputPath = path.join(__dirname, "..", "public", "resume.pdf");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`${baseUrl}/resume`, { waitUntil: "networkidle" });
  await page.emulateMedia({ media: "print" });
  await page.pdf({
    path: outputPath,
    format: "A4",
    printBackground: true,
    margin: { top: "15mm", bottom: "15mm", left: "15mm", right: "15mm" },
  });
  await browser.close();
  console.log(`已產生 ${outputPath}`);
})();
