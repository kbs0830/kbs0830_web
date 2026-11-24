// robots.txt 解析＋判斷（TODO J12「AI 爬蟲檢查」，2026-11-24）。照 RFC 9309：
//   - 連續的 User-agent 行組成一組，後面的 Allow／Disallow 屬於這組；Sitemap 這類其他欄位忽略
//   - 爬蟲先找「名字完全一樣」的組（不分大小寫，同名多組合併），沒有才用 *；都沒有＝全部允許
//   - 路徑比對：最長的規則贏，一樣長 Allow 贏；支援 * 跟結尾 $；空的 Disallow 等於沒寫

export interface RobotsRule {
  allow: boolean;
  path: string;
}
export interface RobotsGroup {
  agents: string[];
  rules: RobotsRule[];
}

export function parseRobots(text: string): RobotsGroup[] {
  const groups: RobotsGroup[] = [];
  let cur: RobotsGroup | null = null;
  let lastWasAgent = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim();
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const value = m[2].trim();
    if (key === "user-agent") {
      if (!cur || !lastWasAgent) {
        cur = { agents: [], rules: [] };
        groups.push(cur);
      }
      cur.agents.push(value.toLowerCase());
      lastWasAgent = true;
    } else if (key === "allow" || key === "disallow") {
      lastWasAgent = false;
      if (cur && !(key === "disallow" && value === "")) cur.rules.push({ allow: key === "allow", path: value });
    }
  }
  return groups;
}

export type Via = "specific" | "wildcard" | "none";

export function rulesFor(groups: RobotsGroup[], token: string): { rules: RobotsRule[]; via: Via } {
  const t = token.toLowerCase();
  const own = groups.filter((g) => g.agents.includes(t));
  if (own.length) return { rules: own.flatMap((g) => g.rules), via: "specific" };
  const star = groups.filter((g) => g.agents.includes("*"));
  if (star.length) return { rules: star.flatMap((g) => g.rules), via: "wildcard" };
  return { rules: [], via: "none" };
}

function matches(pattern: string, path: string): boolean {
  const anchored = pattern.endsWith("$");
  const body = (anchored ? pattern.slice(0, -1) : pattern).replace(/[.+?^{}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${body}${anchored ? "$" : ""}`).test(path);
}

export function isAllowed(rules: RobotsRule[], path: string): boolean {
  let best: RobotsRule | null = null;
  for (const r of rules) {
    if (!r.path || !matches(r.path, path)) continue;
    if (!best || r.path.length > best.path.length || (r.path.length === best.path.length && r.allow)) best = r;
  }
  return best ? best.allow : true;
}

export type Access = "allowed" | "partial" | "blocked";

/** 首頁（/）不能抓＝blocked；首頁可以但有其他 Disallow＝partial */
export function verdict(groups: RobotsGroup[], token: string): { access: Access; via: Via } {
  const { rules, via } = rulesFor(groups, token);
  if (!isAllowed(rules, "/")) return { access: "blocked", via };
  return { access: rules.some((r) => !r.allow) ? "partial" : "allowed", via };
}

/** 要檢查的爬蟲：robots.txt 裡用的名字（product token）＋說明 */
export const CRAWLERS: { token: string; owner: string; use: string; ai: boolean }[] = [
  { token: "GPTBot", owner: "OpenAI", use: "訓練模型", ai: true },
  { token: "OAI-SearchBot", owner: "OpenAI", use: "ChatGPT 搜尋", ai: true },
  { token: "ChatGPT-User", owner: "OpenAI", use: "ChatGPT 代使用者讀網頁", ai: true },
  { token: "ClaudeBot", owner: "Anthropic", use: "訓練模型", ai: true },
  { token: "Claude-SearchBot", owner: "Anthropic", use: "Claude 搜尋", ai: true },
  { token: "Claude-User", owner: "Anthropic", use: "Claude 代使用者讀網頁", ai: true },
  { token: "Google-Extended", owner: "Google", use: "Gemini 訓練／引用", ai: true },
  { token: "PerplexityBot", owner: "Perplexity", use: "AI 搜尋", ai: true },
  { token: "Applebot-Extended", owner: "Apple", use: "Apple Intelligence 訓練", ai: true },
  { token: "CCBot", owner: "Common Crawl", use: "公開爬蟲資料集（很多模型拿來訓練）", ai: true },
  { token: "meta-externalagent", owner: "Meta", use: "訓練模型", ai: true },
  { token: "Bytespider", owner: "ByteDance", use: "訓練模型", ai: true },
  { token: "Amazonbot", owner: "Amazon", use: "Alexa／AI", ai: true },
  { token: "Googlebot", owner: "Google", use: "Google 搜尋", ai: false },
  { token: "Bingbot", owner: "Microsoft", use: "Bing 搜尋（Copilot、ChatGPT 搜尋也會用到）", ai: false },
];
