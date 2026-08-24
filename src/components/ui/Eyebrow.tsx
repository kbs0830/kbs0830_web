export default function Eyebrow({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`text-xs tracking-[0.35em] text-(--muted) uppercase ${className}`}
      style={{ fontFamily: "var(--font-mono)" }}
    >
      {children}
    </p>
  );
}
