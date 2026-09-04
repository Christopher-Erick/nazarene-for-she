import Link from "next/link";

export function AdminHeader({
  kicker,
  title,
  children,
  previewHref,
  previewLabel,
  actions,
}: {
  kicker?: string;
  title: string;
  children?: React.ReactNode;
  previewHref?: string;
  previewLabel?: string;
  actions?: React.ReactNode;
}) {
  const hasActions = Boolean(previewHref || actions);

  return (
    <header className="admin-header">
      <div>
        {kicker ? <p className="eyebrow text-accent">{kicker}</p> : null}
        <h1 className="font-display">{title}</h1>
        {children ? <div className="admin-header__lede">{children}</div> : null}
      </div>
      {hasActions ? (
        <div className="admin-header__actions">
          {previewHref ? (
            <Link className="btn btn-ghost" href={previewHref} target="_blank" rel="noreferrer">
              {previewLabel ?? "View on the website"}
            </Link>
          ) : null}
          {actions}
        </div>
      ) : null}
    </header>
  );
}
