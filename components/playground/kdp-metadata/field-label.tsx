interface FieldLabelProps {
  icon?: React.ReactNode;
  text: string;
}

export function FieldLabel({ icon, text }: FieldLabelProps) {
  return (
    <div className="flex items-center gap-1.5 mb-1.5">
      {icon}
      <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-300">
        {text}
      </span>
    </div>
  );
}
