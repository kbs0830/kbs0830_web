import type { Metadata } from "next";
import { withShare } from "@/lib/site/share-meta";
import PageShell from "@/components/layout/PageShell";
import BulletList from "@/components/ui/BulletList";
import { nowItems } from "@/lib/content/page-content";

export const metadata: Metadata = withShare({
  title: "近況 · 現在在做什麼、在學什麼 — PINGWEI LI",
  description: "PINGWEI LI 的近況：現在在做的專案、在學的技術（React Three Fiber、WebGL Shader、本地端 ML 推論），不定期更新。",
  alternates: { canonical: "/now", types: { "text/markdown": "/now.md" } },
}, { ownImage: true });

export default function NowPage() {
  return (
    <PageShell
      eyebrow="Now"
      title={<>現在 &nbsp;·&nbsp; What I&apos;m doing</>}
      intro={
        <>
          這頁寫我最近在忙什麼，想到就更新。
          <br />
          點子來自{" "}
          <a
            href="https://nownownow.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-(--accent) hover:opacity-70 transition-opacity"
          >
            nownownow.com
          </a>
          。
        </>
      }
    >
      <BulletList items={nowItems} className="space-y-4" />
    </PageShell>
  );
}
