// 標題上方的小標籤。純文字時加 data-scramble：桌機捲進畫面會先變亂碼再解開（DesktopFX）
export default function Eyebrow({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      data-scramble={typeof children === "string" ? "" : undefined}
      className={`text-xs tracking-[0.35em] text-(--muted) uppercase ${className} font-mono`}
    >
      {children}
    </p>
  );
}
