export default function TagBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2 py-0.5 text-[11px] font-light text-(--muted) bg-(--surface) border border-(--border) rounded-sm">
      {children}
    </span>
  );
}
