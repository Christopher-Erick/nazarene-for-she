export function PageIntro({
  kicker,
  title,
  children,
  dark = false,
}: {
  kicker: string;
  title: string;
  children?: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <header className={dark ? "bleed-hero theme-band" : "bg-background"}>
      <div className={`mx-auto max-w-6xl px-5 pb-16 sm:px-8 lg:pb-20 ${dark ? "pt-28 lg:pt-32" : "pt-20 lg:pt-24"}`}>
        <p className={`eyebrow ${dark ? "text-accent" : "text-primary"}`}>{kicker}</p>
        <h1 className="display-lg mt-5 max-w-4xl">{title}</h1>
        {children ? (
          <div className={`prose-nfs mt-6 ${dark ? "theme-muted" : ""}`}>{children}</div>
        ) : null}
      </div>
    </header>
  );
}
