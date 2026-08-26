const words = [
  "Dignity",
  "Knowledge",
  "Faith",
  "Skill",
  "Opportunity",
  "Independence",
  "Transformation",
];

export function WordRiver({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const color = tone === "dark" ? "text-ivory/18" : "text-primary/20";
  const row = [...words, ...words];

  return (
    <div className={`word-river ${tone === "dark" ? "bg-plum" : "bg-background"}`} aria-hidden="true">
      <div className={`word-river-track font-display ${color}`}>
        {row.map((word, index) => (
          <span key={`${word}-${index}`}>
            {word}
            <span className="text-accent/50"> — </span>
          </span>
        ))}
      </div>
    </div>
  );
}
