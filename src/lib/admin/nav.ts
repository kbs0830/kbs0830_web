import type { Route } from "next";

// 站長後台的分頁（TODO A1）。內容還是空殼，做的時候照 TODO.md A1 的表填資料來源。
export const ADMIN_PAGES: { href: Route; label: string; en: string; desc: string }[] = [
  { href: "/admin", label: "總覽", en: "Overview", desc: "今天訪客、上次部署、最近告警、雷達、下一封報表" },
  { href: "/admin/reports", label: "報表", en: "Reports", desc: "日報／週報／月報（現在的 /reports 搬進來）" },
  { href: "/admin/traffic", label: "流量", en: "Traffic", desc: "未過濾流量、爬蟲、404 清單、來源細節" },
  { href: "/admin/ops", label: "維運", en: "Ops", desc: "部署紀錄、排程工作、告警歷史、備份" },
  { href: "/admin/mail", label: "寄信", en: "Mail", desc: "週報／月報寄送紀錄、預覽、重寄" },
  { href: "/admin/todo", label: "待辦", en: "Todo", desc: "TODO.md 每一項選先做／之後／不做、加備註" },
];
