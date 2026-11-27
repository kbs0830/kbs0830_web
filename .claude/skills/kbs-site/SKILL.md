---
name: kbs-site
description: kbs0830_web 各頁面與區塊的設計紀錄全文：NavBar／Footer／彩蛋、Hero（3D、WebGPU、流星）、About、作品集、Contact、/blog、/changelog、/status、/colophon、/api/v1 與 /mcp、/developers、/airports、/resume、站長後台 /admin（資料庫、待辦、搜尋、報表、命令列工具），以及完整專案目錄結構。要改或新增任何頁面、區塊、元件，或找某個功能的檔案在哪時先讀。
---

> 從 CLAUDE.md 搬出來的細節（深色模式架構、Tailwind v4 地雷經過、Server/Client 分工表、動畫元件對照表、pnpm、PS1 編碼、Git hooks、Hero 滑鼠互動例外）在同資料夾的 **`details.md`**（2026-11-25）。

> 2026-11-25 拆檔省 token：內容原文分在 `parts/` 底下，**先看下面的目錄，只讀跟這次工作有關的那幾個檔**（用 Read 讀 `parts/NN.md`）。

| 分組 | 小節 | 檔案 | 大小 |
|---|---|---|---|
| Site Sections | 0. 全站共用（NavBar / Footer / 彩蛋） | `parts/01.md` | 7.5 KB |
| Site Sections | /tools 小工具（2026-11-24，決策表 J 系列） | `parts/02.md` | 1.9 KB |
| Site Sections | 1. Hero | `parts/03.md` | 7.0 KB |
| Site Sections | 2. About（自己紹介 · 關於我） | `parts/04.md` | 4.8 KB |
| Site Sections | 3. 製作物（作品集） | `parts/05.md` | 5.5 KB |
| Site Sections | 4. Contact（連絡先） | `parts/06.md` | 0.5 KB |
| Site Sections | 5. `/blog`（獨立頁面，非首頁 section） | `parts/07.md` | 4.0 KB |
| Site Sections | 5.5 `/changelog`（2026-11-21，TODO B1） | `parts/08.md` | 1.0 KB |
| Site Sections | 5.6 `/status` 維運狀態（2026-11-21，TODO A4） | `parts/09.md` | 1.2 KB |
| Site Sections | 5.7 `/colophon` 本站構造（2026-11-21，TODO A8） | `parts/10.md` | 0.7 KB |
| Site Sections | 5.8 公開 API `/api/v1`、MCP 伺服器 `/mcp`、說明頁 `/developers`（2026-11-21，TODO A9／A10） | `parts/11.md` | 1.1 KB |
| Site Sections | 5.9 `/airports` 機場時刻表＋課程作品的「線上版」（2026-11-22，TODO D2／D5／D6） | `parts/12.md` | 3.0 KB |
| Site Sections | 7. `/resume`（獨立頁面） | `parts/13.md` | 1.1 KB |
| Site Sections | 8. 站長後台 `/admin`（門禁、資料庫、命令列、後台相關維運功能、多個 session 一起改的注意事項；2026-11-27） | `parts/15.md` | 7.2 KB |
|  | Project Structure | `parts/14.md` | 6.1 KB |
