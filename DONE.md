# DONE — 已搬進站長後台

**2026-11-26 起，完成紀錄的正本在站長後台的資料庫**（`data/admin.db` 的 `done_log` 表，不進 git），這個檔案不再更新。
（使用者：「done.md 收進資料庫搬家」；原內容 75 筆已全部匯入，舊版全文在 git 歷史）

- **看／搜尋**：`/admin/done`（只有站長進得去），依月份分組、點標題看全文
- **Claude 新增、查**：在桌機跑 `node scripts/admin-db.js done …`
  - 最近：`done`、全文：`done show <id>`、搜尋：`done search <關鍵字>`
  - 新增：`done add --title "…" [--day YYYY-MM-DD] --detail-file <檔案>`（說明寫完整：使用者原話、做了什麼、怎麼驗證）
- 備份：`backup.ps1` 已含 `data/admin.db`
