import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import AdminShell, { AdminSection, AdminTiles } from "@/components/admin/AdminShell";
import LogList from "@/components/admin/LogList";
import LoadingBlock from "@/components/ui/LoadingBlock";
import PageShell from "@/components/layout/PageShell";
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
    <Suspense fallback={<PageShell compact eyebrow="站長後台 · Admin" title="總覽" intro={intro}><LoadingBlock /></PageShell>}>
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
      <AdminTiles
        items={[
          { label: "今天訪客", value: nf.format(today.visitors.cur.sessions), tone: "info" },
          { label: "現在線上", value: nf.format(presenceCount()), tone: "info" },
          {
            label: "上次部署",
            value: last ? DEPLOY_RESULT[last.result] : "—",
            sub: last ? twDateTime(last.start) : undefined,
            tone: !last ? "muted" : last.result === "failed" || last.result === "rollback" ? "warn" : "ok",
          },
          {
            label: "自家雷達",
            value: facts.radar ? (facts.radar.online ? `在線・${facts.radar.aircraftNow} 架` : "離線") : "—",
            tone: !facts.radar ? "muted" : facts.radar.online ? "ok" : "warn",
          },
          {
            label: "30 天可用率",
            value: facts.uptime30 === null ? "—" : `${(facts.uptime30 * 100).toFixed(2)}%`,
            tone: facts.uptime30 === null ? "muted" : facts.uptime30 >= 0.995 ? "ok" : "warn",
          },
          { label: "記憶體", value: `${facts.memoryMB} MB` },
          { label: "下一封週報", value: twDateTime(next.week) },
          { label: "下一封月報", value: twDateTime(next.month) },
        ]}
      />
      <AdminSection title="最近的告警" en="Alerts" count={alerts.length}>
        <LogList rows={alerts.map((a) => ({ time: a.time, text: a.text, tone: a.tag === "FAILED" || a.tag === "WARN" ? "warn" : "ok" }))} empty="最近沒有告警。" />
      </AdminSection>
    </AdminShell>
  );
}
