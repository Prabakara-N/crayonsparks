import { ShieldCheck } from "lucide-react";

// Blinking shield shown while admin access is being verified.
export function AdminVerifyingState({
  label = "Verifying admin access…",
}: {
  label?: string;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-3 text-center">
      <ShieldCheck className="w-9 h-9 animate-pulse text-violet-300" />
      <p className="text-sm text-neutral-400">{label}</p>
    </div>
  );
}
