import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import AdminShell from "@/components/admin/AdminShell";
import DecisionTable from "@/components/admin/DecisionTable";
import LogList from "@/components/admin/LogList";
import LoadingBlock from "@/components/ui/LoadingBlock";
import PageShell from "@/components/layout/PageShell";
import SectionHeading from "@/components/ui/SectionHeading";
import { listDecisions, recentEvents } from "@/lib/admin/db";
import { readTodo } from "@/lib/admin/todo";

// 站長後台 · 待辦決策表（TODO G1「決策表」）：TODO.md 每一項選先做／之後／不做，存在 data/admin.db。
// Claude 開工前用 `node scripts/admin-db.js decisions` 讀「先做」的清單。
export const metadata: Metadata = { title: "待辦" };

const intro = "TODO.md 裡每一項選「先做／之後／不做」，可以加備註。Claude 開工前會照「先做」排順序。";

export default function Page() {
  return (
    <Suspense fallback={<PageShell eyebrow="站長後台 · Admin" title="待辦" intro={intro}><LoadingBlock /></PageShell>}>
      <AdminTodo />
    </Suspense>
  );
}

async function AdminTodo() {
  await connection();
  const items = readTodo();
  const decisions = listDecisions();
  const events = recentEvents(10);
  return (
    <AdminShell title="待辦" intro={intro}>
      {items.length === 0 ? (
        <p className="text-sm font-light text-(--warn) mb-12">讀不到 TODO.md。</p>
      ) : (
        <DecisionTable items={items} decisions={decisions} />
      )}
      <section>
        <SectionHeading as="h2" en="Log">最近的操作</SectionHeading>
        <LogList rows={events.map((e) => ({ time: new Date(e.at).toISOString(), text: `${e.action}：${e.detail}` }))} empty="還沒有操作。" />
      </section>
    </AdminShell>
  );
}
