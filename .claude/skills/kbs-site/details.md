# kbs0830_web — 從 CLAUDE.md 搬出來的細節（2026-11-25）

CLAUDE.md 每次對話都會載入，2026-11-25 瘦身時把「背景故事、完整對照表」搬到這裡（內容一字未改）。
CLAUDE.md 裡留了每一段的一行規則；要改相關程式時再讀這裡。

### 深色模式（Dark Mode）

**主題切換架構：**
1. `src/app/layout.tsx` 的 `<head>` 有一段 inline `<script>`，在 hydration **之前**同步執行：
   讀 `localStorage.theme` → 沒有就讀 `matchMedia('(prefers-color-scheme: dark)')` →
   都讀不到（被封鎖 / 不支援）就 fallback 回 `light`。直接把結果寫到 `<html data-theme>`，
   避免「先閃一次淺色、JS 才切成深色」的 FOUC。
2. `globals.css` 的 `:root` 定義淺色 token（預設值），`[data-theme="dark"]` 覆寫深色 token。
3. `NavBar.tsx` 的 toggle 只負責讀出 inline script 已經套用的結果（`document.documentElement
   .getAttribute('data-theme')`）同步到 React state，以及手動切換時寫回 `localStorage`——
   偵測邏輯只在 inline script 那一份，不重複維護第二份。

**⚠️ Tailwind v4 CSS 變數語法地雷（2026-07 修過的真實 bug）：**
Tailwind v4 把「方括號 + 裸變數名稱」的簡寫（`bg-[--accent]`）**棄用**了，換成小括號
（`bg-(--accent)`）。用方括號會編譯成字面上無效的 CSS `background-color:--accent`（不是
`var(--accent)`），瀏覽器會直接忽略這條宣告——視覺上等於該元素完全沒有背景/文字色，
兩個主題其中一個可能剛好因為繼承色矇混過關，另一個就會整個看不見
（實際案例：Hero 區「查看作品 · View Work」按鈕在淺色模式下變透明，白字疊在淺色背景上完全看不到，
深色模式因為頁面背景本身夠暗才沒被發現——全站 116 處 `[--token]` 用法都中招，已全部改成 `(--token)`）。

**規則：** 引用 `globals.css` 裡定義的主題變數（`--bg` / `--surface` / `--border` / `--text` /
`--muted` / `--accent` / `--accent-lt`）一律用小括號 `bg-(--accent)`、`text-(--muted)`、
`border-(--border)` 這種寫法。方括號 `[...]` 只留給真正的字面值（`w-[1px]`、`text-[13px]`、
`tracking-[0.2em]` 這種），不是變數參照。新增顏色相關 class 前，建議打開 `.next/static/chunks/*.css`
或用瀏覽器 DevTools 確認該 class 真的產生了 `var(--xxx)`，而不是裸變數名稱。

**⚠️ 附帶地雷：Tailwind v4 會把 `.md` 也當成 class candidate 來源。** 修上面這個 bug 時，
`CLAUDE.md` 裡拿 `bg-[--accent]` 當反例說明文字，結果 Tailwind 的自動掃描（沒有
`tailwind.config.js`，靠掃全 repo 找 candidate）把這段 markdown 文字誤判成真的 class，
編譯出一條一樣壞掉的規則——連 `.next` 整個砍掉重建都沒用，因為來源就是 `CLAUDE.md` 本身，
不是快取問題。已經在 `globals.css` 加 `@source not "../../**/*.md";` 排除所有 `.md`。
以後在任何 `.md` 檔裡示範 Tailwind class 語法（尤其是故意寫錯的反例）都要有這個排除規則還在，
不然文件本身會偷偷污染編譯出來的 CSS。

---


### Server / Client Component 分工（2026-11）

**首頁四個 section 都是 Server Component**，只把真的需要瀏覽器的小元件標 `"use client"`
（client island）。新增內容時預設寫成 server，**不要為了一個小互動就把整個 section 改成
`"use client"`**——那會讓整個 section 的文字跟它 import 的資料（例如 `projects.ts`）全部進
client bundle（2026-11 之前就是這樣，首頁 bundle 裡帶著所有詳細頁的長篇說明跟架構圖）。

| Section | Client island |
|---|---|
| Hero | `HeroBackground`（3D 場景載入）、`Typewriter`、`Magnetic` |
| About | `Reveal`/`RevealHeading`、`SpotifyNowPlaying`、`Tabs`（只管顯示哪一頁，面板內容是 server 產生的 ReactNode）；技能 accordion 是原生 `<details>`、時間軸展開是 CSS `:hover`/`:focus`，**零 JS** |
| Portfolio | `ProjectFilter`（只管 tag 篩選，卡片是 server 產生後當 ReactNode 傳進去） |
| Contact | `CopyEmailButton`、`Magnetic` |

- 資料檔：About 的技能/時間軸/足跡在 `lib/content/about.ts`，作品在 `lib/content/projects.ts`
- client 元件需要伺服器資料時，在 server 端先算好再當 prop 傳（例：`TerminalMode` 的
  `projectListing` 由 `page.tsx` 排好傳入，不在 client import `projects.ts`）
- 字體一律用 `font-mono` / `font-serif` class（`globals.css` 的 `@theme inline` 已對應），
  不要再寫 `style={{ fontFamily: "var(--font-…)" }}`
- 首頁以外的獨立頁面一律包 `<PageShell backHref backLabel printable eyebrow title intro>`
  （窄欄 + 返回連結；eyebrow/title/intro 是「小標＋大標＋一段說明」的頁首，/now、/uses、/blog、404 共用）
- 網址、email、GitHub/FB/IG 連結一律從 `lib/site/site.ts` 引用，不要再寫字面值
- 重複出現的小區塊已經有元件，先找再寫：`SectionHeading`（小節標題）、`BulletList`（▸ 清單）、
  `StatusBadge`（作品狀態）、`ProjectHighlight`（作品成果一句話）、`JsonLd`（結構化資料）、
  `Eyebrow`、`TagBadge`
- **`font-mono` = Geist Mono**：next/font 的變數直接叫 `--font-mono`（`app/fonts.ts`）。2026-11 之前
  `globals.css` 把它寫成沒載入的 "JetBrains Mono"，訪客看到的其實是 Consolas／細明體——
  不要在 `:root` 再定義 `--font-mono`


### 動畫架構（2026-11 拿掉 framer-motion 後）

新增動畫前先看這裡有沒有現成的，**不要再把 framer-motion 裝回來**：

| 需求 | 用什麼 | 位置 |
|---|---|---|
| 捲動到才淡入 | `<Reveal from delay distance duration>` | `components/ui/Reveal.tsx` + `globals.css [data-reveal]` |
| 標題逐字淡入 | `<RevealHeading>` | 同上 `[data-reveal-chars]` |
| 頁面一載入就播的進場（Hero、NavBar） | `className="enter-up"` / `"enter-fade"` + CSS 變數 `--enter-delay` 等 | `globals.css`（純 CSS，不必等 hydration） |
| 展開/收合 | `<Collapse open>`（grid-rows 0fr↔1fr，收合時 `inert`） | `components/ui/Collapse.tsx` |
| 彈窗 | `<Modal open onClose label>`（原生 `<dialog>` + `@starting-style`） | `components/ui/Modal.tsx` + `globals.css dialog.modal` |
| 捲動進度條 | CSS `animation-timeline: scroll()` | `globals.css .scroll-progress` |
| 讀 matchMedia / scrollY | `useMediaQuery` / `useScrolledPast`（`useSyncExternalStore`） | `lib/client/hooks.ts` |
| 讀目前主題強調色（給 canvas／three.js 用） | `useAccentColor`（MutationObserver 看 `data-theme`） | `lib/client/hooks.ts` |
| 分頁 | `<Tabs items label>`（ARIA tabs、←→ 換頁、沒選中的面板 `hidden="until-found"`：HTML 裡內容都在、Ctrl+F 找得到會自動切頁、列印全印） | `components/ui/Tabs.tsx` |
| Hero 名字滑鼠解碼 | `data-scramble="hover"`（單一 text node） | `components/sections/HeroNameScramble.tsx`（只掛在 Hero） |
| Hero 捲走時文字上飄淡出（零 JS） | `.hero-parallax` | `globals.css` `@supports (animation-timeline: view())` |

- `useRevealOnce` 直接在 DOM 加 `data-shown`，不走 React state，捲動時零 re-render
- 全站唯一一條 easing 是 `--ease-ma`（`cubic-bezier(0.25, 0.1, 0.25, 1)`），Tailwind 用 `ease-(--ease-ma)`
- `.enter-*` 的 fill-mode 是 `backwards`，不是 `both`：`both` 會在動畫結束後一直鎖住 opacity，
  之後同一個元素的 transition（例如 Konami 退場）就不會動
- **Hero 互動的地雷**：名字解碼只改 text node 的 `nodeValue`（不換 node，React 之後照常更新）；
  **`<h1>` 是 LCP 元素，只能滑鼠移上去才播**，載入時改它的字會讓 LCP 重算。
  `HeroScene` 的粒子狀態放 module 層級：React Compiler 不准改 `useMemo`／`useRef` 拿到的值，`useFrame` 又一定要每幀改
- **`dialog.modal` 一定要留在 `@layer components` 裡**：沒包 layer 的 CSS 會壓過所有 Tailwind
  utility（`sm:max-w-xl` 失效）；而且 Tailwind preflight 會把 `<dialog>` 預設的置中 margin
  歸零，`margin: auto` 要自己補（第一版沒注意到，終端機跑到左上角、佔滿全寬）
- 列印樣式會強制把 `[data-reveal]`／`.enter-*` 顯示出來，不然還沒捲到的區塊印出來是空白


### pnpm 注意事項

pnpm v11 native build 限制：`sharp` 和 `unrs-resolver` 需要 build scripts。
目前解法：`dev` / `build` / `start` scripts 改為直接呼叫 `node node_modules/next/dist/bin/next`，繞過 pnpm 的 pre-run install check。

```bash

### PowerShell script 編碼注意事項

`scripts/*.ps1` 只要有中文/日文字元，檔案就必須是 **UTF-8 with BOM**（`EF BB BF` 開頭）。
桌機的 Windows PowerShell 5.1（`powershell.exe`，非 `pwsh`）在檔案沒有 BOM 時會用系統
locale（Big5）去讀檔，多位元組字元會被拆散、機率性地產生「字串沒有結束字元」之類的
parse error（新增 `watchdog.ps1` 時就實際踩過）。存檔前確認 BOM：

```bash
head -c 3 scripts/xxx.ps1 | xxd   # 應該是 efbbbf

### Git hooks（Husky + lint-staged）

`.husky/pre-commit` 在每次 commit 前跑兩件事：
1. `lint-staged`（`package.json` 的 `lint-staged` 欄位設定）：只對 staged 的 `*.{js,jsx,ts,tsx}` 跑 `eslint --fix`
2. 全專案 `tsc --noEmit`（型別錯誤不像 lint 只在改到的檔案發生，任何檔案都可能因為別處改動而報錯，所以這步是全專案跑，不是只跑 staged 檔案）

任一步失敗都會擋下 commit。**改 `scripts/**/*.js` 這類 CommonJS 檔案時**，`eslint.config.mjs`
已經對這個路徑關掉 `@typescript-eslint/no-require-imports`，不要因為 lint 錯誤誤以為要把
它們改寫成 ESM `import`。


### Hero 桌機滑鼠互動的例外（原本在「設計原則」）
- **例外：Hero 的桌機滑鼠互動（2026-11-05）**——使用者要「桌機多一點炫技」，做了全站版（游標光圈、點擊漣漪、
  卡片聚光燈＋3D 傾斜、小標解碼、背景直書大字、時間軸捲動畫線），試完說「**滑鼠首頁部分好玩，剩下先不要，頁首就好**」，
  只留 Hero（粒子互動、名字解碼、捲動視差）。其他效果的程式在 commit `cdf68f9`，要恢復可以從那裡拿；**不要自己加回其他區塊**。
  只在寬螢幕＋滑鼠＋沒開減少動態時啟用，一樣不跳不彈（彈簧阻尼夠大）


### 文案風格（2026-11-26，TODO N15）
使用者要 Claude 當美編並重寫全站文案（N1–N14），這是從那次改動歸納出的規則。新頁面、新功能的文字照這裡寫。
1. **聲音**：第一人稱「我」、平實、像跟朋友解釋。不用空泛詞（深深、有意義、精緻、探索…的可能性、賦能、thoughtful）——用具體名詞和數字取代形容詞，
   一段一個事實（例：About「這個網站就是例子——自己寫、架在家裡的桌機上，出問題會自己寄信通知我。」）
2. **台灣用語**（使用者：「對岸用語確實要拿掉!!」）：打造／建立（不用構建、建構）、資料（不用數據；課名「大數據…」是專有名詞不改）、
   使用者（不用用戶）、程式（不用程序）、影片（不用視頻）
3. **日文只當點綴**：區塊大標（自己紹介／製作物／連絡先／記事）、Hero 副標「学生開発者」、作品 `titleJa`、獨立的日文詞（開発環境、迷子）。
   **句子裡不混日文字形**（専案、学習記録、対話、學生開発者 都改過了）。整句日文要先確認文法（N5 程度，寧可不寫）
4. **雙語**：中文在前、英文在後，英文是意譯不是逐字翻；手機上英文常收掉（`hidden sm:inline`），標題順序 中文大字 → 英日小字一行
5. **標點**：雙語分隔「中文 · English」（U+00B7 前後空格）；日文詞內部才用「・」；中文破折號「——」、英文「 — 」；
   箭頭 → 只給會換頁的連結、← 返回、↗ 外部；**全站不用驚嘆號**（「已複製！」→「已複製」）；中英之間半形空格、數字半形
6. **長度**：Hero 標語中文 ≤16 字；子頁 intro 最多兩句、60 字內（第一句這頁是什麼、第二句資料怎麼來／多久更新），細節移到頁面下方「說明」；按鈕中文 ≤4 字
7. **名稱統一**：部落格在導覽列、首頁、/blog 都叫「記事 · Notes」（`<title>` 留「技術部落格」給搜尋）；Hero 副標不放工具名（Claude Code 寫在 About 現況卡）
8. **隱私**：可見文字只寫 PINGWEI LI；地點只到城市（頁尾落款「自架於高雄」）；行程不寫日期；雷達不寫位置
9. 使用者拒絕過的（不要再提）：Hero 副標改灰（「那是很重要的東西，不然首頁單調」）、首頁登入按鈕降級（「我需要啊」）、首頁天氣對齊內文（「首頁就是要滿版」）、meta description 重寫
