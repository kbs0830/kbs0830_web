import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import AdminShell, { AdminSection } from "@/components/admin/AdminShell";
import DecisionTable from "@/components/admin/DecisionTable";
import LogList from "@/components/admin/LogList";
import LoadingBlock from "@/components/ui/LoadingBlock";
import PageShell from "@/components/layout/PageShell";
import { listDecisions, recentEvents } from "@/lib/admin/db";
import { readTodo } from "@/lib/admin/todo";

// 站長後台 · 待辦決策表（TODO G1「決策表」）：TODO.md 每一項選先做／之後／不做，存在 data/admin.db。
// Claude 開工前用 `node scripts/admin-db.js decisions` 讀「先做」的清單。
const ACTION: Record<string, string> = {
  "decision.set": "決定",
  "decision.clear": "取消決定",
  "todo.add": "新增",
  "todo.edit": "修改",
  "todo.done": "完成",
  "todo.drop": "不做",
  "todo.reopen": "重開",
  "todo.import": "匯入",
};

export const metadata: Metadata = { title: "待辦" };

const intro = "每一項選先做／之後／不做，點「完整說明」看細節。Claude 新增、完成待辦都直接寫進這裡。";

export default function Page() {
  return (
    <Suspense fallback={<PageShell compact eyebrow="站長後台 · Admin" title="待辦" intro={intro}><LoadingBlock /></PageShell>}>
      <AdminTodo />
    </Suspense>
  );
}

async function AdminTodo() {
  await connection();
  const items = readTodo({ all: true });
  const decisions = listDecisions();
  const events = recentEvents(10);
  return (
    <AdminShell title="待辦" intro={intro}>
      {items.length === 0 ? (
        <p className="text-sm font-light text-(--warn) mb-12">還沒有待辦（data/admin.db 的 todos 表是空的，TODO.md 也讀不到）。</p>
      ) : (
        <DecisionTable items={items} decisions={decisions} />
      )}
      <div className="mt-8">
        <AdminSection title="最近的操作" en="Log">
          <LogList limit={3} rows={events.map((e) => ({ time: new Date(e.at).toISOString(), text: `${ACTION[e.action] ?? e.action}：${e.detail}` }))} empty="還沒有操作。" />
        </AdminSection>
      </div>
    </AdminShell>
  );
}
