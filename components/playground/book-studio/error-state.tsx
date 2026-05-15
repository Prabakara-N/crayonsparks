import { XCircle } from "lucide-react";

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-red-950/30 p-4 text-center">
      <XCircle className="w-7 h-7 text-red-400" />
      <p className="text-xs text-red-200 max-w-xs">{message}</p>
    </div>
  );
}
