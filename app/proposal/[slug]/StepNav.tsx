const STEPS = [
  { key: "proposal", label: "Proposal" },
  { key: "contract", label: "Contract" },
  { key: "invoice", label: "Invoice" },
] as const;

export default function StepNav({
  current,
}: {
  current: "proposal" | "contract" | "invoice";
}) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);

  return (
    <ol className="mb-10 flex items-center gap-2 text-sm">
      {STEPS.map((step, i) => (
        <li key={step.key} className="flex items-center gap-2">
          <span
            className={
              i === currentIndex
                ? "font-extrabold text-brand-pink"
                : i < currentIndex
                  ? "font-medium text-brand-ink"
                  : "font-medium text-brand-ink/35"
            }
          >
            {step.label}
          </span>
          {i < STEPS.length - 1 && <span className="text-brand-ink/20">—</span>}
        </li>
      ))}
    </ol>
  );
}
