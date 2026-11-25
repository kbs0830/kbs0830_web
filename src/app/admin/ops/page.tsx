import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import AdminShell from "@/components/admin/AdminShell";
import LogList from "@/components/admin/LogList";
import LoadingBlock from "@/components/ui/LoadingBlock";
import PageShell from "@/components/layout/PageShell";
import SectionHeading from "@/components/ui/SectionHeading";
import { Tiles } from "@/components/ui/StatCharts";
import { ALERT_TAGS, DEPLOY_RESULT, readWatchdog } from "@/lib/admin/data";
import { readSiteFacts } from "@/lib/ops/colophon";
import { readDeploys, readRestarts } from "@/lib/ops/status";
import { twDateTime } from "@/lib/format";

// 站長後台 · 維運（TODO A1）
export const metadata: Metadata = { title: "維運" };

const intro = "部署、重啟、告警、備份。";
const KIND = { site: "網站", tunnel: "Tunnel", runner: "Runner" } as const;

export default function Page() {
  return (
    <Suspense fallback={<PageShell eyebrow="站長後台 · Admin" title="維運" intro={intro}><LoadingBlock /></PageShell>}>
      <AdminOps />
    </Suspense>
  );
}

async function AdminOps() {
  await connection();
  const facts = readSiteFacts();
  const deploys = readDeploys().slice(0, 20);
  const restarts = readRestarts().slice(0, 10);
  const alerts = readWatchdog().filter((l) => ALERT_TAGS.has(l.tag)).slice(0, 30);
  const days = Math.floor(facts.processUptime / 86400);
  return (
    <AdminShell title="維運" intro={intro}>
      <Tiles
        items={[
          [facts.slot, "線上 build 槽"],
          [days > 0 ? `${days} 天` : `${Math.round(facts.processUptime / 3600)} 小時`, "這次啟動多久"],
          [facts.lastBackup ? twDateTime(facts.lastBackup) : "—", "上次備份"],
          [`${facts.deploys90}／${facts.rollbacks90}`, "90 天部署／退回"],
        ]}
      />
      <section className="mb-12">
        <SectionHeading as="h2" en="Deploys">最近 20 次部署</SectionHeading>
        <LogList
          rows={deploys.map((d) => ({
            time: d.start,
            text: `${DEPLOY_RESULT[d.result]}${d.seconds !== undefined ? `・${d.seconds} 秒` : ""}`,
            warn: d.result === "failed" || d.result === "rollback",
          }))}
        />
      </section>
      <section className="mb-12">
        <SectionHeading as="h2" en="Restarts">重啟紀錄</SectionHeading>
        <LogList rows={restarts.map((r) => ({ time: r.time, text: `${KIND[r.kind]}・${r.auto ? "watchdog 自動救回" : "要人處理"}`, warn: !r.auto }))} />
      </section>
      <section>
        <SectionHeading as="h2" en="Watchdog">watchdog 告警</SectionHeading>
        <LogList rows={alerts.map((a) => ({ time: a.time, text: a.text, warn: a.tag === "FAILED" || a.tag === "WARN" }))} />
      </section>
    </AdminShell>
  );
}
