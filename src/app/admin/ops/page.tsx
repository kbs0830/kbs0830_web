import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import AdminShell, { AdminSection, AdminTiles } from "@/components/admin/AdminShell";
import LogList from "@/components/admin/LogList";
import LoadingBlock from "@/components/ui/LoadingBlock";
import PageShell from "@/components/layout/PageShell";
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
    <Suspense fallback={<PageShell compact eyebrow="站長後台 · Admin" title="維運" intro={intro}><LoadingBlock /></PageShell>}>
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
      <AdminTiles
        items={[
          { label: "線上 build 槽", value: facts.slot, tone: "info" },
          { label: "這次啟動多久", value: days > 0 ? `${days} 天` : `${Math.round(facts.processUptime / 3600)} 小時` },
          { label: "上次備份", value: facts.lastBackup ? twDateTime(facts.lastBackup) : "—", tone: facts.lastBackup ? "ok" : "warn" },
          { label: "90 天部署／退回", value: `${facts.deploys90}／${facts.rollbacks90}`, tone: facts.rollbacks90 > 0 ? "warn" : "ok" },
        ]}
      />
      <AdminSection title="部署" en="Deploys" count={deploys.length}>
        <LogList
          limit={6}
          rows={deploys.map((d) => ({
            time: d.start,
            text: `${DEPLOY_RESULT[d.result]}${d.seconds !== undefined ? `・${d.seconds} 秒` : ""}`,
            tone: d.result === "failed" || d.result === "rollback" ? "warn" : d.result === "running" ? undefined : "ok",
          }))}
        />
      </AdminSection>
      <AdminSection title="重啟紀錄" en="Restarts" count={restarts.length}>
        <LogList limit={5} rows={restarts.map((r) => ({ time: r.time, text: `${KIND[r.kind]}・${r.auto ? "watchdog 自動救回" : "要人處理"}`, tone: r.auto ? "ok" : "warn" }))} />
      </AdminSection>
      <AdminSection title="watchdog 告警" en="Watchdog" count={alerts.length}>
        <LogList limit={6} rows={alerts.map((a) => ({ time: a.time, text: a.text, tone: a.tag === "FAILED" || a.tag === "WARN" ? "warn" : "ok" }))} />
      </AdminSection>
    </AdminShell>
  );
}
