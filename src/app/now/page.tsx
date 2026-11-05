import type { Metadata } from "next";
import PageShell from "@/components/ui/PageShell";
import BulletList from "@/components/ui/BulletList";
import { nowItems } from "@/lib/page-content";

export const metadata: Metadata = {
  title: "/now — PINGWEI LI",
  description: "現在在做什麼、在學什麼",
  alternates: { canonical: "/now", types: { "text/markdown": "/now.md" } },
};

export default function NowPage() {
  return (
    <PageShell
      eyebrow="Now"
      title={<>現在 &nbsp;·&nbsp; What I&apos;m doing</>}
      intro={
        <>
          這個頁面記錄我當下的狀態，會不定期更新。
          <br />
          靈感來自{" "}
          <a
            href="https://nownownow.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-(--accent) hover:opacity-70 transition-opacity"
          >
            nownownow.com
          </a>{" "}
          的傳統。
        </>
      }
    >
      <BulletList items={nowItems} className="space-y-4" />
    </PageShell>
  );
}
