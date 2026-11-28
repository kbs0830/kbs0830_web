import type { Metadata, Route } from "next";
import Link from "next/link";
import { withShare } from "@/lib/site/share-meta";
import PageShell from "@/components/layout/PageShell";
import { readSiteFacts, type SiteFacts } from "@/lib/ops/colophon";
import { nf } from "@/lib/format";
import { Suspense } from "react";
import { connection } from "next/server";
import LoadingBlock from "@/components/ui/LoadingBlock";

// 本站構造（TODO A8，2026-11-21）：CLAUDE.md「部署架構」那一大段，做成給人看的一張圖。
// 點圖上的方塊跳到下面那張說明卡（<a href="#…"> ＋ CSS :target，零 JS）。每個方塊上的數字是現在的值（每次請求現讀）。

export const metadata: Metadata = withShare(
  {
    title: "本站構造 · Colophon — PINGWEI LI",
    description: "這個網站怎麼跑在家裡的桌機上：Cloudflare、Tunnel、自訂 server、雙槽部署、watchdog、備份，每個環節的即時數字。",
    alternates: { canonical: "/colophon" },
  },
  { ownImage: true },
);

const loadFacts = () => readSiteFacts(Date.now());

function ago(iso: string | null) {
  if (!iso) return "—";
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Taipei", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value]),
  );
  return `${parts.month}/${parts.day} ${parts.hour}:${parts.minute}`;
}
function span(seconds: number) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  return d ? `${d} 天 ${h} 小時` : `${h} 小時 ${Math.floor((seconds % 3600) / 60)} 分`;
}

interface NodeDef {
  id: string;
  x: number;
  y: number;
  title: string;
  live: string;
  heading: string;
  body: string[];
  facts?: string[];
  links?: { href: Route; label: string }[];
}

const MAIN_X = 20;
const SIDE_X = 350;
const W_MAIN = 290;
const W_SIDE = 250;
const H = 64;

function nodes(f: SiteFacts): NodeDef[] {
  return [
    {
      id: "visitor",
      x: MAIN_X,
      y: 10,
      title: "訪客",
      live: `真人造訪累計 ${nf.format(f.visitors)} 次`,
      heading: "訪客 · 你",
      body: ["打開 kbs0830.com 的瀏覽器——包括搜尋引擎跟 AI 爬蟲。"],
      facts: [
        f.cloudflare30 ? `Cloudflare 近 30 天 ${nf.format(f.cloudflare30.uniques)} 位訪客（每天不重複 IP 加總，含機器人）` : "",
        `真人造訪累計 ${nf.format(f.visitors)} 次（瀏覽器真的執行了 JavaScript 才算）`,
      ].filter(Boolean),
      links: [{ href: "/stats", label: "訪客分析" }],
    },
    {
      id: "cloudflare",
      x: MAIN_X,
      y: 100,
      title: "Cloudflare",
      live: f.cloudflare30 ? `近 30 天 ${nf.format(f.cloudflare30.requests)} 次請求` : "CDN · WAF",
      heading: "Cloudflare · 網域、HTTPS、快取、防火牆",
      body: [
        "網域跟 DNS 都在 Cloudflare。HTTPS、HSTS、www 導回不帶 www 的網址，都在這一層做完。",
        "靜態頁直接從 Cloudflare 的快取給，不用回到桌機；每次部署切換後自動清快取（舊頁面會引用已經不存在的 JS 檔）。",
        "防火牆規則擋掉漏洞掃描器愛猜的路徑（/wp-、.php、/.env、/.git、xmlrpc），還沒到桌機就 403。",
      ],
      facts: f.cloudflare30 ? [`近 30 天 ${nf.format(f.cloudflare30.requests)} 次請求（含快取命中、機器人）`] : [],
    },
    {
      id: "tunnel",
      x: MAIN_X,
      y: 190,
      title: "Cloudflare Tunnel",
      live: f.uptime30 === null ? "可用率累積中" : `近 30 天可用 ${(f.uptime30 * 100).toFixed(2)}%`,
      heading: "Cloudflare Tunnel · 不開 port 也能對外",
      body: [
        "家用網路封鎖了對外的 80／443 port。cloudflared 從桌機「往外」連到 Cloudflare，流量再從這條連線送進來——不用開 port，也不會暴露家裡的 IP。",
        "它是 Windows 服務：開機自動啟動（延遲啟動，開機約 2 分 20 秒才連上）、當掉自動重啟。10 月曾經因為服務設定是空轉的，斷了 4 天沒發現。",
      ],
      facts: [f.uptime30 === null ? "可用率剛開始累積" : `近 30 天可用率 ${(f.uptime30 * 100).toFixed(2)}%（桌機自己跟外網兩邊都正常才算）`],
      links: [{ href: "/blog/tunnel-down-four-days" as Route, label: "斷了 4 天的那次" }],
    },
    {
      id: "server",
      x: MAIN_X,
      y: 280,
      title: "server.js",
      live: `已經跑了 ${span(f.processUptime)}`,
      heading: "server.js · 自己寫的 Node.js server",
      body: [
        "不是 next start，是包了一層的自訂 server：每個請求寫 log、統計訪客國家跟爬蟲（只存次數）、維修模式回維修頁、每 30 秒在區網讀一次自家雷達。",
        "Windows 工作排程器開機就啟動它，而且直接執行 node.exe、中間不經過任何腳本——多一層的話，停止工作時殺不到真正的 node.exe，舊版會一直活著。",
      ],
      facts: [
        `這次啟動已經跑了 ${span(f.processUptime)}`,
        `記憶體 ${f.memoryMB} MB`,
        // H7：網站就跑在這張顯卡旁邊（每 30 秒讀一次 nvidia-smi）
        f.gpu ? `旁邊的 ${f.gpu.name}：使用率 ${f.gpu.utilization}%、${f.gpu.tempC}°C、${f.gpu.powerW} W、顯存 ${nf.format(f.gpu.memUsedMB)}／${nf.format(f.gpu.memTotalMB)} MB` : "",
      ].filter(Boolean),
    },
    {
      id: "next",
      x: MAIN_X,
      y: 370,
      title: "Next.js · 雙槽",
      live: `線上：${f.slot}`,
      heading: "Next.js 16 · 兩個 build 資料夾輪流用",
      body: [
        "Next.js 16（App Router）＋ React 19 ＋ React Compiler。大部分頁面 build 時就產生好，像這頁這種要即時數字的才每次現算。",
        "build 有兩個資料夾 .next-a／.next-b：新版 build 到沒在用的那個，好了才切過去，停站只有 1～2 秒；切過去健檢沒過，就指回原本那個。",
        "build 在一份乾淨的 git 副本裡做，只有已經 push 的程式碼：同一台電腦上正在改、還沒 commit 的東西不會被一起上線。",
      ],
      facts: [`現在線上的是 ${f.slot}`, `上次部署 ${ago(f.lastDeploy)}`],
      links: [{ href: "/blog/vscode-locks-next" as Route, label: "為什麼是兩個資料夾" }],
    },
    {
      id: "data",
      x: MAIN_X,
      y: 460,
      title: "data/",
      live: "JSON ＋ log，沒有資料庫",
      heading: "data/ · 沒有資料庫",
      body: [
        "訪客統計、Web Vitals、可用率、雷達都是 data/ 下的 JSON 或文字檔。只存彙總數字：沒有 IP、沒有完整 UA、沒有 cookie。",
        "這些檔案不進 git，每天備份。",
      ],
    },
    {
      id: "mail",
      x: SIDE_X,
      y: 190,
      title: "告警信",
      live: "出事才寄",
      heading: "告警信 · 出事才寄、修好補一封",
      body: [
        "部署失敗、自動重啟、外網連不到、雷達離線都會寄信（同一件事 1 小時內只寄一封），恢復時再補一封「已恢復」。每週一另外寄一封週報。",
        "外網要連續兩輪失敗才寄：曾經因為慢了一分鐘就寄了「掛了」跟「恢復」兩封。",
      ],
    },
    {
      id: "watchdog",
      x: SIDE_X,
      y: 280,
      title: "watchdog",
      live: `近 90 天自動重啟 ${f.autoRestarts90} 次`,
      heading: "watchdog · 每 5 分鐘巡一次",
      body: [
        "從桌機自己、也從外網各打一次首頁，還會實際下載首頁用到的 JS 檔；網站沒回應就自動重啟，重啟救不回來才寄信叫人。",
        "順便確認自動部署的 runner 還活著，也負責觸發每天的備份、每週的週報、到期的提醒信。",
      ],
      facts: [`近 90 天自動重啟 ${f.autoRestarts90} 次`],
      links: [{ href: "/status", label: "可用率跟重啟紀錄" }],
    },
    {
      id: "deploy",
      x: SIDE_X,
      y: 370,
      title: "GitHub Actions",
      live: `近 90 天部署 ${f.deploys90} 次`,
      heading: "部署 · push 就上線",
      body: [
        "push 到 GitHub，跑在這台桌機上的 GitHub Actions runner 就執行部署腳本：拉新版、build 到沒在用的槽、切換、健檢，沒過自動退回。",
        "部署完清 Cloudflare 快取、通知 Bing 有新內容；履歷內容有變就自動重印 PDF。",
      ],
      facts: [`近 90 天部署 ${f.deploys90} 次，其中自動退回 ${f.rollbacks90} 次`],
      links: [
        { href: "/status", label: "部署紀錄" },
        { href: "/changelog", label: "更新紀錄" },
      ],
    },
    {
      id: "backup",
      x: SIDE_X,
      y: 460,
      title: "每日備份",
      live: `上次 ${ago(f.lastBackup)}`,
      heading: "備份 · 兩個地方、每季演練",
      body: [
        "每天把不在 git 裡、壞了會真的不見的東西（設定檔、Tunnel 憑證、統計資料、排程設定）備份到另一顆實體硬碟，再用 AES-256 加密推到 GitHub 私有 repo。",
        "每季自動從 GitHub 重新下載、解密、跟本機那份逐檔比對——「有備份」跟「還原得回來」是兩回事。",
      ],
      facts: [`上次備份 ${ago(f.lastBackup)}`],
    },
    {
      id: "radar",
      x: SIDE_X,
      y: 100,
      title: "自家雷達",
      live: f.radar ? (f.radar.online ? `現在收到 ${f.radar.aircraftNow} 架` : "離線") : "—",
      heading: "自家雷達 · 樹莓派 ADS-B 接收器",
      body: ["家裡另一台樹莓派收飛機廣播的 ADS-B 訊號、分享給 Flightradar24；server.js 每 30 秒在區網讀一次數字，存成彙總。"],
      facts: f.radar ? [f.radar.online ? `現在收到 ${f.radar.aircraftNow} 架飛機` : "現在離線"] : [],
      links: [{ href: "/radar", label: "自家雷達" }],
    },
  ];
}

/** 方塊之間的線：[起點 x, y, 終點 x, y] 或折線點列 */
const EDGES: { d: string; label?: string; ly?: number; dashed?: boolean }[] = [
  { d: `M165 74 V100` },
  { d: `M165 164 V190` },
  { d: `M165 254 V280` },
  { d: `M165 344 V370` },
  { d: `M165 434 V460` },
  { d: `M350 312 H310`, label: "每 5 分", ly: 326 },
  { d: `M475 280 V254`, dashed: true },
  { d: `M350 402 H310`, label: "部署" },
  { d: `M310 492 H350`, label: "每天", dashed: true },
  { d: `M350 132 H332 V296 H310`, dashed: true },
];

function Diagram({ items }: { items: NodeDef[] }) {
  return (
    <svg viewBox="0 0 620 534" className="w-full h-auto" role="group" aria-label="本站架構圖：點方塊看說明">
      <defs>
        <marker id="arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L8 4 L0 8 z" style={{ fill: "var(--muted)" }} />
        </marker>
      </defs>
      {EDGES.map((e) => (
        <g key={e.d}>
          <path
            d={e.d}
            fill="none"
            style={{ stroke: "var(--muted)" }}
            strokeWidth={1}
            strokeDasharray={e.dashed ? "3 3" : undefined}
            markerEnd="url(#arrow)"
          />
          {e.label && (
            <text x={330} y={e.ly ?? Number(/ (\d+)/.exec(e.d)?.[1]) - 6} textAnchor="middle" fontSize={10} className="fill-(--muted) font-mono">
              {e.label}
            </text>
          )}
        </g>
      ))}
      {items.map((n) => {
        const w = n.x === MAIN_X ? W_MAIN : W_SIDE;
        return (
          <a key={n.id} href={`#${n.id}`} aria-label={`${n.title}：${n.live}`} className="group outline-none">
            <rect
              x={n.x}
              y={n.y}
              width={w}
              height={H}
              rx={3}
              className="fill-(--bg) stroke-(--border) group-hover:stroke-(--accent) group-focus-visible:stroke-(--accent) transition-colors"
              strokeWidth={1.2}
            />
            <text x={n.x + 14} y={n.y + 27} fontSize={15} className="fill-(--text) font-serif">
              {n.title}
            </text>
            <text x={n.x + 14} y={n.y + 48} fontSize={11.5} className="fill-(--accent) font-mono">
              {n.live}
            </text>
          </a>
        );
      })}
    </svg>
  );
}

async function ColophonContent() {
  await connection(); // Cache Components：下面讀的都是即時資料（TODO C13）
  const items = nodes(loadFacts());

  return (
    <Shell>
      <div className="border border-(--border) rounded-sm bg-(--surface) p-3 sm:p-5 mb-12">
        <Diagram items={items} />
      </div>

      <div className="space-y-4">
        {items.map((n) => (
          <section
            key={n.id}
            id={n.id}
            className="scroll-mt-24 border border-(--border) rounded-sm p-4 sm:p-5 transition-colors target:border-(--accent) target:bg-(--accent-lt)"
          >
            <h2 className="text-[15px] sm:text-base font-normal text-(--text) font-serif mb-3">{n.heading}</h2>
            <div className="space-y-2 mb-3">
              {n.body.map((p) => (
                <p key={p} className="text-[14px] sm:text-[13px] font-light text-(--text) leading-relaxed">
                  {p}
                </p>
              ))}
            </div>
            {n.facts && n.facts.length > 0 && (
              <ul className="text-xs text-(--muted) font-mono space-y-1 mb-1">
                {n.facts.map((x) => (
                  <li key={x}>▸ {x}</li>
                ))}
              </ul>
            )}
            {n.links && (
              <p className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                {n.links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="text-xs text-(--accent) underline underline-offset-4 decoration-(--border) hover:decoration-(--accent) font-mono"
                  >
                    {l.label} →
                  </Link>
                ))}
              </p>
            )}
          </section>
        ))}
      </div>

      {/* 站長後台的訪客參觀（TODO G4，2026-11-26）：真的後台要登入，這裡看範例資料版 */}
      <div className="mt-12 border border-(--border) rounded-sm p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div>
          <p className="text-[15px] font-serif text-(--text)">站長後台 · Admin</p>
          <p className="mt-1 text-[13px] font-light text-(--muted) leading-relaxed">
            部署、告警、流量、待辦都集中在一個只有我能登入的後台。想看長什麼樣，可以用範例資料參觀。
          </p>
        </div>
        <Link
          href="/demo/admin"
          className="shrink-0 inline-flex items-center justify-center h-10 px-4 rounded-sm border border-(--accent) text-sm text-(--accent) hover:bg-(--accent-lt) transition-colors"
        >
          訪客參觀 →
        </Link>
      </div>

      <p className="text-xs text-(--muted) font-light mt-12 leading-relaxed">
        原始碼都在 GitHub（網站本身、部署腳本、watchdog）。字體：Noto Serif JP、Geist、Geist Mono。
      </p>
    </Shell>
  );
}

// 頁首（標題、說明）是 build 時就畫好的外殼；內容讀即時資料，訪客打開時才串流補進來（Cache Components，TODO C13）
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <PageShell
      eyebrow="Colophon"
      title={<>本站構造 &nbsp;·&nbsp; Colophon</>}
      intro="這個網站沒有租雲端主機，跑在我家的桌機上。下面是一個請求從你的瀏覽器到桌機、再回去的路；點方塊看說明，數字都是現在的值。"
    >
      {children}
    </PageShell>
  );
}

export default function ColophonPage() {
  return (
    <Suspense
      fallback={
        <Shell>
          <LoadingBlock label="讀取即時數字中…" minHeight={1000} />
        </Shell>
      }
    >
      <ColophonContent />
    </Suspense>
  );
}
