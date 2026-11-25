import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import AdminShell from "@/components/admin/AdminShell";
import LogList from "@/components/admin/LogList";
import LoadingBlock from "@/components/ui/LoadingBlock";
import PageShell from "@/components/layout/PageShell";
import SectionHeading from "@/components/ui/SectionHeading";
import { Tiles } from "@/components/ui/StatCharts";
import { MAIL_TAGS, nextReportTimes, readMailState, readWatchdog } from "@/lib/admin/data";
import { twDateTime } from "@/lib/format";

// 站長後台 · 寄信（TODO A1）。預覽、重寄是寫入類動作，第二步再加（要防 CSRF）
export const metadata: Metadata = { title: "寄信" };

const intro = "週報、月報寄到通知信箱的紀錄。預覽、重寄之後再加。";

export default function Page() {
  return (
    <Suspense fallback={<PageShell eyebrow="站長後台 · Admin" title="寄信" intro={intro}><LoadingBlock /></PageShell>}>
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
      <Tiles
        items={[
          [state?.week ?? "—", "最後寄出的週報（週一）"],
          [state?.month ?? "—", "最後寄出的月報"],
          [twDateTime(next.week), "下一封週報"],
          [twDateTime(next.month), "下一封月報"],
        ]}
      />
      <section>
        <SectionHeading as="h2" en="History">寄送紀錄</SectionHeading>
        <LogList rows={history.map((h) => ({ time: h.time, text: h.text, warn: h.tag === "WARN" }))} />
      </section>
    </AdminShell>
  );
}
