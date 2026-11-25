import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import AdminShell, { AdminSection, AdminTiles } from "@/components/admin/AdminShell";
import LoadingBlock from "@/components/ui/LoadingBlock";
import PageShell from "@/components/layout/PageShell";
import { ShareList } from "@/components/ui/StatCharts";
import { buildReport, resolveRange } from "@/lib/stats/reports";
import { pageTitle } from "@/lib/site/page-title";
import { nf } from "@/lib/format";

// 站長後台 · 流量（TODO A1）：公開的 /stats 看不到的細節（未過濾流量、爬蟲、404），資料跟週報同一份 buildReport
export const metadata: Metadata = { title: "流量" };

const intro = "這週（週一起）公開的 /stats 看不到的細節：未過濾流量、爬蟲、404。";
const RAW: Record<string, string> = { browser: "瀏覽器", ai: "AI 爬蟲", search: "搜尋引擎", bot: "其他機器人" };

export default function Page() {
  return (
    <Suspense fallback={<PageShell compact eyebrow="站長後台 · Admin" title="流量" intro={intro}><LoadingBlock /></PageShell>}>
      <AdminTraffic />
    </Suspense>
  );
}

async function AdminTraffic() {
  await connection();
  const now = new Date();
  const r = buildReport(resolveRange("week", undefined, now), now);
  const rawEntries: [string, number][] = r.raw ? Object.entries(RAW).map(([k, name]) => [name, r.raw!.cur[k] ?? 0]) : [];
  const rawTotal = rawEntries.reduce((n, [, v]) => n + v, 0);
  const sum = (e: [string, number][]) => e.reduce((n, [, v]) => n + v, 0);
  return (
    <AdminShell title="流量" intro={intro}>
      <AdminTiles
        items={[
          { label: "真人造訪", value: nf.format(r.visitors.cur.sessions), tone: "info" },
          { label: "瀏覽頁數", value: nf.format(r.visitors.cur.views), tone: "info" },
          { label: "全部請求（含機器人）", value: nf.format(rawTotal) },
          { label: "404", value: nf.format(r.notFound?.total ?? 0), tone: (r.notFound?.total ?? 0) > 0 ? "warn" : "ok" },
        ]}
      />
      {r.raw && (
        <AdminSection title="誰在打網站" en="Raw traffic">
          <ShareList entries={rawEntries} total={rawTotal} />
          {r.raw.names.length > 0 && (
            <p className="mt-3 text-[13px] font-light text-(--muted) leading-relaxed">
              機器人前幾名：{r.raw.names.slice(0, 8).map(([n, v]) => `${n} ${nf.format(v)}`).join("、")}
            </p>
          )}
        </AdminSection>
      )}
      <AdminSection title="熱門頁面" en="Pages">
        <ShareList entries={r.pages.slice(0, 10).map(([p, v]) => [pageTitle(p), v])} total={sum(r.pages)} />
      </AdminSection>
      <AdminSection title="來源" en="Referrers">
        <ShareList entries={r.refKinds} total={sum(r.refKinds)} />
      </AdminSection>
      {r.notFound && r.notFound.paths.length > 0 && (
        <AdminSection title="404 網址" en="Not found">
          <ShareList entries={r.notFound.paths.slice(0, 15)} total={r.notFound.total} />
          <p className="mt-3 text-[13px] font-light text-(--muted)">其中掃描器（找 .env、wp-admin 這類）{nf.format(r.notFound.scanners)} 次。</p>
        </AdminSection>
      )}
    </AdminShell>
  );
}
