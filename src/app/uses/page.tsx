import type { Metadata } from "next";
import { withShare } from "@/lib/site/share-meta";
import { Fragment } from "react";
import PageShell from "@/components/layout/PageShell";
import SectionHeading from "@/components/ui/SectionHeading";
import BulletList from "@/components/ui/BulletList";
import { usesGroups } from "@/lib/content/page-content";

export const metadata: Metadata = withShare({
  title: "開発環境 · 我用的工具（RTX 3070、Claude Code） — PINGWEI LI",
  description: "PINGWEI LI 的開発環境與工具清單：桌機（i7-12700＋RTX 3070，也是這個網站的主機）、筆電、Claude Code、自架網站用到的軟體。",
  alternates: { canonical: "/uses", types: { "text/markdown": "/uses.md" } },
}, { ownImage: true });

export default function UsesPage() {
  return (
    <PageShell eyebrow="Uses" title={<>開発環境 &nbsp;·&nbsp; 我用的工具</>} intro="寫程式、旅行時真的每天在用的東西。">
      <div className="space-y-10">
        {usesGroups.map((group) => (
          <div key={group.title}>
            <SectionHeading>{group.title}</SectionHeading>
            <BulletList
              items={group.items.map((item) => (
                <Fragment key={item.name}>
                  {item.name}
                  <span className="text-(--muted)"> — {item.detail}</span>
                </Fragment>
              ))}
            />
          </div>
        ))}
      </div>
    </PageShell>
  );
}
