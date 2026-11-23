---
name: kbs-ops
description: kbs0830_web 部署與維運全文：Cloudflare Tunnel 架構、www 導向、桌機排程服務（kbs0830_NextJS／Cloudflared／Runner／Watchdog）、CI/CD 雙槽部署與退回、Renovate、Watchdog 監控與 Email 通知、提醒信、週報、Search Console、備份與還原演練、Log、維修模式、手動啟動、區網 DNS。碰 scripts/*.ps1、.github/workflows、deploy、server.js、排程工作、Cloudflare 設定，或網站掛掉／部署失敗／收到告警信時先讀。
---

## 部署架構

**Live URL:** https://kbs0830.com

```
訪客 → Cloudflare CDN → Cloudflare Tunnel → localhost:3000（Next.js）
```

ISP 封鎖 inbound port 80/443，改用 Cloudflare Tunnel（outbound）繞過。

**www 導向（2026-11-02 才真正生效）**：Cloudflare Dashboard → Rules → Overview 用範本
「Redirect from WWW to root」建的（Request URL `https://www.*` → `https://${1}`，301，保留 query
string），`https://www.kbs0830.com/blog?x=1` → 301 `https://kbs0830.com/blog?x=1`。9 月文件寫的
那條 Redirect Rule 其實從來沒存成功（11/02 打開 Rules 頁是空的）——改 Cloudflare 設定後一定要
`curl -sI` 看到 301 才算數，不要只看 dashboard。`http://www.` 還要等「Redirect from HTTP to HTTPS」
範本 Deploy 才會通（見 TODO.md）。以下是 9 月的原始調查，根因分析仍然正確：

**2026-09 發現：`www.kbs0830.com` 在 Google Search Console 被回報 404。** 根因是 DNS
上 `www.kbs0830.com` 是有效的 proxied 記錄（跟裸網域指向同一組 Cloudflare anycast IP），但
`~/.cloudflared/config.yml` 的 ingress 規則只寫了 `kbs0830.com` 一條、其餘一律
`http_status:404`——任何打到 `www.kbs0830.com` 的請求會在 Cloudflare Tunnel 這一層直接被
404，根本傳不到 Next.js（`https://www.kbs0830.com/` 和 `http://www.kbs0830.com/` 都中）。

**9 月當時的修法（實際沒存成功，11/02 改用上面的範本）**：Custom filter expression
`http.host eq "www.kbs0830.com"` → Dynamic 目標 `concat("https://kbs0830.com", http.request.uri.path)`，
301，**Preserve query string 開關要手動打開**（預設關閉）。在 edge 層把 www 導去裸網域，沒有動
`config.yml`——網站唯一的正式網址只有不帶 www 的 `kbs0830.com`（`layout.tsx`／`sitemap.ts`／
`robots.ts` 全部只用這個），www 只需要導回去，不需要真的服務內容。

跟上面 Task Scheduler 的 `ExecutionTimeLimit` 一樣，**這個 Redirect Rule 只存在 Cloudflare
帳號的 dashboard 設定裡，不在任何 repo 檔案內、也不會被 git pull 或部署動到**——換帳號或
重建 DNS/Tunnel 設定時要記得手動補這條規則。已在 Search Console 對該筆「找不到網頁」issue
按「已修正 (Validate Fix)」，等 Google 重新檢索確認解除。

### 桌機服務（開機自動啟動）

| 服務 | 管理方式 |
|---|---|
| Next.js (port 3000) | 工作排程器 `kbs0830_NextJS`，開機觸發、S4U，Action **直接**執行 `node.exe scripts\server.js` |
| Cloudflare Tunnel | Windows 服務 `Cloudflared`（binPath 必須帶 `tunnel --config ... run`，見下） |
| GitHub Actions Runner | 工作排程器 `GitHubActionsRunner`，位於 `C:\actions-runner` |
| 健康監控 | 工作排程器 `kbs0830_Watchdog`，每 5 分鐘執行 `scripts\watchdog.ps1` |

**cloudflared 只有一份：`C:\Program Files (x86)\cloudflared\`（winget 管、MSI）**。2026-11-21 之前服務跑的是另一份 WinGet 免安裝版
（`cloudflared --version` 看到的是 PATH 上的這份、不是服務的，11/09 因此誤報版本），當天把服務切過來、舊的移除。
升級用 `scripts/upgrade-cloudflared.ps1`（管理員執行：停服務 → winget 升級 → 服務指到最新那份 → 啟動 → 外網確認）。

**這些服務的設定統一由 `scripts/setup-autostart.ps1` 建立（要用系統管理員 PowerShell 跑）。**
2026-10-15 查到「開機自動啟動」其實一直沒做到：`Cloudflared` 服務 binPath 沒帶任何參數（空轉），
真正扛流量的是 `start-server.bat` 開的 console 版 cloudflared；Watchdog／Runner 是
InteractiveToken（沒登入就不跑）；72 小時上限也還在（見下方 Log 章節）。
**2026-11-02 已由使用者用管理員視窗跑完並回查**：NextJS／Runner 是 `PT0S` + S4U、Watchdog
是 S4U，`Cloudflared` 服務帶 `tunnel --config ... run` 參數在跑，關掉 console 版 cloudflared
後網站照常 200。當時遇到兩個坑：舊的空轉 Cloudflared 卡在 `STOP_PENDING`（腳本的
`Restart-Service` 會無限等，要 `taskkill /f /fi "SERVICES eq Cloudflared"` 再 `Start-Service`）；
改 Runner 登入方式會把它停掉，要手動 `Start-ScheduledTask GitHubActionsRunner`，不然 push
的部署會一直排隊。
**2026-11-06 第一次真的冷開機驗證過**（停電後完整重開）：沒登入，NextJS／Runner 開機 20 秒內就起來，
`Cloudflared` 是**延遲自動啟動**，開機約 2 分 20 秒才跑——這段期間 localhost 200、外網 530 是正常的，
不要以為 Tunnel 壞了。整次停站約 3 分鐘。⚠️ 桌機開著「快速啟動」：開始選單的「關機」其實是半休眠，
開機後 process 都是舊的、BootTrigger 不會觸發（`LastBootUpTime` 不變就是這種）；要完整關機用
Shift＋關機、`shutdown /s /t 0` 或「重新啟動」。
**⚠️ 這個 session（Claude Code）沒有管理員權限**，`Set-ScheduledTask`／`sc config` 都會
Access denied——不要自己跑完就以為改好了，要請使用者用管理員視窗執行，跑完再用
`schtasks /query /tn <name> /xml` 回查 Settings 真的有 `ExecutionTimeLimit>PT0S`。

Task Scheduler 的 Action：
```
Program:   C:\Program Files\nodejs\node.exe
Arguments: "C:\Users\user\Desktop\kbs0830_web-master\scripts\server.js"
```

`scripts/server.js` 是包了 request/error log 的自訂 production server（programmatic Next.js API，非 `next start` CLI），
log 寫在 `logs/server.log`（超過 5MB 自動轉存 `.log.1`）。

**重要：Action 必須直接執行 node.exe，不可以透過任何 wrapper（vbs / cmd / start "..." 分離啟動）。**
實測驗證過：只要中間多一層 wrapper process（即使是同步、不 detach 的 `.cmd`），Task Scheduler 的 `schtasks /end` /
`Stop-ScheduledTask` 也只會殺掉它「直接」啟動的那層，不會往下砍掉 wrapper 的子行程（node.exe）——node.exe 會變成殺不掉的孤兒。
唯有 node.exe 本身就是 Task Scheduler 直接追蹤的那個 process，stop/start 才會每次都準確生效。
（根源：2026-07 曾發生 build 已更新但實際在跑的舊 process 沒被换掉 → 瀏覽器抓到的 JS chunk 404/500 → 頁面全白，詳見 git log）

### CI/CD

push 到 `main` → GitHub Actions self-hosted runner → `scripts/deploy.ps1`（pull + build + restart + 健康檢查）全自動。
Workflow: `.github/workflows/deploy.yml`；手動部署 `deploy.bat` 呼叫同一份 script，避免兩邊邏輯各自維護、慢慢長歪。

**雙槽部署＋自動退回（2026-11-03）**：
- build 槽 `.next-a`／`.next-b` 輪流用。`data/next-dist-dir.txt` 記目前上線的是哪一槽，
  `scripts/server.js` 啟動時讀它設 `NEXT_DIST_DIR`，`next.config.ts` 的 `distDir` 讀這個變數（沒設＝`.next`）
- 部署：build 到**沒在線上**那槽（線上照常服務，build 失敗完全不影響）→ 改指標檔 → 重啟 → 健檢；
  健檢沒過就指回原本那槽再重啟（`[ROLLBACK]`），然後寄信。停站 1～2 秒（原本 5～40 秒）
- 部署 build 用 `tsconfig.deploy.json`（每次從 `tsconfig.json` 複製、gitignore）：Next 會把
  `<distDir>/types` 自動寫進 tsconfig 的 include，寫在副本裡才不會弄髒 `tsconfig.json`
- **為什麼不用「build 到暫存資料夾再改名成 `.next`」**：第一版就是這樣，結果 `Rename-Item` 一直
  Access denied——VS Code 的 TypeScript 服務會監看 tsconfig 收進去的 `<distDir>/types`，Windows 上
  子資料夾有 handle 時上層不能改名。雙槽完全不搬資料夾
- 驗證退回：`powershell -File scripts\deploy.ps1 -TestRollback`（切過去後故意當成健檢失敗）
- `pnpm-lock.yaml` 跟上次成功 install 的雜湊（`node_modules/.deploy-lock-hash`）不同才 install；
  install 前要停站（Windows 鎖 native `.node` 檔），這種部署停站時間是 install + build
- 部署成功後：`/resume` 內容來源（`src/app/resume`、`lib/about.ts`、`lib/projects.ts`、`globals.css`、
  `app/fonts.ts`）跟上次部署（`data/last-deployed-commit.txt`）比有變，就自動重印 `public/resume.pdf`
  並 commit + push（會再觸發一次部署，那次只改到 PDF，不會再印）

**桌機 push 認證（2026-11-03）**：正式站目錄 `origin` 的 **fetch 是 https、push 是 SSH**
（`git remote set-url --push`），`core.sshCommand` 指定只用 `C:/Users/user/.ssh/kbs0830_web_deploy`
這把無密碼金鑰，對應 GitHub repo 的 Deploy key `desktop-claude-push`（只限這個 repo、有寫入權限）。
Claude session 讀不到 GCM 的互動式登入，靠這把才能自己 push。pull 刻意留 https（公開 repo 不用認證），
CI 的 `git pull` 完全不受影響。撤銷：GitHub repo Settings → Deploy keys 刪掉即可。
⚠️ 這兩個設定在 `.git/config`，不進版控，重新 clone 要重設。

重啟一律透過 Task Scheduler（`Stop-ScheduledTask` / `Start-ScheduledTask`），不要直接 `taskkill /im node.exe`
——理由同上，且直接 taskkill 對這個 process 會 access denied（scheduled task 用較高權限啟動）。

重啟後會自動跑 `scripts/verify-deploy.ps1`：確認首頁 200、內容正常、且首頁引用的 JS chunk 真的載得到（200）。
只要有任何一項不過，CI/deploy.bat 會直接顯示失敗，不會再悄悄留著壞掉的網站沒人發現。

### 依賴更新（Renovate）

`.github/workflows/renovate.yml`：用現有 self-hosted runner 直接跑 Renovate CLI（`npx renovate`），
每週一自動開 PR，**不需要**安裝 Renovate GitHub App，也**不會**自動合併——PR 開出來後要手動
review、本機跑一次 build 確認沒問題再合併。設定檔在 `renovate.json`（extends `config:recommended`，
minor/patch 更新會被分到同一個 PR 減少雜訊）。`packageRules` 擋住已知會壞的大版本：`typescript <6.1`
（TS 7 讓 typescript-eslint 崩潰）、`@types/node <25`（對齊桌機的 Node 24）——上游支援／桌機升級
Node 時記得回來拿掉或調整。

### 健康監控（Watchdog）

**背景：** 2026-07-09 深夜 `node.exe` 無聲死掉（沒有 reboot、沒有 exception log——推測是被強制砍掉或
native-level crash），但 Cloudflare Tunnel 完全正常，持續把流量轉去一個已經沒人聽的 origin，
導致訪客看了近 4 小時的 "connection refused" 都沒人發現。`scripts/watchdog.ps1` 補上這個監控空缺：

- 工作排程器 `kbs0830_Watchdog` 每 5 分鐘執行一次
- 呼叫 `scripts/lib/health-check.ps1` 的 `Test-SiteHealth`（跟 `verify-deploy.ps1` 共用同一份邏輯，只維護一份）
- 檢查失敗 → 透過 `Stop-ScheduledTask` / `Start-ScheduledTask` 重啟 `kbs0830_NextJS`（同一套安全重啟方式，見上方
  「Action 必須直接執行 node.exe」的說明），重啟後再檢查一次
- 只有「異常 / 重啟 / 恢復」才會寫進 `logs/watchdog.log`，健康時不寫，避免每 5 分鐘一筆灌爆 log
- 重啟後仍然異常 → log 記錄 `[FAILED] ... 需要人工介入`，代表 watchdog 自己修不好，要手動查

**2026-08-24 補上第二個監控空缺：GitHub Actions self-hosted runner 存活檢查。**
2026-07-25 曾發現 `GitHubActionsRunner` 這個工作排程器任務雖然顯示 `Ready`，但實際負責
接工作的 `Runner.Listener.exe` 進程已經無聲掛掉，導致 `git push` 到 main 都不會觸發自動
部署，是手動查 GitHub Actions 頁面卡在 `queued` 才發現、手動 `Start-ScheduledTask` 重啟
才復活。跟網站健康檢查性質一樣（都是「Task Scheduler 工作顯示正常但底下的 process 其實
死了」），所以併進同一支 `watchdog.ps1`、共用同一個 5 分鐘排程，不另外開新的 Task
Scheduler 任務：
- 每次執行順便用 `Get-Process -Name Runner.Listener` 確認進程還在
- 沒偵測到 → `Stop-ScheduledTask` / `Start-ScheduledTask` 重啟 `GitHubActionsRunner`，
  5 秒後再確認一次進程是否出現
- 一樣只在異常/重啟/恢復時寫 log，健康時不寫；重啟後仍抓不到進程 → `[FAILED]` 記錄
  需要人工介入
- 網站檢查跟 runner 檢查各自獨立判斷、互不影響對方的重啟邏輯，只有兩者共用同一個
  `$exitCode`（任一項最終失敗，腳本就以非 0 結束，方便之後如果要接 Task Scheduler
  的失敗通知）

**Email 通知（2026-11-03，`scripts/lib/notify.ps1`）**：以下狀況寄信，收寄件都是
`otemon.pcwork@gmail.com`（Gmail SMTP + 應用程式密碼）：
- `deploy.ps1` 失敗（每次都寄，附這次部署的 log 尾巴）；下一次部署成功會補一封「已恢復」
- watchdog 網站自動重啟成功（冷卻 1 小時，讓「曾經掛過」這件事被看見）
- watchdog 網站／runner 重啟後還是壞（冷卻 1 小時，不會每 5 分鐘一封）；恢復時補一封
- 帳密在 `.env.local` 的 `ALERT_SMTP_USER` / `ALERT_SMTP_PASS`（`ALERT_EMAIL_TO` 選填，預設寄給自己）。
  **沒設定就不寄、只在 log 寫 skipped，不影響部署/監控本身**
- 為什麼放 `.env.local` 而不是 Windows 認證管理員／`Export-Clixml`：watchdog 是 S4U 身分執行，
  沒有使用者的 DPAPI 金鑰，解不開那兩種加密
- 冷卻狀態檔在 `data/alerts/<key>.last`（檔案存在＝已通知、尚未恢復）
- 腳本是 Windows PowerShell 5.1 跑的：**不能用 `??`、`?.`、三元運算子**這些 PS 7 語法
- 測試寄信：`powershell -NoProfile -Command ". .\scripts\lib\notify.ps1; Send-AlertMail -Subject 測試 -Body 測試"`

**提醒信（2026-11-05，`scripts/reminders.ps1` ＋ repo 根目錄 `reminders.json`）**：使用者要「自動 mail 提醒」TODO 裡有日期的事。
watchdog 每輪呼叫，日期（＋`time`，預設 09:00）到了就寄一封到 otemon，每則只寄一次（`data/alerts/reminder-<id>.sent`），
關機錯過會補寄；寄不出去不記已寄、下一輪再試。`check` 欄位在信裡附即時檢查：`web-vitals`（p75）、`http-redirect`
（已生效就寫「不用做了」）。**TODO 新增有日期的使用者待辦時，順手在 `reminders.json` 加一筆**。實測過 S4U 身分寄得出去。

**每週週報（2026-11-09，`scripts/weekly-report.ps1`）**：watchdog 每輪呼叫，週一 09:00 後寄一封（這週寄過就跳過，關機錯過開機補寄）。
內容：Cloudflare 7 天（跟前一週比）、真人造訪／未過濾流量增加多少（這兩份只存累計，跟上次寄信的快照 `data/weekly-report-state.json` 相減）、
首頁 Web Vitals p75、部署成功／失敗／退回次數、watchdog 重啟次數。`-DryRun` 只印不寄。
**Google 搜尋（2026-11-17，TODO C4）**：`scripts/lib/search-console.js`（Node，PS 5.1 讀不了 PEM 私鑰沒辦法簽 JWT）抓點擊／曝光／排名＋前 5 字詞／頁面，
再把 sitemap 每個網址丟 URL Inspection API 查收錄（**API 沒有「已建立索引總數」**，只能逐頁查；每天 2000 次配額）。
金鑰＝服務帳號 JSON，放 `C:\Users\user\.kbs0830-gsc-key.json`（不進 repo、有進每日備份），`.env.local` 的 `GSC_KEY_FILE` 指過去；
沒設就 skipped、這段不顯示。token scope 只有 `webmasters.readonly`。搜尋字詞只進信、不存檔。單元測試 `search-console.test.ts`
⚠️ PowerShell 地雷（寫的時候踩到）：`$home` 是內建唯讀變數不能拿來用；`-like "*[ROLLBACK]*"` 的方括號是萬用字元，要用 `.Contains()`。

**每季備份還原演練（2026-11-09，`scripts/restore-drill.ps1`）**：watchdog 帶 `-IfOlderThanDays 90` 呼叫。從 GitHub **重新 clone**
備份 repo（不用 D: 那份 clone）→ 解密 → 解壓 → 跟 D: 最新一份逐檔比 SHA256，成功失敗都寄信；失敗隔天重試（信 1 天冷卻）。
第一次 11/09 手動跑過：17 個檔案全部相同。上次演練時間在 `D:\02_備份封存\專案\kbs0830\last-restore-drill.txt`。

**外網檢查（2026-11-03）**：localhost 健康時，watchdog 再從外網打一次 `https://kbs0830.com/`
（30 秒內重試）。2026-10-29 那次是 origin 正常、Tunnel 斷 4 天，localhost 檢查完全看不出來。
失敗只寄信（key `tunnel`），不自動重啟 Cloudflared：一般權限重啟不了服務，服務本身也有當機自動重啟。
**連續兩輪（間隔 5 分鐘）都失敗才寄信（2026-11-13）**：第一輪失敗只寫 `[WARN]`＋`data/alerts/tunnel.pending`（15 分鐘內有效）。起因是 11/13 01:46 Tunnel 慢了一分鐘，一輪失敗就寄了「掛了」＋「恢復」兩封。
`health-check.ps1` 的 chunk 檢查也分開了：拿到 404／500 馬上判失敗（build 對不上），沒拿到狀態碼（逾時）才在期限內重試，原因寫「逾時」

若要暫停監控（例如要手動除錯、不想被自動重啟打斷）：
```powershell
Disable-ScheduledTask -TaskName "kbs0830_Watchdog"
# 恢復：
Enable-ScheduledTask -TaskName "kbs0830_Watchdog"
```

### 自動備份（2026-11-03，`scripts/backup.ps1`）

watchdog 每 5 分鐘呼叫一次 `backup.ps1 -IfOlderThanHours 24`，超過 24 小時沒成功備份才真的跑
（不另開排程工作：建排程要管理員權限）。備份「不在 git 裡、壞了會真的不見」的東西：
`.env.local`、`~/.cloudflared/`（tunnel 憑證）、`~/.kbs0830-gsc-key.json`（Search Console 服務帳號，週報用）、`data/visitor-stats.json`、`data/web-vitals.json`、`.git/config`（push 設定）、
deploy/watchdog/backup log、三個排程工作的 XML、Cloudflared 服務設定。

| | 位置 | 格式 | 保留 |
|---|---|---|---|
| 本機 | `D:\02_備份封存\專案\kbs0830\<yyyy-MM-dd_HHmm>\` | 原檔 | 30 份 |
| GitHub | 私有 repo `kbs0830/kbs0830_backup`，clone 在 `D:\02_備份封存\專案\kbs0830\github` | AES-256 加密的 `kbs0830-backup.tar.gz.enc` | git 歷史 |

- D: 是另一顆實體硬碟（C: NVMe、D: Seagate HDD），C: 壞掉時本機備份還在
- **2026-11-23 本機備份從 `D:\Backups\kbs0830` 搬到 `D:\02_備份封存\專案\kbs0830`**（使用者整理 D: 槽：專案備份都放這層，跟 FRC 同一層）。路徑寫在 `backup.ps1`、`restore-drill.ps1` 的 `$backupRoot`，兩支要一起改；路徑有中文，兩支都要維持 UTF-8 BOM（PowerShell 5.1 跑）。
  搬完兩支都實際跑過（備份＋GitHub push、還原演練 21 檔相同）。搬的時候注意：只要 `last-success.txt` 先不見，watchdog 下一輪（5 分鐘）就會多跑一次備份
- 加密金鑰：`C:\Users\user\.kbs0830-backup-key`，同一份複製在 `D:\02_備份封存\專案\kbs0830\BACKUP-KEY.txt`。
  **整台機器壞掉時兩份都會不見，使用者要另外存在密碼管理器**，不然 GitHub 那份解不開
- GitHub 那份 2026-11-05 啟用：`D:\02_備份封存\專案\kbs0830\github` 是 clone，`core.sshCommand` 指定 Deploy key
  `C:/Users/user/.ssh/kbs0830_backup_deploy`（只限這個 repo、有寫入權限）。不是 clone 時只做本機（log 會寫）。
  啟用當天實測過 GitHub 下載 → 解密 → 解壓，跟 D: 那份逐檔相同
- 本機那份完成就算「今天備份過」，GitHub 失敗只寄信、隔天再試（避免 watchdog 每 5 分鐘重跑、
  多出一堆本機資料夾把好的備份擠掉）
- 還原 GitHub 那份（Git Bash，Git 內建 openssl）：
  ```bash
  openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -in kbs0830-backup.tar.gz.enc -out backup.tar.gz -pass file:<金鑰檔>
  mkdir restore && tar -xzf backup.tar.gz -C restore
  ```
  排程工作 XML 用管理員 `schtasks /create /tn <名稱> /xml <檔案>` 匯回去

### Log

| 內容 | 位置 |
|---|---|
| Server 端 request/error log | `logs/server.log`（`scripts/server.js` 寫入，5MB 自動輪替） |
| 部署紀錄 | `logs/deploy.log`（`scripts/deploy.ps1` 寫入，manual + CI 共用） |
| 健康監控紀錄 | `logs/watchdog.log`（`scripts/watchdog.ps1` 寫入，僅記錄異常/重啟/恢復事件，5MB 自動輪替） |
| 前端 render 錯誤 | 瀏覽器 console（`error.tsx` / `global-error.tsx`，含 timestamp + digest + path） |

`logs/` 不進版控（見 `.gitignore`），只存在桌機本地。所有 log 的 5MB 輪替邏輯統一在
`scripts/lib/logger.ps1` 的 `Write-TimestampedLog`（`deploy.ps1` / `watchdog.ps1` 共用；`server.js` 是
Node 環境，邏輯獨立實作但規則一致）。

**⚠️ 2026-10-15：下面寫的修復當時沒有真的套用上去。** 10/07、10/10、10/13 依然每 72 小時被砍
（watchdog 5 分鐘後救回），`schtasks /xml` 查到 Settings 裡沒有 `ExecutionTimeLimit`（= 預設
PT72H）。推測 9 月是在非管理員視窗跑 `Set-ScheduledTask`，失敗了沒注意到。現在改由
`scripts/setup-autostart.ps1`（管理員執行）統一設定，見上方「桌機服務」（2026-11-02 已確認生效）。

**2026-08 發現、2026-09 定位：整站每隔約 3 天無回應一次，根因不是 memory leak，
是 Task Scheduler 的預設 72 小時執行時間上限。** 原本懷疑 Next.js 16.x 的 server-side
`fetch()`/stream memory leak，已將 Next.js 升級到 16.3.1 並在 `scripts/server.js` 加了
`MEM ...` 診斷 log（每 30 分鐘記一次 `process.memoryUsage()` + uptime），但升級後問題依舊
發生，比對 `MEM` log 發現 crash 前記憶體數字根本沒有持續往上漲（在 47～50MB 之間打轉了
整整 3 天才 crash，不是漸進式耗盡）——排除 leak 假說。

真正根因：`kbs0830_NextJS` 和 `GitHubActionsRunner` 這兩個排程工作在建立時都沒有取消勾選
Windows Task Scheduler 精靈的預設選項「如果工作執行超過：3 天」，即
`Settings.ExecutionTimeLimit = PT72H`。工作跑滿 72 小時後被 Task Scheduler **強制砍掉**，
跟程式健不健康、有沒有洩漏完全無關；`server.log` 的 `uptime` 也證實 crash 是瞬間發生（`MEM`
數字沒有爬升趨勢），而且是精準卡在 72 小時整。這也解釋了為什麼網站跟 GitHub Actions
runner 兩個「無關」的服務總是同時故障——它們用的是同一個 `PT72H` 預設值，同時被砍。
`watchdog.log` 對這類 crash **完全沒有記錄**（不是 watchdog 救回來的），代表原本文件裡「3～4
秒自動恢復」的說法其實是另一批不同性質的雜訊事件（見下段），兩者被誤判成同一個問題。

修復：把兩個工作的 `ExecutionTimeLimit` 改成 `PT0S`（無限制）：
```powershell
$s1 = New-ScheduledTaskSettingsSet -ExecutionTimeLimit ([TimeSpan]::Zero) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Set-ScheduledTask -TaskName kbs0830_NextJS -Settings $s1
Set-ScheduledTask -TaskName GitHubActionsRunner -Settings $s1
```
這個設定不在任何一支 repo 內的腳本裡建立（兩個工作都是手動用 GUI/命令建立的），純粹活在
桌機的 Task Scheduler 設定裡，不會被 git pull 或部署覆蓋，**但也不會被這份文件同步**——
以後如果要在別台機器上重建這兩個排程工作，記得手動把這個上限拿掉，不要重蹈覆轍。

`scripts/server.js` 裡的 `MEM` 診斷 log 予以保留（診斷過程證明它有用，且成本低），但
**不要**再假設它是為了追蹤 memory leak；現在它單純是通用的健康度觀察數據。

### 維修模式（2026-11-12，`scripts/maintenance.ps1`）
- `powershell -File scripts\maintenance.ps1 -On "原因"`／`-Off`／不帶參數看狀態。寫 `data\maintenance.flag`，**不用重啟**：
  `scripts/server.js` 每個請求看它在不在，在的話頁面回 503＋維修頁（琥珀色分頁圖示、顯示原因、HTML 跳脫過）
- 只擋頁面：`/_next/`、`/api/`、`/status/`、有副檔名的照常放行——Cloudflare 快取裡的頁面維修中照常給、還會來要 JS
- watchdog 看到 flag 就不檢查網站／外網、不自動重啟、不寄「網站掛了」；**開超過 12 小時寄信提醒**，關掉補一封
- GitHub 外部監控（uptime.yml）看到 503＋`kbs0830-maintenance` 標記算正常
- ⚠️ **測試維修模式不能直接建 `data\maintenance.flag`**：正式站讀的是同一個檔案，會真的進入維修。
  測試用 `MAINTENANCE_FLAG=<暫存檔> PORT=3200 node scripts/server.js`

### 手動啟動

```powershell
# 跑過 setup-autostart.ps1 之後開機就會自己起來，這支只留給手動拉起服務用
# （Cloudflared 服務還沒設定好時，會退回舊做法在前景開一個 cloudflared）
start-server.bat

# 手動部署（pull + build + restart + 健康檢查）
deploy.bat
```

### 區網存取問題

區網內裝置需將 DNS 改為 `8.8.8.8` 才能解析 `kbs0830.com`（路由器 DNS 快取問題）。

