export function Steps({
  steps,
  columns = 3,
}: {
  steps: readonly { title: string; text: string }[];
  columns?: 2 | 3 | 4;
}) {
  const cols = { 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-2 lg:grid-cols-4" }[
    columns
  ];
  return (
    <ol className={`grid gap-4 ${cols}`}>
      {steps.map((s, i) => (
        <li key={s.title} className="surface relative p-6">
          <span className="font-display text-brand-cyan text-sm font-bold">
            {String(i + 1).padStart(2, "0")}
          </span>
          <h3 className="text-fg mt-2 font-semibold">{s.title}</h3>
          <p className="text-fg-muted mt-1.5 text-sm leading-relaxed">{s.text}</p>
        </li>
      ))}
    </ol>
  );
}
