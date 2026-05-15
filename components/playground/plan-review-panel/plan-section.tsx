interface PlanSectionProps {
  label: string;
  children: React.ReactNode;
}

export function PlanSection({ label, children }: PlanSectionProps) {
  return (
    <section>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-300 mb-1.5">
        {label}
      </p>
      {children}
    </section>
  );
}
