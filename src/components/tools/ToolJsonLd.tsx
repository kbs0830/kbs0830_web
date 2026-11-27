import JsonLd from "@/components/ui/JsonLd";
import { breadcrumbLd, webApplicationLd } from "@/lib/site/json-ld";
import { TOOL_PAGES } from "@/lib/site/site-map";

// 工具頁的結構化資料（TODO V7，2026-11-27）：WebApplication＋麵包屑（首頁 › 小工具 › 這個工具）。
// 名稱、說明取自 lib/site/site-map.ts 的 TOOL_PAGES（跟 /tools、Ctrl+K 同一份），所以新增工具只要加進那裡、頁面放這個元件就好。
export default function ToolJsonLd({ href }: { href: string }) {
  const tool = TOOL_PAGES.find((t) => t.href === href);
  if (!tool) return null;
  return (
    <>
      <JsonLd data={webApplicationLd({ name: tool.zh, description: tool.desc, path: tool.href })} />
      <JsonLd
        data={breadcrumbLd([
          { name: "首頁", path: "" },
          { name: "小工具", path: "/tools" },
          { name: tool.zh, path: tool.href },
        ])}
      />
    </>
  );
}
