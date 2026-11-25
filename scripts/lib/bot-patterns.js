// User-Agent 分類（2026-11-24 從 raw-traffic.js 拆出來）：不碰檔案系統，瀏覽器也能用——
// /tools/user-agent（TODO J13）直接拿這份在訪客的瀏覽器裡判斷，跟網站自己的未過濾流量統計是同一套規則。

// 名稱比對不分大小寫；順序有意義：AI 先比（有些 AI 爬蟲 UA 也帶 "bot"／"Google"）
const AI_BOTS = [
  "GPTBot", "ChatGPT-User", "OAI-SearchBot",
  "ClaudeBot", "Claude-User", "Claude-SearchBot", "Claude-Web", "anthropic-ai",
  "PerplexityBot", "Perplexity-User",
  "Google-CloudVertexBot", "Gemini-Deep-Research",
  "meta-externalagent", "meta-externalfetcher", "FacebookBot",
  "Bytespider", "TikTokSpider", "CCBot", "Amazonbot", "Applebot-Extended",
  "cohere-ai", "cohere-training-data-crawler", "MistralAI-User", "DuckAssistBot",
  "YouBot", "Diffbot", "AI2Bot", "Ai2Bot-Dolma", "Timpibot", "ImagesiftBot",
  "PanguBot", "Kangaroo Bot", "iaskspider", "Novellum", "QualifiedBot",
];
const SEARCH_BOTS = [
  "Googlebot", "Google-InspectionTool", "GoogleOther", "Storebot-Google", "AdsBot-Google",
  "bingbot", "BingPreview", "YandexBot", "YandexImages", "Baiduspider", "DuckDuckBot",
  "Applebot", "Sogou", "SeznamBot", "Yeti", "PetalBot", "Qwantbot", "MojeekBot", "coccocbot",
];
const OTHER_BOT_PATTERN =
  /bot|spider|crawl|slurp|scan|fetch|preview|facebookexternalhit|curl|wget|python|go-http|java\/|okhttp|axios|node-fetch|undici|scrapy|headless|libwww|httpclient|monitor/i;

function findName(ua, list) {
  const lower = ua.toLowerCase();
  return list.find((name) => lower.includes(name.toLowerCase()));
}

/** @returns {{ kind: "ai" | "search" | "bot" | "browser", name?: string }} */
function classify(ua) {
  const s = ua || "";
  const ai = findName(s, AI_BOTS);
  if (ai) return { kind: "ai", name: ai };
  const search = findName(s, SEARCH_BOTS);
  if (search) return { kind: "search", name: search };
  // 正常瀏覽器的 UA 一定是 "Mozilla/5.0 (...)" 開頭；空的、不是這個格式的都當機器人
  if (!s.startsWith("Mozilla/") || OTHER_BOT_PATTERN.test(s)) return { kind: "bot" };
  return { kind: "browser" };
}

/** 看起來是真人的瀏覽器（統計、Web Vitals、版本回報都只收這種）。2026-11-25 起取代兩支 route 各自的 BOT_UA_PATTERN */
const isBrowserUA = (ua) => classify(ua).kind === "browser";

module.exports = { classify, isBrowserUA, AI_BOTS, SEARCH_BOTS };
