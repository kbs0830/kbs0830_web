import { SITE_URL } from "@/lib/site/site";

// 結構化資料（schema.org）的產生函式（TODO V7，2026-11-27）：工具頁的 WebApplication、工具頁／文章頁的 BreadcrumbList 共用。
// 不做 FAQPage／HowTo：Google 2023 起 FAQ 只給政府、醫療網站顯示，HowTo 已停用，加了沒用。
// 只放網站本來就公開的資訊（頁名、說明、網址），不放人名跟個資。

/** 麵包屑。items 是「名稱＋站內路徑」，第一個通常是首頁 */
export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${SITE_URL}${it.path}` })),
  };
}

/** 工具頁：免費的網頁應用程式 */
export function webApplicationLd(tool: { name: string; description: string; path: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.name,
    description: tool.description,
    url: `${SITE_URL}${tool.path}`,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any (web browser)",
    isAccessibleForFree: true,
    inLanguage: "zh-Hant",
    offers: { "@type": "Offer", price: "0", priceCurrency: "TWD" },
  };
}
