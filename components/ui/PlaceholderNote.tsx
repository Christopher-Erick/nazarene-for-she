export function PlaceholderNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted">
      <span className="placeholder-chip">Placeholder</span>
      <span>{children}</span>
    </p>
  );
}
