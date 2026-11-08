import type { Metadata } from "next";
import { withShare } from "@/lib/share-meta";
import { Fragment } from "react";
import PageShell from "@/components/ui/PageShell";
import SectionHeading from "@/components/ui/SectionHeading";
import BulletList from "@/components/ui/BulletList";
import { usesGroups } from "@/lib/page-content";

export const metadata: Metadata = withShare({
  title: "/uses — PINGWEI LI",
  description: "開発環境・硬體・軟體工具清單",
  alternates: { canonical: "/uses", types: { "text/markdown": "/uses.md" } },
});

export default function UsesPage() {
  return (
    <PageShell eyebrow="Uses" title={<>開発環境 &nbsp;·&nbsp; 我用的工具</>} intro="硬體、軟體與日常開發用的工具清單。">
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
