---
name: kbs-testing
description: kbs0830_web 測試規則全文：Playwright E2E（gotoReady、port 3100 留給 CI、workers 3、a11y 掃描、現有測試清單）、Vitest 單元測試（Git Bash 報 reading 'config' 要改用 PowerShell 跑）、正式站目錄裡 next build 的注意事項。寫或改 e2e/*.spec.ts、src/**/*.test.ts，或要跑測試、看 a11y 失敗原因時先讀。實際起 3200 驗證流程見 kbs-test-3200。
---

### E2E 測試（Playwright）

`e2e/*.spec.ts`，`pnpm test:e2e` 執行（`playwright.config.ts` 會自動起一個 `next dev`
在 port 3100，跑完關掉；本機開發中已經有 dev server 在跑的話會直接重用，不會衝突）。
`workers: 3` 是刻意的：全部測試共用一個 dev server，開 React Compiler 之後 dev 首次編譯變慢，
worker 開到預設的 CPU 核心數會讓計時類測試隨機失敗（production build 平行跑是穩定的）。
**每個測試都用 `e2e/helpers.ts` 的 `gotoReady(page, path)`，不要直接 `page.goto`**：`load` 事件
不代表 React hydration 完成，goto 完馬上按鍵/點擊，事件會比監聽器先到、直接被丟掉（開 trace 時
頁面變慢，就會穩定重現）。`gotoReady` 等的是 `KeyboardShortcuts` 掛好監聽後在 `<html>` 加的
`data-hydrated`。
**本機用 port 3100 跑 `next start` 測 production build 時**，重新 build 之前一定要先把舊的
`next start` 關掉——舊 process 會拿舊 manifest 去讀新的 `.next`，所有 chunk 都 500（跟 2026-07
正式站那次同一個原因），測試結果完全不能看。
⚠️ 關 3100 時**不要**用 `Get-NetTCPConnection -LocalPort 3100 -State Listen`：Windows 會把
`next start` 的 dual-stack socket 回報成 `Closed`，`-State Listen` 什麼都抓不到、等於沒關（2026-11
因此一個舊 server 活了十分鐘，新 build 測起來全 500，還誤以為是重構壞掉）。用
`Get-NetTCPConnection -LocalPort 3100 | Select -Expand OwningProcess -Unique | % { Stop-Process $_ -Force }`，
起完再確認 `OwningProcess` 是自己剛起的那個 PID。另外 CI 的 `e2e.yml` 也在這台桌機用 3100。
**⚠️ Claude 手動測試（`next start` 看畫面、截圖）一律用 3200，3100 留給 CI**：2026-11-09 手動開的 3100 server 沒關，
同時段 push 觸發的 CI E2E 開不起自己的 server，連續失敗、寄了一堆失敗通知給使用者。用完一定要關。
目前測：作品卡片 → 詳細頁換頁（View Transition 後標題可見）、NavBar 捲動變色、NavBar 錨點連結、Email 複製 toast、暗色模式切換＋重新整理
後記住選擇、終端機模式（`` ` `` 呼出、指令輸出、clear/exit）、鍵盤快捷鍵（`?` 提示浮窗、
`1/2/3` 跳轉、isTyping 防呆）、Konami Code 彩蛋、About 分頁（點擊／方向鍵切換、收起來的內容仍在 HTML）、
Hero 名字滑鼠解碼（reduced-motion 時不播）、首頁 WebGPU 版的玩法（`hero-webgpu.spec.ts`，真顯卡，見 Hero 章節）、本名不在畫面上（`privacy.spec.ts`）、分享卡片跟著頁面走＋文章分享圖＋RSS（`share-meta.spec.ts`）、
sitemap 每個網址都 200（`sitemap.spec.ts`）、**無障礙（`a11y.spec.ts`，2026-11-09）**：axe-core 掃 8 頁 × 淺色／深色，
WCAG A／AA 只擋 serious／critical；首頁 About 每個分頁都切過去掃（沒選到的面板是 hidden，axe 看不到）。
⚠️ 第一次跑就抓到全站「灰字 `text-(--muted)` 再疊 `opacity-50/60/70`」對比不足（約 20 處）——**灰字不要再加 opacity**（包括灰字裡面的子元素 `<span className="opacity-60">`，第一輪只搜同一行漏掉了 `/stats` 的百分比，CI 用真實資料才抓到），
要更淡的層次用字級；深色架構圖的線上標籤底色（`mermaid-config.ts` 的 `edgeLabelBackground`）；Hero 副標的 `<p aria-label>`
（`<p>` 不能放 aria-label，改 `sr-only` 文字＋打字動畫 `aria-hidden`）`TerminalMode.tsx` 的輸出區塊有一個
`data-testid="terminal-output"`，純粹是給這批測試定位用的——輸出文字（例如「PINGWEI
LI」）會跟 Hero/About 既有內容撞字，`getByText` 會抓到多個元素，用 testid 才能精準
scope 到終端機自己的輸出。CI 是獨立的 `.github/workflows/e2e.yml`，push 到 main 時跟
`deploy.yml` 平行跑，**不會**擋部署——`deploy.yml` 是已經很小心調過的正式站部署關鍵路徑
（見上方「Action 必須直接執行 node.exe」），E2E 測試本身跑瀏覽器比較慢也比較容易不穩，
故意不掛在同一條 pipeline 上，測試結果純粹是給你看的訊號。`e2e.yml` 自己有一步
`git pull origin main`（跟 `deploy.ps1` 同一招），不依賴 `deploy.yml` 先跑完就先幫忙把
working directory 同步到最新 commit，兩個 workflow 誰先跑都測得到對的版本。

### 單元測試（Vitest）

`src/**/*.test.ts`，`pnpm test:unit` 執行（`vitest.config.mts`，node 環境、`@/*` alias
跟 `tsconfig.json` 對齊）。⚠️ Claude 的 Git Bash 有時會讓**所有**測試檔都報
`Cannot read properties of undefined (reading 'config')`（0 tests）——環境問題不是程式壞掉，改用 PowerShell 跑就正常（2026-11-12）。跟 Playwright 分開維護：Vitest 測純函式跟 API route 的邏輯
分支，不需要真的開瀏覽器。目前測：
- `src/lib/content/blog.ts` 的 `getAllPosts()`／`getPostBySlug()`——直接讀 `content/blog/*.mdx`
  真實文章，不 mock fs（三篇文章目前 date 剛好都相同，正好覆蓋排序 comparator 對
  「相同日期」的處理）
- `src/lib/travel/aircraft.ts` 的 `formatFlightCode()`——原本這段「代碼 → 代碼(機型)」的格式化
  邏輯是寫死在 `AboutSection.tsx` 裡的一行 inline expression，沒東西可以獨立測，抽成
  export function 之後才有辦法補單元測試，行為完全沒變
- `src/app/api/visitor-stats/route.ts`——用 `VISITOR_STATS_FILE` 環境變數指到暫存檔
  + `vi.resetModules()` 隔離每個測試，蓋掉 bot UA 過濾、read-modify-write 累加、
  XX（無法辨識國家）不計入 summarize 這些分支，不會動到正式的 `data/visitor-stats.json`
- `src/app/api/spotify/now-playing/route.ts`——`vi.stubGlobal("fetch", ...)` mock 掉
  對 Spotify API 的呼叫，蓋掉環境變數缺漏／token 失效／正在播放／fallback 到最近播放／
  網路錯誤這幾個分支

**正式站目錄裡跑 `next build`（2026-11 起）**：正式站跑的是 `.next-a`／`.next-b`（見「CI/CD」雙槽部署），
手動 `next build` 只會寫 `.next`，**不再影響線上**，可以在這裡 build + `next start -p 3100` 測。
（2026-07 正式站還直接用 `.next` 時，在這裡連續 build 曾讓線上 process 的 build 對不上、chunk 500。）
例外：`pnpm install` 還是會動到線上在用的 `node_modules`，不要在這裡手動跑，交給 deploy.ps1。

