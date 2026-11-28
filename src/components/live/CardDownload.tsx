"use client";

import { useState } from "react";

// 把頁面上那張 SVG 圖卡畫成 PNG 存檔（SVG → <img> → canvas → blob）。
// 字型用系統裡有的（SVG 當圖片載入時抓不到網頁字型），Windows 上會落到微軟正黑體／新細明體等。
export default function CardDownload({ svgId, file, width, height }: { svgId: string; file: string; width: number; height: number }) {
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");

  async function download() {
    setState("busy");
    try {
      const svg = document.getElementById(svgId);
      if (!(svg instanceof SVGSVGElement)) throw new Error("找不到圖卡");
      const clone = svg.cloneNode(true) as SVGSVGElement;
      clone.setAttribute("width", String(width));
      clone.setAttribute("height", String(height));
      clone.removeAttribute("style");
      const xml = new XMLSerializer().serializeToString(clone);
      const img = new Image();
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas 不能用");
      ctx.drawImage(img, 0, 0, width, height);
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
      if (!blob) throw new Error("轉 PNG 失敗");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${file}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setState("idle");
    } catch {
      setState("error");
    }
  }

  return (
    <button
      type="button"
      onClick={download}
      disabled={state === "busy"}
      className="rounded-sm border border-(--border) px-3 py-1.5 text-sm font-light hover:border-(--accent) hover:text-(--accent) transition-colors disabled:opacity-50"
    >
      {state === "busy" ? "轉換中…" : state === "error" ? "失敗，再試一次" : "下載 PNG"}
    </button>
  );
}
