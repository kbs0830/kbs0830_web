import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import LogList from "@/components/admin/LogList";
import LoadingBlock from "@/components/ui/LoadingBlock";
import PageShell from "@/components/layout/PageShell";
import SectionHeading from "@/components/ui/SectionHeading";
import { Tiles } from "@/components/ui/StatCharts";
import { ADMIN_PAGES } from "@/lib/admin/nav";
import { ALERT_TAGS, DEPLOY_RESULT, nextReportTimes, readWatchdog } from "@/lib/admin/data";
import { readSiteFacts } from "@/lib/ops/colophon";
import { readDeploys } from "@/lib/ops/status";
import { presenceCount } from "@/lib/stats/presence";
import { buildReport, resolveRange } from "@/lib/stats/reports";
import { nf, twDateTime } from "@/lib/format";

// 站長後台 · 總覽（TODO A1）
export const metadata: Metadata = { title: "總覽" };

const intro = "網站現在的狀況一眼看完。";

export default function Page() {
  return (
    <Suspense fallback={<PageShell eyebrow="站長後台 · Admin" title="總覽" intro={intro}><LoadingBlock /></PageShell>}>
      <AdminOverview />
    </Suspense>
  );
}

async function AdminOverview() {
  await connection();
  const now = new Date();
  const facts = readSiteFacts(now.getTime());
  const today = buildReport(resolveRange("day", undefined, now), now);
  const last = readDeploys().find((d) => d.result !== "running");
  const alerts = readWatchdog().filter((l) => ALERT_TAGS.has(l.tag)).slice(0, 5);
  const next = nextReportTimes(now);
  return (
    <AdminShell title="總覽" intro={intro}>
      <Tiles
        items={[
          [nf.format(today.visitors.cur.sessions), "今天訪客"],
          [nf.format(presenceCount()), "現在線上"],
          [last ? `${DEPLOY_RESULT[last.result]} ${twDateTime(last.start)}` : "—", "上次部署"],
          [facts.radar ? (facts.radar.online ? `在線 ${facts.radar.aircraftNow} 架` : "離線") : "—", "自家雷達"],
          [facts.uptime30 === null ? "—" : `${(facts.uptime30 * 100).toFixed(2)}%`, "30 天可用率"],
          [`${facts.memoryMB} MB`, "記憶體"],
          [twDateTime(next.week), "下一封週報"],
          [twDateTime(next.month), "下一封月報"],
        ]}
      />
      <section className="mb-12">
        <SectionHeading as="h2" en="Alerts">最近的告警</SectionHeading>
        <LogList rows={alerts.map((a) => ({ time: a.time, text: a.text, warn: a.tag === "FAILED" || a.tag === "WARN" }))} />
      </section>
      <ul className="grid gap-3 sm:grid-cols-2">
        {ADMIN_PAGES.filter((p) => p.href !== "/admin").map((p) => (
          <li key={p.href}>
            <Link href={p.href} className="block h-full border border-(--border) rounded-sm p-5 hover:border-(--accent) transition-colors">
              <p className="text-base font-light text-(--text)">
                {p.label}
                <span className="ml-2 font-mono text-[11px] tracking-wide text-(--muted)">{p.en}</span>
              </p>
              <p className="mt-1.5 text-[13px] font-light text-(--muted) leading-relaxed">{p.desc}</p>
            </Link>
          </li>
        ))}
      </ul>
    </AdminShell>
  );
}
