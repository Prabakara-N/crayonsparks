import { PlanSection } from "./plan-section";

interface EditableFieldProps {
  label: string;
  value: string | undefined;
  editing: boolean;
  onChange: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
}

export function EditableField({
  label,
  value,
  editing,
  onChange,
  multiline,
  placeholder,
}: EditableFieldProps) {
  // In read-only mode, hide the section entirely when there's no value.
  if (!editing && !value?.trim()) return null;
  return (
    <PlanSection label={label}>
      {editing ? (
        multiline ? (
          <textarea
            className="w-full bg-black/30 border border-white/10 focus:border-violet-400 focus:outline-none rounded px-3 py-2 text-neutral-100 text-[13px] leading-relaxed resize-y"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            placeholder={placeholder}
          />
        ) : (
          <input
            className="w-full bg-black/30 border border-white/10 focus:border-violet-400 focus:outline-none rounded px-3 py-2 text-neutral-100 text-[13px]"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
        )
      ) : (
        <p className="text-neutral-300 leading-relaxed">{value}</p>
      )}
    </PlanSection>
  );
}
