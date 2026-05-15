import { Loader2 } from "lucide-react";

export function Pending({
  label,
  icon,
}: {
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-neutral-400">
      {icon ?? <Loader2 className="w-6 h-6 animate-spin text-violet-400" />}
      <p className="text-sm">{label}</p>
    </div>
  );
}
