const items = [
  { title: "Pads", caption: "Monthly protection" },
  { title: "Underwear", caption: "The basics of comfort" },
  { title: "Soap", caption: "Hygiene she can keep" },
  { title: "Notebook", caption: "School, still hers" },
];

export function DignityObjects() {
  return (
    <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="What a dignity kit can hold">
      {items.map((item) => (
        <li key={item.title} className="kit-card">
          <p className="font-display text-xl">{item.title}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-ivory/55">{item.caption}</p>
        </li>
      ))}
    </ul>
  );
}
