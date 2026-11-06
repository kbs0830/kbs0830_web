// 未過濾流量（2026-11-06，使用者：「頁底加上沒清洗的瀏覽人數，包含 AI 等等的」）。
//
// 跟 Footer 原本的「共 N 次造訪」是兩套數字，故意分開：
//   - 造訪（/api/visitor-stats POST）：要瀏覽器真的執行 JS 才算，再濾掉 bot UA ——「真人」估計值
//   - 未過濾（這支）：server.js 收到的每一個頁面請求都算，AI 爬蟲、搜尋引擎、掃描器全部包含，
//     只是順便依 User-Agent 分類，看得出來誰在讀這個網站
//
// 只存「分類 → 次數」跟「爬蟲名稱 → 次數」，不存 IP、不存完整 UA、不存網址。
// 不算的只有三種「根本不是外面來的請求」：
//   - 沒有 cf-ipcountry（沒經過 Cloudflare：watchdog/部署健檢打 localhost、本機測試）
//   - UA 含 WindowsPowerShell（watchdog 每 5 分鐘從外網打一次首頁，一天 288 次，是自己）
//   - Next.js 的連結預先載入（next-router-prefetch / sec-purpose: prefetch）：畫面上出現連結就會發，
//     不是有人打開那一頁
// 靜態資源（/_next/、圖片、字型）跟 /api/ 也不算：那是同一次瀏覽附帶的請求，不是另一次瀏覽。

const fs = require("fs");
const path = require("path");

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
const ASSET_PATTERN = /\.(?:js|mjs|css|map|png|jpe?g|gif|webp|avif|svg|ico|woff2?|ttf|otf|mp4|webm)$/i;

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

/** @param {{ method?: string, url?: string, headers: Record<string, string | string[] | undefined> }} req */
function shouldCount(req) {
  const h = req.headers;
  if (req.method !== "GET" && req.method !== "HEAD") return false;
  if (!h["cf-ipcountry"]) return false;
  if (String(h["user-agent"] || "").includes("WindowsPowerShell")) return false;
  if (h["next-router-prefetch"] || /prefetch/i.test(String(h["sec-purpose"] || h["purpose"] || ""))) return false;
  const pathname = (req.url || "/").split("?")[0];
  if (pathname.startsWith("/_next/") || pathname.startsWith("/api/")) return false;
  if (ASSET_PATTERN.test(pathname)) return false;
  return true;
}

function emptyStats() {
  const since = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Taipei" });
  return { since, total: 0, browser: 0, ai: 0, search: 0, bot: 0, names: {} };
}

function readRawTraffic(file) {
  try {
    return { ...emptyStats(), ...JSON.parse(fs.readFileSync(file, "utf8")) };
  } catch {
    return null;
  }
}

// 同步 read-modify-write：理由跟 /api/visitor-stats 一樣（單一 process、中間沒有 await，不會交錯）
function recordRawHit(file, req) {
  if (!shouldCount(req)) return false;
  const { kind, name } = classify(String(req.headers["user-agent"] || ""));
  const stats = readRawTraffic(file) || emptyStats();
  stats.total += 1;
  stats[kind] += 1;
  if (name) stats.names[name] = (stats.names[name] || 0) + 1;
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(stats));
  } catch {
    // 寫檔失敗不影響回應，下次還有機會
  }
  return true;
}

module.exports = { classify, shouldCount, readRawTraffic, recordRawHit };
