import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import AdminShell, { AdminSection } from "@/components/admin/AdminShell";
import DecisionTable from "@/components/admin/DecisionTable";
import LogList from "@/components/admin/LogList";
import LoadingBlock from "@/components/ui/LoadingBlock";
import PageShell from "@/components/layout/PageShell";
import { listDecisions, recentEvents } from "@/lib/admin/db";
import { readTodo, withoutDetail } from "@/lib/admin/todo";

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
  "todo.ask": "Claude 提問",
  "todo.say": "Claude 備註",
  "blog.review": "文章審批",
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
  // 已完成的不送（歷史在 /admin/done；TODO S2，2026-11-27：待辦頁 396KB 裡 59 項已完成的根本不顯示）。「評估過不做」留著，詳細說明點了才抓
  const all = readTodo({ all: true });
  const items = all.filter((i) => i.status !== "done");
  // 已完成項目的決定也不送：不然它們對不到畫面上的項目，全被當成「待辦裡已經找不到的決定」列出來
  // （2026-11-28 使用者：「這裡面的東西都不見了？！」——其實是做完了，在 /admin/done）。真的已經不存在的項目才會出現在那一區
  const doneIds = new Set(all.filter((i) => i.status === "done").map((i) => i.id));
  const decisions = listDecisions().filter((d) => !doneIds.has(d.itemId));
  const events = recentEvents(10);
  return (
    <AdminShell title="待辦" intro={intro}>
      {items.length === 0 ? (
        <p className="text-sm font-light text-(--warn) mb-12">還沒有待辦（data/admin.db 的 todos 表是空的，TODO.md 也讀不到）。</p>
      ) : (
        <DecisionTable items={withoutDetail(items)} decisions={decisions} />
      )}
      <div className="mt-8">
        <AdminSection title="最近的操作" en="Log">
          <LogList limit={3} rows={events.map((e) => ({ time: new Date(e.at).toISOString(), text: `${ACTION[e.action] ?? e.action}：${e.detail}` }))} empty="還沒有操作。" />
        </AdminSection>
      </div>
    </AdminShell>
  );
}
