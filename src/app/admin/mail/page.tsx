import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import AdminShell, { AdminSection, AdminTiles } from "@/components/admin/AdminShell";
import LogList from "@/components/admin/LogList";
import LoadingBlock from "@/components/ui/LoadingBlock";
import PageShell from "@/components/layout/PageShell";
import { MAIL_TAGS, nextReportTimes, readMailState, readWatchdog } from "@/lib/admin/data";
import { twDateTime } from "@/lib/format";

// 站長後台 · 寄信（TODO A1）。預覽、重寄是寫入類動作，第二步再加（要防 CSRF）
export const metadata: Metadata = { title: "寄信" };

const intro = "週報、月報寄到通知信箱的紀錄。預覽、重寄之後再加。";

export default function Page() {
  return (
    <Suspense fallback={<PageShell compact eyebrow="站長後台 · Admin" title="寄信" intro={intro}><LoadingBlock /></PageShell>}>
      <AdminMail />
    </Suspense>
  );
}

async function AdminMail() {
  await connection();
  const state = readMailState();
  const next = nextReportTimes();
  const history = readWatchdog()
    .filter((l) => MAIL_TAGS.has(l.tag) || (l.tag === "WARN" && /週報|月報/.test(l.text)))
    .slice(0, 20);
  return (
    <AdminShell title="寄信" intro={intro}>
      <AdminTiles
        items={[
          { label: "最後寄出的週報", value: state?.week ?? "—", tone: state?.week ? "ok" : "muted" },
          { label: "最後寄出的月報", value: state?.month ?? "—", tone: state?.month ? "ok" : "muted" },
          { label: "下一封週報", value: twDateTime(next.week), tone: "info" },
          { label: "下一封月報", value: twDateTime(next.month), tone: "info" },
        ]}
      />
      <AdminSection title="寄送紀錄" en="History" count={history.length}>
        <LogList limit={8} rows={history.map((h) => ({ time: h.time, text: h.text, tone: h.tag === "WARN" ? "warn" : "ok" }))} />
      </AdminSection>
    </AdminShell>
  );
}
