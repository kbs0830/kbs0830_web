# TODO — kbs0830_web

**2026-07-25 更新：** 收到一份外部 Portfolio review（5 個痛點），連同 UI/UX、SEO、
手機版、新技術升級一起整理進清單。每項標註：**⚙️ 可直接做**（不需等素材/決定，可直接
動工）或 **🙋 需要你**（卡在素材、外部帳號、或要你先拍板的決定）。

---

## 📋 外部回饋對照（2026-07 Portfolio review 5 痛點 → 現況與對應待辦）

| # | 回饋 | 現況 | 對應待辦 |
|---|---|---|---|
| 1 | 定位聚焦，不要泛泛的「學生開發者」 | Hero 副標與 `<title>`/OG 都是「学生開発者 · Claude × Gemini」 | 🔴 定位聚焦 |
| 2 | 專案寫量化成果，不要只列功能 | 只有 FoodLens 有（token 成本 ~300–1000×），其餘多是功能描述 | 🔴 專案量化成果 |
| 3 | 技術棧分類＋標熟練度 | **已完成大半**：5 組分類 accordion＋每個 chip 有 1–5 圓點熟練度，缺文字圖例說明圓點意義 | 🟠 熟練度圖例 |
| 4 | 每個專案附 GitHub 連結＋commit 乾淨 | 7 個作品 5 個有連結；FRC／自動跟隨機器人是實體硬體無 repo（詳細頁已註明） | 🟠 GitHub repo 品質 |
| 5 | RWD 不能跑位＋優化載入效能 | **2026-07-25 體檢完成**：全站 16 頁 × 4 斷點（360/390/768/1024）0 個跑版/橫向捲動；手機 Lighthouse Performance 74（跟桌機幾乎一致），A11y/BP/SEO 皆 100 | 🟠 LCP 決策點（沿用既有分析，這次用真實手機數據確認） |

---

## 🔴 高優先 — 內容 & 功能完整性

- [ ] **定位聚焦（回饋 #1）** 🙋 需要你先拍板
  Hero 副標（`HeroSection.tsx` 的 `SUBTITLE_TEXT`）與 `layout.tsx` 的 `<title>`／OG／
  Twitter title 目前都是「学生開発者 · Claude × Gemini」，HR 視角一眼看不出核心武器
  → 技術上改起來很快，卡在「定位是什麼」要你決定。候選方向：
    `Full-stack Developer · AI × Web`／`Frontend Developer`／`AI Application Developer`
  → 依你的背景（FastAPI/Flask 後端 + Next.js/React 前端 + YOLO/Gemini AI 應用）比較貼的
    是「Full-stack Developer · AI × Web」這類；`Claude × Gemini` 可以留作副註不用全刪
  → 決定後要同步改的地方：Hero 副標、`layout.tsx` title/OG/Twitter、Person JSON-LD 的
    `jobTitle`、`/resume` 頁、重跑 `pnpm resume:pdf`

- [ ] **專案量化成果（回饋 #2）** 🙋 需要你提供／確認真實數據
  → ⚠️ 原則同 blog：數據必須是真的量測過或真的發生過的，**不能為了好看編造**
  → 目前只有 FoodLens 有量化亮點（token 成本 ~300–1000×）
  → 可以往這些方向找真實數字（每一條都要你確認屬實或提供）：
    - 活動報名系統：實際處理過幾筆報名／售出幾張票、email 重試佇列救回幾封信
    - 日圓匯率：並行爬蟲 vs 逐一抓取的實測時間差、整合了幾家銀行資料源
    - FRC：名次本身已是量化成果，可補「隊伍規模」「開發週期」類背景數字
    - **自動跟隨機器人已完成（2026-07-26）**：使用者提供實際參賽的競賽作品說明書 PDF，
      補上真實硬體規格（AndyMark AM14U5 底盤＋AM0255 CIM 馬達 5310RPM、BTS-7960
      馬達驅動器 43A、Jetson Nano 4GB＋Logitech C270、YOLOv8 經 Roboflow 建立資料集
      訓練）與辨識/控制邏輯細節到 `projects.ts`，順便修正兩個先前不準確的描述：
      原本寫「Arduino 繼電器驅動底盤」其實是三次迭代後採用的 BTS-7960 H 橋驅動器，
      不是繼電器；tags 原本有 `Raspberry Pi` 但依說明書這個專案只用 Jetson Nano，
      沒有用到 Raspberry Pi（Raspberry Pi 是 FRC 那個作品的），已拿掉。同時因為現在
      有真實架構資訊，補上這個作品的 `architectureDiagram`（先前故意沒加，因為那時
      沒有足夠真實細節）
    - 本站自己也是作品：Lighthouse A11y/BP/SEO 三項 100、watchdog 異常 4 秒自動恢復、
      自架部署 pipeline——這些在 log／`LOG分析.md` 都有真實記錄可引用
  → 有數字後改 `projects.ts` 的 `highlightZh`／`detail`，並同步 `/resume` + 重跑 resume.pdf

- [x] **RWD 手機版全面體檢＋行動版 Lighthouse（回饋 #5）**——2026-07-25 完成
  → Playwright 對全站 16 個頁面（首頁、`/projects/[slug]`×7、`/blog` 列表＋3 篇文章、
    `/now`、`/uses`、`/resume`、404）在 360／390／768／1024 四個斷點各跑一次，共 64 組：
    **0 個橫向捲動／跑版**，`scrollWidth` 在所有組合下都沒超出 `clientWidth`
  → 順手抓到並修掉兩個真的問題（不是 RWD 本身，但體檢過程中發現）：
    1. 每一頁在每個斷點都有 React hydration mismatch console warning（`data-theme` 屬性）
       ——原因是 `layout.tsx` 的深色模式 inline script 在 hydration 前就直接改了
       `<html data-theme>`，這是文件裡明講的既有設計，只是少加了 `suppressHydrationWarning`；
       補上後 warning 全部消失，不影響任何行為
    2. 全站「← 返回OO」、GitHub repo 連結這類文字連結，實際可點擊高度只有 12–18px
       （在手機上偏難點準），加 `py-3 -my-3`（或 wrapper + `py-2 -my-2`）撐開點擊區域，
       不影響視覺間距
  → Lighthouse **mobile** 模式（之前只跑過桌機）：Performance 74（跟桌機幾乎打平，LCP
    6.8s vs 桌機 6.9s，根因跟桌機版記錄的一樣：Hero fade-in 動畫 delay + 102KB
    render-blocking CSS，見下面「LCP 決策點」）、**Accessibility 100 / Best Practices 100
    / SEO 100**，跟桌機版一致，代表之前的 WCAG 對比度修復在手機視窗下同樣有效
  → 還剩幾個非緊急的小 touch target（都在 WCAG 2.2 AA 的 24×24px 底線之上，只是沒到
    44×44 理想值），設計上是刻意的小圖示/文字連結，不擅自改視覺，列給你參考：
    NavBar 深色模式切換鈕／漢堡選單（32×32）、Portfolio「全部」篩選 chip（88×27）、
    About 時間軸項目點擊區（~37px 高）、Skills 分類 accordion 按鈕（~34px 高）
  → 縮圖 `sizes` 設定沒發現手機多抓桌機尺寸圖的問題，`next/image` 預設行為已經在處理

- [x] **GitHub Actions self-hosted runner 監控空缺**——2026-08-24 已實作，見下方
  「已完成」區塊

- [ ] **Google Search Console 註冊＋提交 sitemap（SEO 起手式）** 🙋 需要你的 Google 帳號
  → 目前完全不知道 Google 收錄了哪些頁、什麼關鍵字搜得到；GSC 是後續所有 SEO 動作的儀表板
  → 步驟：用 1394kbs@gmail.com 到 https://search.google.com/search-console 新增資源
    `kbs0830.com`（選 DNS 驗證，去 Cloudflare 加一筆 TXT 記錄即可）→ 提交
    `https://kbs0830.com/sitemap.xml`
  → 你註冊完之後我能接手的：查索引狀態、找出沒被收錄的頁面、看實際進站關鍵字再回頭調 metadata

- [ ] **作品集截圖 / Thumbnail**
  卡片純文字層次感偏低，加 thumbnail 後視覺差很多
  → 卡片本身這次才發現一直沒真的接上圖片顯示（`image` 欄位加了但只有詳細頁用到，
    卡片上完全沒畫面），已經補上（有 `image` 的作品卡片頂部會顯示縮圖，hover
    從淡灰階變全彩，沒有圖的維持原本純文字卡片）
  → 目前有真實圖片的：FRC 機器人（`frc-robot.jpg`，2026-07 使用者提供的機體照片，選了拍機器人本體、
    沒有拍到人臉的那張——原本提供的 5 張裡有 4 張是隊員合照/自拍，會拍到其他真人的臉，
    沒有事先確認過那些隊友是否同意公開露臉，先不用，只用了純機體照)、
    自動跟隨機器人（`auto-following-robot.jpg`，2026-07-26 使用者提供的 YOLOv8 辨識實測截圖，
    畫面是娃娃辨識框 + 螢幕上的程式碼，沒有真人臉孔）
  → **活動報名系統的卡片縮圖已依使用者要求移除**（見下方「活動報名系統」條目），
    目前有真實圖片的作品剩：FRC 機器人、自動跟隨機器人
  → 其餘 4 個作品缺截圖：FoodLens / 日圓匯率 / 記帳系統都是本機或已下線的服務，
    需要你自己跑起來截圖

**Demo 連結欄位已移除（2026-07 使用者確認「沒東西」）**：查過 YARTIX 的 `render.yaml`
沒有還活著的公開網址，而且是處理過真人報名/付款資料的系統本來就不該公開連過去；
FoodLens README 也沒提到 live demo。目前沒有安全可用的真實連結可以填，之後如果有新專案
有 live demo 再個別加，不留在這裡當常駐待辦。

---

## 🟠 中優先 — 技術品質

- [x] **技術棧熟練度文字圖例（回饋 #3 收尾）**——已完成，見下方「已完成」區塊
  （`AboutSection.tsx` 的 `ProficiencyDots` + 文字圖例）

- [ ] **GitHub repo 品質（回饋 #4 的另一半）** 🙋 改動在其他 repo
  → 站內連結部分已齊：5/7 作品有 GitHub 連結；FRC／自動跟隨機器人是實體硬體專案、
    沒有倉庫（詳細頁已誠實註明），不硬造空 repo
  → 剩下的是 repo 本身的門面：`FoodLens-Advisor`／`YARTIX-TICKETING-TEST` 的 README
    是否有截圖、架構圖、安裝步驟；commit 訊息是否乾淨有條理
  → 順手做：GitHub profile 把這兩個主力 repo **pin** 起來，讓人點進 kbs0830 第一眼就看到
  → 這些改動不在這份 codebase，要另外開工作處理（本機有憑證，技術上我可以協助）

- [x] **SEO 結構化資料擴充**——已完成，見下方「已完成」區塊
  （`/blog/[slug]` BlogPosting JSON-LD、`/projects/[slug]` BreadcrumbList JSON-LD）
  → 還沒做的收尾：GSC 註冊完後可用「複合式搜尋結果測試」驗證有沒有被吃到（卡在下面
    「Google Search Console 註冊」那項，需要你的 Google 帳號）

- [ ] **Blog 持續累積（SEO 長尾主力）** 🙋 要有真的踩過的坑才寫
  → 目前 3 篇。個人站被 Google 搜到的主力就是長尾技術關鍵字
  → 題材庫（全部是真實發生過、CLAUDE.md／log 有記錄可展開的）：
    Tailwind v4 `[--var]`→`(--var)` 全站 116 處踩坑、Task Scheduler wrapper 孤兒 process、
    pnpm v11 native build 限制、PowerShell 5.1 無 BOM 的 Big5 parse error、
    node.exe 無聲死掉 4 小時→自寫 watchdog 的過程
  → 一篇一篇來，寫之前跟我核對細節，不硬掰

- [ ] **Noto Serif JP 字體子集化** → 調查過，故意先不做，原因見下
  → 查了 build 產物：`next/font/google` 對 Noto Serif JP 其實已經自動切成 374 個
    `@font-face`（3 個字重 × 每個字重按 unicode-range 切成一百多塊），瀏覽器只會
    下載頁面上「實際出現的字」對應的那幾塊，不是整包 7.2MB 全下載，這部分已經是
    Google Fonts 內建幫你做掉的
  → 加 `text=` 參數會把這一百多塊壓成 1 塊更小的自訂子集，理論上更好，但實際試了發現
    這個字體不是只用在少數幾個固定的日文漢字標籤——`/projects/[slug]` 的 `<h1>`
    直接把 `project.titleZh`（動態、隨 `projects.ts` 增減專案而變）用這個字體渲染，
    其他 11 個檔案也有混用固定標籤跟動態內容。手動列一份「目前用到的字」的固定字元
    清單來 subset，之後你在 `projects.ts` 加新專案、標題用到清單外的字，就會悄悄
    fallback 到別的字體、你可能不會馬上發現——這種「現在測起來沒事，未來悄悄壞掉」
    的風險我不想在沒跟你確認前就引入，先維持現狀（Google Fonts 自動 unicode-range
    已經是合理的折衷）

- [ ] **部署通知**
  CI/CD 成功／失敗時發 Discord Webhook 或 LINE Notify，或直接寄 Email
  → 目前不知道遠端 build 有沒有炸
  → 若採 Email 通知，收件位址同上用 `otemon.pcwork@gmail.com`

- [ ] **Cloudflare 防火牆規則封鎖常見掃描路徑**
  → 2026-07 log 分析發現：10 天內 39% 的請求（7799 筆）是自動化漏洞掃描器打
    `/wp-admin`、`/.env*`、`/.git/config`、`/cgi-bin/luci` 這類路徑，全部正確
    404、沒有任何實際洩漏，屬於任何公開 IP 都會收到的網路背景雜訊，不是被鎖定攻擊
  → 加幾條 Cloudflare WAF/Firewall Rules 直接在邊緣擋掉這些已知路徑，能大幅減少
    log 雜訊、省一點頻寬，非緊急，詳見 `LOG分析.md` 第 2 節

- [ ] **零停機部署**
  → 2026-07 log 分析發現：20 次部署裡有 2 次在 Task Scheduler 重啟的瞬間交接空窗
    撞上少量請求，共 4 筆 500（占全部請求 0.02%），`verify-deploy.ps1` 每次都在
    重啟後立刻確認恢復正常，影響範圍很小
  → 目前架構（單一 process 給 Task Scheduler 直接管理）本來就無法完全避免這個
    空窗，要做到零停機需要雙 process 交替之類的架構改動，複雜度是否值得由你評估，
    詳見 `LOG分析.md` 第 3 節

---

- [ ] **首頁 LCP／Performance 決策點（回饋 #5 的效能面）** 🙋 等你拍板
  → 背景見「已完成」的 Lighthouse 項目：桌機 Performance 74，LCP 6.9s，兩個原因都查清楚了
  → **2026-07-25 補：行動版 Lighthouse 實測數字出來了**——Performance 74、LCP 6.8s，
    跟桌機幾乎一模一樣，代表這不是「手機比較慢」的問題，是同一組根因（動畫 delay ＋
    render-blocking CSS）在兩種裝置上都成立，不用再猜手機會不會更慘，數字已經拿到了
  → 選項 A：把 Hero 進場動畫的 delay/duration 縮短（例如 delay 全部 ≤0.2s、duration 0.4s），
    LCP 直接受益，但會削弱你明確要過的「gentle fade-in」質感——幅度可以先做給你看再決定
  → 選項 B：102KB render-blocking 全域 CSS 拆分（mobile Lighthouse 額外標出 ~100KB 未用到
    的 CSS、~49KB 未用到的 JS，量體對得上，不是新問題只是同一件事的更細數字）——牽動全站
    架構，工程大、風險高，不建議先動
  → 兩個選項都需要你拍板要不要犧牲設計/花力氣換分數，我不會自己選一邊動手

---

## 🧪 新技術升級評估

- [ ] **View Transitions**（Next.js `experimental.viewTransition`）⚙️ 可在分支試
  → 之前「頁面切換退場動畫」做不了的原因（`AnimatePresence` 要保留舊畫面、跟 App Router
    導覽模型打架）正是這個瀏覽器原生 API 要解的問題
  → 仍是 experimental flag，先開分支驗證效果與穩定性（含 Safari/Firefox 支援度），OK 再上正式站
- [ ] **React Compiler** — 優先度低
  → 自動 memoization，理論上可拿掉手動 `useMemo`/`useCallback`
  → 本站互動元件不多、HeroScene 已手動 useMemo 過，收益不確定；R3F 相容性要先查，先觀望
- [x] **Partial Prerendering（PPR）— 評估後不採用**（記錄結論免得之後重查）
  → 本站頁面幾乎全部 SSG，只有 2 個 API route 是動態的，沒有「靜態殼＋動態洞」的頁面
    形態，PPR 沒有適用場景

---

## 🟡 中低優先 — UX 升級

- [ ] **聯絡表單**
  EmailJS 或 Formspree，訪客直接在頁面輸入留言
  → 不是每個人都有郵件客戶端
  → 曾做過 mailto 版但使用者覺得不需要，已移除；要做的話等你申請 EmailJS/Formspree 帳號再說

- [ ] **圖片燈箱（Lightbox）**
  專案詳細頁截圖點擊後放大，支援鍵盤左右切換
  → 自製或用 yet-another-react-lightbox（輕量）
  → **2026-07-26 更新**：活動報名系統的截圖已依使用者要求移除，目前有真實截圖的
    剩 FRC 機器人、自動跟隨機器人兩個，其餘要等「作品集截圖」那項補上圖片才有意義，先跳過

---

## 🟢 低優先 — 加分 & 個性

- [ ] **Analytics（Umami 自托管）**
  Docker 部署，隱私友好，無 cookie banner
  → 了解哪個 section 被看最久、哪個作品被點最多
  → 需要在桌機決定要不要跑 Docker、佔用資源，這個部署決定要你來拍板，先跳過

- [ ] **多語言路由（i18n）**
  `/ja`、`/zh` 路由，Next.js App Router i18n
  → 針對日本訪客完整日文版
  → 規模大（每頁都要日文全文翻譯＋路由架構），且跟目前「中文優先」語言方針要先對齊，先跳過，之後想做再開新的討論

- [ ] **開源貢獻 section**
  若有 PR 合併到外部 repo，GitHub API 自動拉取展示
  → 未來加分項
  → 抓「合併到別人 repo 的 PR」需要 GitHub Search API + 篩選邏輯，且要先確認你有沒有這類 PR 可展示，先跳過

- [ ] **GitHub README 同步**
  `kbs0830/kbs0830` profile README 設計與個人網站風格統一
  → 進 GitHub 主頁也有一致體驗
  → 這個改的是另一個 repo（`kbs0830/kbs0830`），不在這份 codebase 裡，先跳過

---

## ✅ 已完成

- [x] **2026-08-24：GitHub Actions self-hosted runner 存活監控**
  → 背景：2026-07-25 曾發現 `GitHubActionsRunner` 這個工作排程器任務顯示 `Ready`，但
    實際接工作的 `Runner.Listener.exe` 進程已經無聲掛掉，`push` 到 main 都不會觸發
    自動部署，是手動查 GitHub Actions 頁面卡在 `queued` 才發現
  → 併進現有 `scripts/watchdog.ps1`，跟網站健康檢查共用同一個 `kbs0830_Watchdog`
    5 分鐘排程，不另開新的 Task Scheduler 任務：每次執行順便 `Get-Process -Name
    Runner.Listener` 確認進程還在，沒偵測到就 `Stop-ScheduledTask`/`Start-ScheduledTask`
    重啟 `GitHubActionsRunner`，5 秒後再確認一次；一樣只在異常/重啟/恢復時寫
    `logs/watchdog.log`，健康時不寫
  → 網站檢查跟 runner 檢查各自獨立判斷，互不影響對方要不要重啟，只共用最終的
    `$exitCode`
  → PowerShell parser 語法檢查過（`[System.Management.Automation.Language.Parser]::
    ParseFile`）沒有錯誤，BOM 編碼確認保留（`efbbbf` 開頭，避免 PowerShell 5.1 用
    Big5 讀檔炸掉，見上方「PowerShell script 編碼注意事項」），也現場確認過這台機器上
    `Runner.Listener` 進程名稱、`GitHubActionsRunner` 工作排程器任務名稱都對得上
    （目前 runner 正常在跑，沒有觸發過重啟邏輯，還沒有真的異常情境驗證過重啟路徑）

- [x] **2026-08-24：重複程式碼收斂（Eyebrow / TagBadge）**
  → 派 agent 掃過 `src/components/`、`src/app/` 找逐字重複的 UI 標記（`statusColor`／
    GitHub·Moon·Sun icon 這幾組先前已經收斂過，見 `icons.tsx`／`projects.ts`），找到兩組
    還沒處理的：
    1. 標題上方的小標籤（mono 字體、寬字距、uppercase，例：`About`／`Blog`／`404`／
       `技能 · Skills`）在 9 個檔案共 13 處逐字重複，只有外層 margin class 不同
       → 抽成 `src/components/ui/Eyebrow.tsx`，接受 `className` 覆蓋 margin
    2. tag/skill 徽章 `<span>` 樣式在 4 個檔案逐字重複
       → 抽成 `src/components/ui/TagBadge.tsx`
    改動的檔案：`blog/page.tsx`、`blog/[slug]/page.tsx`、`uses/page.tsx`、`now/page.tsx`、
    `not-found.tsx`、`MaintenancePage.tsx`、`projects/[slug]/page.tsx`、
    `PortfolioSection.tsx`、`ContactSection.tsx`、`AboutSection.tsx`；純重構、行為沒變，
    `tsc --noEmit`／eslint／`next build`／`pnpm test:unit`／`pnpm test:e2e` 全部跑過確認
    （e2e 裡 `keyboard-shortcuts.spec.ts` 的 1/2/3 跳轉那條第一次平行跑時因為 viewport
    timing 花了超過 5 秒判定失敗，單獨重跑秒過，是既有的 flaky 案例，跟這次改動無關，
    這次沒動任何 scroll/id 邏輯）
  → **這次探索過程中額外發現、判斷不值得現在動的近似重複**（記錄下來，不是遺漏）：
    - `AboutSection.tsx` 內部的技能/城市 pill 徽章樣式在同一檔案出現 3-4 次近似（不完全
      相同，有 dashed border 變體），同檔案內重複、風險較低，先不動
    - `HeroSection.tsx` inline 重寫了 `ContactSection.tsx` 裡已經抽出來的 `Underline`／
      `linkClass` 底線 hover 效果，兩處目前各自維護；要真的共用需要把這兩個從
      `ContactSection.tsx` 搬到 `components/ui/`，屬於中風險、要判斷值不值得的改動
    - `RevealHeading.tsx`／`FadeIn`（AboutSection）／`TimelineItem`／`ProjectCard`／
      `SectionLabel`（PortfolioSection）／ContactSection 都各自重新實作一份
      `useInView + motion.div` 淡入包裝，margin/delay/位移量都不同，屬於「相似但不同參數」
      而非逐字重複，硬收斂成單一 `useFadeInView` 需要吞掉這些差異，先不做
    這三項如果之後要處理，屬於「要判斷、可能改變一點寫法」的中風險重構，不是這次
    「逐字重複、零風險」的範圍，需要你評估要不要花時間

- [x] **2026-07-25：技術棧熟練度圖例 ＋ SEO 結構化資料擴充 ＋ RWD 手機體檢**（見上面回饋
  對照表跟各自條目的詳細記錄，這裡只記重點）
  → Skills 區塊加文字圖例（`●●●●● 熟練 Proficient` / `●●○○○ 学習中 Learning`），
    復用既有的 `ProficiencyDots` 元件，不是重做一套
  → `/blog/[slug]` 加 BlogPosting JSON-LD、`/projects/[slug]` 加 BreadcrumbList JSON-LD
  → **這次順手做的動作比原本規劃的大**：跑 RWD 體檢時你在中途提醒 YARTIX 去識別化沒做完
    （見下一條），修完後為了讓行動版 Lighthouse 反映當天所有改動，跑了一次
    `next build` 並用 Task Scheduler 安全重啟正式站對齊——代表這次 session 修的東西
    （去識別化、hydration warning、touch target、SEO 結構化資料等）現在已經是
    **kbs0830.com 正式站在跑的版本**，但這些改動目前只存在於工作目錄，**還沒 git commit
    也沒 push**。正式站的程式碼跟 GitHub main branch 目前不同步，之後任何一次
    `git push` 到 main 觸發的 CI/CD 都會用 repo 裡的版本覆蓋掉現在正式站跑的這份——
    內容相同所以不會變差，但如果你打算先手動改點別的東西再 commit，要注意目前線上
    跑的已經是超前 git 一個版本的狀態，建議儘快 commit + push 讓兩邊對齊
- [x] YARTIX 去識別化 & 改名為「購票系統」
  → **2026-07-25 補追：原本只做了一半。** `titleZh`／`descriptionZh` 早就改成「購票系統」，
    但英文 `title` 欄位（`"YARTIX Ticketing"`）跟詳細頁 intro 文字裡的真實客戶名稱
    「台灣鐵道文化意象 TWRIC」其實一直還在，會顯示在作品卡片副標題、詳細頁副標題、
    分頁 `<title>` 標籤／SEO metadata 上——這次全部清乾淨，同時把 URL slug
    `yartix-ticketing` → `ticketing-system`、圖片檔名 `yartix.png` →
    `ticketing-system.png`，`next.config.ts` 加 301/308 redirect 保留舊網址（避免已收錄的
    舊網址直接變 404）
  → **2026-07-26 補：詳細頁的連結文字已改成「原始碼 · Source Code」**（`src/app/projects/
    [slug]/page.tsx`），不再把 `project.github.replace("https://", "")` 這種會直接印出
    repo 完整路徑的寫法當連結文字——不管 repo 實際叫什麼名字，畫面上都不會顯示
  → **2026-07-26 再補：使用者要求進一步去識別化。**
    1. `github` 欄位暫時清空（`""`）——卡片跟詳細頁的 GitHub 按鈕在 repo 改名前直接不顯示，
       徹底不留 href 可以 hover／複製連結看到舊 repo 名稱這條路
    2. 移除卡片縮圖與詳細頁截圖（`image` 欄位拿掉，`public/image/projects/
       ticketing-system.png` 已刪除）
    3. 顯示名稱從「購票系統 / Ticketing Platform」改成更中性的「活動報名系統 /
       Event Registration System」（`titleJa` 同步改成「イベント受付システム」），
       不再直接對應原產品「Ticketing」的命名
  → **還沒做完，需要你動手（我這台機器沒裝 `gh` CLI，且這是外部系統，不會自己動）**：
    GitHub repo `kbs0830/YARTIX-TICKETING-TEST` 這個名稱本身還在。到 repo → Settings →
    改名（不要用專案代號類名稱，用純技術性描述，例如 `flask-registration-api` 這類），
    GitHub 會自動幫舊網址做 redirect，不用擔心壞連結，改完告訴我新名稱，我把
    `src/lib/projects.ts` 的 `github` 欄位填回去，GitHub 按鈕才會重新出現
- [x] 麵包店電商網站移除
- [x] FRC 機器人加入作品集（2023 全國冠軍聯盟）
- [x] 時間軸加入 About（2021–2026）
- [x] 頭像 `public/image/大頭貼.jpg`
- [x] Hero 副標題 → `学生開発者 · Claude × Gemini`
- [x] 狀態卡：大二、交通運輸興趣、開発環境
- [x] 社群：Facebook + Instagram
- [x] Contact 按鈕版型統一（4 顆同尺寸）
- [x] 自動跟隨機器人加入作品集（2024 全國佳作）
- [x] SEO meta tags 更新
- [x] 技能補充：Jetson Nano、Raspberry Pi、OpenCV、Arduino
- [x] Footer `© 2026 PINGWEI LI`
- [x] 響應式優化（Hero CTA 堆疊、section padding）
- [x] NavBar active section 高亮（IntersectionObserver）
- [x] NavBar 行動端漢堡選單（drawer 展開）
- [x] Scroll progress bar（頂端 2px accent 細線）
- [x] 3D 場景行動端停用（< 768px 改顯示 CSS 漸層）
- [x] Hero 初始閃白修正（dynamic loading fallback）
- [x] 返回頂端按鈕（BackToTop）
- [x] OG 社群預覽圖（opengraph-image.tsx 動態生成）
- [x] HeroScene 效能修正（useMemo）
- [x] ProjectCard hover lift（hover:-translate-y-1）
- [x] 時間軸 dot 依序出現（per-item stagger animation）
- [x] Skills tag hover（hover accent border + text）
- [x] Favicon 自訂（icon.tsx，PL 靛藍）
- [x] prefers-reduced-motion 支援（globals.css）
- [x] 鍵盤 focus-visible 樣式（globals.css）
- [x] Email 複製回饋（clipboard + 已複製！toast）
- [x] 暗色模式（CSS variable + localStorage toggle）
- [x] icon.tsx + opengraph-image.tsx + BackToTop 從舊分支移植
- [x] 刪除舊分支（master、fix/layout-width-og-image）
- [x] About section 加入「足跡 · Footprint」— 已到訪國家（日本／泰國／香港／美國）與規劃中（韓國／新加坡／馬來西亞／越南）
- [x] 自訂 404 頁面（`not-found.tsx`，日式風格，帶回首頁按鈕）
- [x] Security Headers（`next.config.ts` 加 X-Frame-Options、X-Content-Type-Options、Referrer-Policy、Permissions-Policy）
- [x] favicon.ico 清除（改用 icon.tsx，擴充 32/192/512 三種尺寸）
- [x] Error Boundary for R3F（HeroScene 加 SceneErrorBoundary，WebGL 崩潰時 fallback 到 CSS 漸層）
- [x] Twitter / X Card meta tag（layout.tsx metadata）
- [x] 專案 Tag 篩選（Portfolio section filter bar）
- [x] Hero 副標動態打字效果（Framer Motion staggerChildren typewriter）
- [x] Hero 3D 場景互動（隨游標位置微微傾斜，尊重 prefers-reduced-motion）
- [x] Skills 分類可展開 / 收合（accordion，預設展開第一組）
- [x] About 時間軸 hover 展開更多細節（含鍵盤 Enter/Space）
- [x] Skills 熟練度視覺化（1–5 點細小圓點指示）
- [x] Print / PDF 樣式（`@media print`，A4 履歷格式）
- [x] 頁面 Loading 骨架屏（呼應 Hero 3D 場景的稀疏細線骨架屏）
- [x] Scroll-triggered 文字逐字揭示（About / Portfolio / Contact 標題）
- [x] 磁吸按鈕效果（Magnetic Button，Hero CTA + Contact 連結）
- [x] 自訂滾動條樣式（Firefox scrollbar-color / scrollbar-width）
- [x] PWA Manifest（`src/app/manifest.ts`）
- [x] `/now` 頁面
- [x] `/uses` 頁面
- [x] GitHub 貢獻熱力圖（ghchart.rshah.org 嵌入）
- [x] Keyboard Shortcuts（G / E / 1-2-3 快速跳轉，`?` 呼出提示浮窗）
- [x] 彩蛋：Konami Code（↑↑↓↓←→←→BA 觸發全螢幕彩蛋）
- [x] 彩蛋：終端機模式（`` ` `` 叫出偽終端機）
- [x] 時區 / 現地時間顯示（Footer 高雄 + 福岡雙時區，每 30 秒更新）
- [x] Spotify 正在聽（SpotifyNowPlaying 元件 + `/api/spotify/now-playing` route，Client Secret + refresh token 已補齊）
- [x] Husky + lint-staged（commit 前自動跑 lint-staged `eslint --fix` + 全專案 `tsc --noEmit`）
- [x] Renovate Bot（`.github/workflows/renovate.yml`，用現有 self-hosted runner 跑 Renovate CLI，
  不需安裝 GitHub App，每週一自動開 PR，不自動合併）
- [x] 訪客來源統計小工具（Footer，自己刻的，不用 Clustrmaps：讀 Cloudflare Tunnel 自動帶的
  `cf-ipcountry` header，只聚合國家層級次數存 `data/visitor-stats.json`，不記 IP；
  `/api/visitor-stats` 吐彙總資料，`VisitorStats.tsx` 顯示「共 N 次造訪 · 來自 M 國 + 前 5 名國旗」）
- [x] LOG 分析（見 `LOG分析.md`）：10 天 log 顯示應用層 0 錯誤、20 次部署全成功；發現並修好
  訪客統計被偽裝瀏覽器 UA 的掃描器污染的問題（改成前端執行 JS 後才 POST 回報計數，
  不執行 JS 的掃描器從根本上排除，不再只靠容易被繞過的 UA 黑名單）
  → 順帶一提：`/api/visitor-stats/route.ts` 的 Turbopack NFT over-trace build 警告當時
    以為修好了，後來加了 POST handler（多了 `fs.readFileSync`/`writeFileSync`/`mkdirSync`）
    warning 又跑出來，`turbopackIgnore` 註解只蓋到那一行 `path.join`，沒有全面解決；
    不影響這個專案的部署方式（沒用 `output: standalone`），純粹是 build log 裡的雜訊，
    先不繼續花時間
- [x] 專案詳細頁 `/projects/[slug]`（App Router 動態路由，`generateStaticParams` 全站
  7 個作品都 SSG 出獨立頁面）——內容來自實際 clone `kbs0830/school`、
  `kbs0830/FoodLens-Advisor`、`kbs0830/YARTIX-TICKETING-TEST` 三個 repo 讀到的真實
  README/原始碼，不是編造的；FRC 機器人／自動跟隨機器人沒有原始碼倉庫（實體硬體專案），
  詳細頁維持原本卡片上就有的內容，沒有虛構新細節。YARTIX 附真實截圖（`www.png`）。
  卡片改成整張可點擊（overlay `<Link>` + GitHub icon 保留獨立可點）
  → 開發時抓到一個真的會讓「每一個」slug（包括合法的）都變成 404 的 bug：Next 16 的
    `params` 是 `Promise`，一開始沒 `await` 就直接讀 `.slug`，SSG 出來的每一頁
    `.meta` 都寫著 `"status": 404`，本機沒有真的用瀏覽器點過去測絕對不會發現——
    純打字檢查跟 `next build` 的 TypeScript 檢查都沒抓到這個，是實際 `curl` 每個
    路徑確認 200 才抓到的
- [x] 404 頁面排版統一（跟 `/uses`、`/now`、`/projects/[slug]` 這幾個 standalone page
  共用同一套排版：左上角「← 返回首頁」小連結、mono 標籤、serif 標題，不再是整頁垂直
  置中＋一顆突兀的實心大按鈕）——用 Playwright 實際跑 production build 截圖（亮/暗、
  桌機/手機）比對過，不是只看程式碼猜
- [x] Bundle Analyzer（`pnpm analyze`）
  → 一開始裝了 `@next/bundle-analyzer`，結果它官方明講不支援 Turbopack（這專案 build
    預設就是走 Turbopack），只會印警告、不產生報表，裝了等於沒用，已經移除。改用
    Next 16 內建的 `next experimental-analyze`（互動式 treemap，預設 port 4000）
  → 最大的 chunk 確實是 Three.js + @react-three（884KB，第二名的兩倍多），但已經是
    `HeroSection.tsx` 用 `next/dynamic({ssr:false})` 動態載入、手機版完全不載入的
    狀態，不是沒做過優化；試過把 `HeroScene.tsx` 的 `import * as THREE` 改成具名
    import（只引入實際用到的 7 個 class），重新 build 比對位元組數完全沒變化——
    Turbopack 對這個套件的 tree-shaking 已經做得夠好，具名 import 沒有實際幫助，
    只是保留下來當比較好的寫法。這顆 chunk 的大小本質上就是「用 R3F 做 3D 背景」
    這個決定要付的成本，已經是目前架構下能做的最大程度延遲載入，要再更小需要換掉
    R3F（大改，不在這次範圍內）
- [x] 頁面切換動畫（`src/app/projects/[slug]/template.tsx`，進入詳細頁 fade + slide-up）
  → App Router 沒有原生穩定支援退場動畫的方式（`AnimatePresence` 要保留舊畫面到動畫
    結束才卸載，跟 App Router 的導覽模型會打架），只做進場動畫，沒做 TODO 原本寫的
    「退場」那半段
- [x] Lighthouse 全站跑一次（`npx lighthouse`，production build，桌機模式）
  → 修之前：Performance 74 / Accessibility 96 / Best Practices 100 / SEO 100
  → 修之後：Performance 74（原因見下，故意先不動）/ **Accessibility 100**
    / Best Practices 100 / SEO 100
  → 真的抓到並修好 3 個 WCAG AA 對比度不足的問題：
    1. `LocalClock.tsx`／`VisitorStats.tsx`（Footer）用 `text-(--border)` 當文字顏色——
       `--border` 是設計給邊框線用的極低對比色，拿來當文字對比度只有 1.37:1（需要
       4.5:1），暗色模式下幾乎看不見，改成 `text-(--muted)`
    2. Portfolio tag 篩選 active 狀態在暗色模式對比度 4.32:1，差一點點沒過 4.5:1，
       把 `globals.css` 暗色模式的 `--accent` 從 `#5b8fc7` 微調到 `#6295cc`（色差小到
       肉眼幾乎看不出來，只有這一個 token，改動範圍最小）
    3. GitHub 熱力圖 `<img>` 沒有 `width`/`height`，補上（663×104，實際查 SVG 回應
       header 取得的真實尺寸），順便加 `h-auto` 維持比例
  → Performance 沒動的原因（決策點，等你回覆）：LCP 量到 6.9s、分數只有 0.07，
    細查 `lcp-breakdown-insight` 抓到 LCP 元素是 Hero 副標下面那段英文介紹文字，
    「element render delay」高達 1.75s——直接原因是 Hero 那組 `fadeUp` 進場動畫
    本身的 `delay`(0.1~0.6s 不等) + `duration`(0.8s)，這段文字要等動畫播完才算
    「視覺上完成渲染」，跟 CLAUDE.md 設計原則明講的「gentle fade-in」是同一件事的
    兩面；另外還有一個 102KB 的全域 CSS 檔案是 render-blocking，量到浪費 1.5s，
    這是 Tailwind 把全站（含終端機彩蛋、Konami 彩蛋、列印樣式等）所有用到的
    utility class 都打包進同一個透過 root layout 載入的 `globals.css` 的架構性代價，
    要拆分需要更大幅度的 CSS 架構調整。這兩個都不是我想在沒問過你之前就動的東西——
    前者要削弱你已經明確要的動畫效果，後者是牽動全站的架構改動，都先停在這裡等你
    決定要不要犧牲設計/花更大力氣換 Performance 分數
- [x] Uptime 監控（使用者自己申請 UptimeRobot 帳號完成，每 5 分鐘檢查
  `https://kbs0830.com`）——這步驟需要外部帳號，我沒辦法代辦，是使用者自己完成的
  → 記得確認 Alert Contact 收件信箱設成 `otemon.pcwork@gmail.com`（自動通知專用），
    不是 `1394kbs@gmail.com`（真人聯絡用），我這邊看不到帳號設定沒辦法直接確認
- [x] Playwright E2E 測試（`e2e/*.spec.ts`，`pnpm test:e2e`）——測了 NavBar 捲動變色、
  NavBar 錨點連結、Email 複製 toast、暗色模式切換＋重新整理後記住選擇，4 個測試，
  本機跑過 dev/production build 都過。開發時有一個測試（捲動變色）用完整套件平行跑
  會偶發失敗、單獨跑不會，改用 `window.scrollTo` 取代 `mouse.wheel` 後穩定重跑 3 次
  都過，不是邏輯錯誤只是事件模擬時機的問題
  → CI 沒有塞進 `deploy.yml`（那是已經很小心調過的正式站部署關鍵路徑），另外開一個
    `.github/workflows/e2e.yml` 平行跑，測試結果只是給你看的訊號，失敗不會擋掉部署
  → ⚠️ 副作用記錄：這次為了測這個跟前面 Lighthouse/Bundle Analyzer，在這個資料夾
    （就是正式站 Task Scheduler 服務在跑的同一份）反覆執行了好幾次 `next build`，
    中間有一次跟正在跑的正式站 process 的 build 對不上，watchdog 在 11:31 抓到
    一次 chunk 500（4 秒內自動重啟恢復，訪客應該沒感覺到），細節見
    `logs/watchdog.log`。以後這種需要反覆本機 build 測試的工作，要嘛做完馬上重啟
    正式站對齊，要嘛換一份獨立目錄跑，不要讓正式站在同一份目錄上跟著我的測試 build
    一起震盪
- [x] 作品卡片縮圖顯示 + FRC 機器人真實照片（`frc-robot.jpg`，使用者提供的 5 張裡只選了
  沒拍到人臉的機體照）
- [x] 專案架構圖（簡單版）：`src/components/ui/MermaidDiagram.tsx`（動態 import mermaid，
  不拖慢其他頁面），4 個有真實詳細資料的作品（FoodLens、活動報名系統、日圓匯率、記帳系統）
  各加一張 Mermaid flowchart，內容整理自已經寫好的 `detail.sections`，不是新編的細節。
  FRC／自動跟隨機器人／school 沒有足夠真實架構資訊可畫，沒有加
  → **2026-07-26 補：自動跟隨機器人也補上了**——使用者提供了實際參賽的競賽作品說明書
    PDF，裡面有完整的辨識/控制流程圖與硬體規格，不再是「沒有足夠真實資訊」的狀態，
    已經照說明書內容加上 `architectureDiagram`。FRC／school 依然沒有足夠真實架構資訊，
    維持不加
- [x] 技術部落格 `/blog`（`next-mdx-remote/rsc` + `gray-matter`，`content/blog/*.mdx`）——
  3 篇文章，內容是這次 session 真的踩過的坑：Next.js `params` 變 `Promise` 的 404 陷阱、
  訪客統計被機器人污染的除錯過程、Lighthouse 抓到的 3 個 WCAG 對比度問題，不是編造內容。
  Footer 加一個不顯眼的 `Blog` 連結（`/now`、`/uses` 至今都沒有站內連結能點到，這次
  額外幫 blog 加一個，因為 TODO 原本寫的動機是 SEO，完全沒人連得到會浪費這個動機）
- [x] 履歷 PDF 下載：`/resume` 頁面（教育／技能／作品，全部取自網站上已有的真實資料，
  沒有新編造任何經歷），`scripts/generate-resume-pdf.js` 用 Playwright 印成
  `public/resume.pdf`（A4，套用 `@media print` 樣式），Contact section 加下載按鈕。
  內容之後如果改了（教育、技能、作品異動）要記得重跑 `pnpm resume:pdf` 更新 PDF，
  不會自動同步
