import type { ReactNode } from "react";

// 展開/收合到內容實際高度。用 grid-template-rows 0fr ↔ 1fr 的 transition
// 取代 framer 的 animate={{ height: "auto" }}，所有瀏覽器都支援、不需要 JS 量高度。
// 收合時加 inert：裡面的東西不能被 Tab 到、也不會被螢幕閱讀器讀出來。
export default function Collapse({
  open,
  children,
  className = "",
}: {
  open: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      inert={!open}
      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-(--ease-ma) ${
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      } ${className}`}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}
