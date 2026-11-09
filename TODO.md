# TODO — kbs0830_web

這裡**只放還沒做的**；做完的搬到 [DONE.md](DONE.md)（2026-11-09 拆開）。
做完任何一項跟 Claude 說，它會回查、從這裡刪掉、記進 DONE.md。

📬 有日期的項目會自動寄提醒信到 otemon（`reminders.json`）：11/12 匯出檢索統計、11/18 Web Vitals、12/09 CSP 回查、
2026 年底 GHA 鈦金、2027/04/18 網域續約、2027/08/31 年級更新、2027 年底 IHG 酒廊、2028 年底華航金卡。

---

## 🙋 你要動手的（要你的帳號或管理員權限，Claude 做不到）

1. [ ] **Search Console 看驗證結果** 🔴 11/05 按了「驗證修正」，「驗證中」是正常的，**~11/19 前看結果，不用再按**
   → 11/12 有提醒信叫你匯出「檢索統計資料」（檢索次數回升、5xx 歸零＝恢復）
   → 📍 11/09 截圖：已建立索引 11（11/04 是 4）。5xx 7 頁是 10 月斷線留下的，驗證跑完應該歸零；
     「已檢索／已找到但未建立索引」是 Google 自己的排程，不是錯誤
   → 11/09 新增 5 個作品頁、`/stats`、14 個部落格 tag 頁，sitemap 從 23 變 **43** 個網址（11/09 晚上回查全部 200），
     新頁面要等 Google 自己來收，不用一頁一頁按「要求建立索引」
2. [ ] **Bing 收錄回查**（11/08 提醒信已寄）：Bing 搜 `site:kbs0830.com` 有結果、或 Bing Webmaster → URL Inspection
   顯示「Indexed」才算數；還是「Discovered but not crawled」就把畫面給 Claude
3. [ ] **IG 簡介放網站連結** 🟠
4. [ ] **網域續約** 🟡 kbs0830.com 在 Cloudflare Registrar，**2027-05-18 到期**（4/18 有提醒信）
   → Domain Registration → Manage：Auto-renew 開著、信用卡到時候還有效（過期＝整站全斷）
5. [ ] **UptimeRobot 監控設定** 🟡 10 月月報 0%，但實際只斷約 4 天——監控本身設錯（告警信有寄出、你有收到）
6. [ ] **cloudflared 升級**（11/09：裝的是 2026.10.0，最新 2026.10.7）：系統管理員 PowerShell 跑
   `Stop-Service Cloudflared` → `winget upgrade Cloudflare.cloudflared` → `Start-Service Cloudflared`
7. [ ] **GitHub 門面**（改的是別的 repo）
   → pin `FoodLens-Advisor`、`YARTIX-TICKETING-TEST`；這兩個的 README 補截圖／架構圖／安裝步驟
   → profile README（`kbs0830/kbs0830`）做成跟網站一樣的風格（要做 Claude 可以幫忙寫）
8. [ ] **用 iPhone 看一次 Safari**：點作品卡片進詳細頁（換頁動畫）、首頁捲一遍。Chrome、Firefox 11/09 都測過正常，
   Safari 只有你的手機能測；有怪怪的地方截圖給 Claude

## 🤔 你要決定或提供素材的

**內容**
- [x] **定位一句話**：Hero 副標要不要從「学生開発者 · Claude × Gemini」改成「Full-stack Developer · AI × Web」之類
  （2026-07 外部 review 的第 1 點）。決定後同步改 title／OG／JSON-LD `jobTitle`／履歷
- [ ] **`/now` 更新**：內容從 7 月沒動過，告訴 Claude 現在在忙什麼；順便加「最後更新」日期
- [ ] **FoodLens 截圖**：課程専題 11/09 全部有截圖了，個人專案只剩 FoodLens 沒有。它的網頁版只是「測試 BFF 連線」的空殼、
  真正的 App 是 Android，後端也沒有 Gemini 金鑰——要你手機截一張分析結果（不要有真人臉），或給 Claude 金鑰＋一張食物照片
- [ ] **均線回測程式的 bug 要不要修**（改的是 school repo，網站目前不放報酬數字）：沒持股時跌破 MA60 也記一筆 0 張賣出、
  賣出時手續費／證交稅用加的（應該扣）、沒檢查本金夠不夠（聯發科一張就超過 100 萬，跑完資金變負）。修完網站可以補報酬率
- [ ] **「人工智慧與深度學習」要不要留**：課程學習記録寫了這門課、tag 有「深度學習」，但 school 裡這個資料夾是空的。
  東西在別的地方就給 Claude 路徑；沒有的話 Claude 拿掉
- [ ] **路口排雷「v2 重構版由我完成」對不對**：Claude 是看 git 紀錄（17 個 commit 都是你的信箱）寫的，不對就說
- [ ] **作品量化成果**：購票系統處理過幾筆報名…**有真的數字才放**（匯率系統「6 家銀行、6 條執行緒並行」11/09 已從原始碼補上）
- [ ] **履歷要不要加經歷**：證照 11/09 已從你的 104 履歷 PDF 加上（`/resume`）。同一份 PDF 還有工作經歷
  （偏鄉課輔志工、鈴鹿賽道樂園、淨園農場），要不要放、放哪幾個跟 Claude 說（電話、地址、役別不會放）
- [ ] **履歷高中英文校名**：現在寫 Kaohsiung Municipal Zhongzheng Vocational High School，要跟證書一致的話給 Claude 官方英文名
- [ ] **機型**：想記哪班的機型，給 Claude 航班代碼＋機型（`/flights` 會自動顯示）
- [ ] **部落格新文章**：要真的踩過的坑才寫。題材庫：Tailwind v4 `[--var]` 全站 116 處、Task Scheduler wrapper 孤兒 process、
  pnpm v11 native build、PowerShell 5.1 沒 BOM 變 Big5、node.exe 無聲死掉 4 小時→自己寫 watchdog、
  **11/09 新的**：中文 tag 網址 build 跟單元測試都過、上線才 404（後來加了「sitemap 每個網址都要 200」的測試）、
  PowerShell `-like` 把 `[ROLLBACK]` 的方括號當萬用字元（週報算出「自動退回 5946 次」）

**設計／取捨**
- [ ] **首頁 LCP**：~11/18 看真實訪客 Web Vitals（有提醒信），首頁 LCP p75 ≤2.5s 就不用動；
  超過再決定要不要把 Hero 進場動畫縮短（會削弱「gentle fade-in」）
- [ ] **時間軸互動**：現在是滑鼠移上去／點一下展開、移開收起；想要回到「點一下固定展開、再點收起」跟 Claude 說
- [ ] **先隱藏的東西**，想恢復哪個跟 Claude 說：
  → **下載履歷按鈕**（`/resume` 頁跟 PDF 照舊在，只是沒入口；恢復方法在 `ContactSection.tsx` 註解）
  → **Facebook**（Contact 連結、JSON-LD `sameAs`；`e2e/privacy.spec.ts` 要一起改）
  → **頁尾版本號**（`BuildInfo.tsx` 註解有說明）
  → **頁首以外的桌機特效**：游標光圈、點擊漣漪、卡片聚光燈＋3D 傾斜、小標解碼、背景直書大字、時間軸畫線（commit `cdf68f9`）

**要你建帳號／金鑰才能做**
- [ ] **桌機以外的外部監控**：停電、整台當機時 watchdog 也跟著停。用 GitHub 雲端 runner 每 10 分鐘打一次網站、
  連續失敗寄信到 otemon。要你在 repo 加兩個 Secret（SMTP 帳密），程式 Claude 寫
- [ ] **Renovate patch 更新自動合併**（需要一組 fine-grained PAT）：內建 token 開的 PR 不會觸發 workflow、沒測試結果可依據
- [ ] **聯絡表單**：要申請 EmailJS／Formspree 帳號（之前 mailto 版你說不需要）

**大功能，要先拍板做不做**
- [ ] **Umami 自架分析**：要在桌機跑 Docker
- [ ] **日文版 `/ja`**：每頁都要日文全文翻譯，跟「中文優先」方針要先對齊
- [ ] **開源貢獻區塊**：要先有合併到別人 repo 的 PR 可以展示

**其他**
- [ ] **Claude Code 遠端 session 的問題**：下次發生時把錯誤訊息或狀況記下來給 Claude
  （11/09 貼的「無法從 docs.renovatebot.com 載入結構描述：位置不受信任」不是這個——那是 VS Code 打開 `renovate.json`
  的訊息，已用 `.vscode/settings.json` 信任那個網域，重開檔案就不會再跳）

## ⚙️ 還沒做的點子（Claude 可以直接做，說「做 ○○」就開工）

（目前都做完了。有新點子會加在這裡）

## ⏳ 等別人更新

- [ ] **TypeScript 7**：typescript-eslint 還不支援（11/09 查：TS 已出 7.0.2，typescript-eslint 8.72.1 peer 仍是 `<6.1.0`），支援了再升
- [ ] **`THREE.Clock` deprecation warning**：來自 R3F 內部，等 R3F 改用 `THREE.Timer`（11/09 查：R3F 最新仍是 9.8.2，跟裝的一樣）

## 評估過、先不做（記下理由免得重查）

- **拿掉 `HeroScene.tsx` 剩下的 3 個 `useMemo`**（2026-11-09 評估）：這 3 個不是效能優化，是「整個元件生命週期只建一次」的
  three.js 物件（線條、粒子 geometry），後面有 `dispose()` 清理、`useFrame` 每幀改它們。React Compiler 的自動快取只是優化、
  不保證不重建；拿掉的話萬一被重建，就是 GPU 記憶體漏掉＋畫面閃一下。React 保證只建一次的寫法是 `useState(() => …)`，
  但跟現在一樣能用、沒有好處，不值得冒險改 3D 場景

- **Noto Serif JP 字體子集化**：Google Fonts 已經自動切成 374 塊、只下載用到的字；自己用 `text=` 子集化的話，
  之後作品標題用到清單外的字會悄悄變成別的字體，風險大於好處
