import Link from "next/link";

export function AdminHeader({
  kicker,
  title,
  children,
  previewHref,
  previewLabel,
}: {
  kicker?: string;
  title: string;
  children?: React.ReactNode;
  previewHref?: string;
  previewLabel?: string;
}) {
  return (
    <header className="admin-header">
      <div>
        {kicker ? <p className="eyebrow text-accent">{kicker}</p> : null}
        <h1 className="font-display text-4xl">{title}</h1>
        {children ? <div className="mt-2 max-w-2xl text-muted">{children}</div> : null}
      </div>
      {previewHref ? (
        <Link className="btn btn-ghost" href={previewHref} target="_blank" rel="noreferrer">
          {previewLabel ?? "View on the website"}
        </Link>
      ) : null}
    </header>
  );
}
