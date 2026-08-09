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
    <ol className="mb-10 flex items-center">
      {STEPS.map((step, i) => (
        <li key={step.key} className="flex items-center flex-1 last:flex-none">
          <div className="flex items-center gap-2.5">
            <span
              className={
                i === currentIndex
                  ? "step-badge step-badge-current"
                  : i < currentIndex
                    ? "step-badge step-badge-done"
                    : "step-badge step-badge-upcoming"
              }
            >
              {i + 1}
            </span>
            <span
              className={
                i === currentIndex
                  ? "font-heading font-[800] text-sm text-[#0a0608]"
                  : i < currentIndex
                    ? "font-heading font-[800] text-sm text-[#0a0608]/70"
                    : "font-heading font-[800] text-sm text-[#0a0608]/35"
              }
            >
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <span className={i < currentIndex ? "step-line step-line-done mx-4" : "step-line mx-4"} />
          )}
        </li>
      ))}
    </ol>
  );
}
