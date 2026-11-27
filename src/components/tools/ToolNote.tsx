import type { ReactNode } from "react";
import { RelatedPostsForTool } from "@/components/content/RelatedLinks";

// 每個工具頁最下面的一段：資料從哪來、這個工具怎麼做的（工具帶流量、作品集接住流量，決策表 J 系列的共同規則）
// href：這個工具的網址；有傳就在最後列「相關記事」（TODO V8，對應表在 lib/site/related.ts）
export default function ToolNote({ children, href }: { children: ReactNode; href?: string }) {
  return (
    <>
      <div className="mt-16 pt-6 border-t border-(--border) text-xs text-(--muted) font-light leading-relaxed space-y-2">{children}</div>
      {href && <RelatedPostsForTool href={href} />}
    </>
  );
}
