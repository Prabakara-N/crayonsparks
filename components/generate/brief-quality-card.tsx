import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import type { BookBriefQualityReport } from "@/lib/book-chat";

export function BriefQualityCard({
  quality,
}: {
  quality?: BookBriefQualityReport;
}) {
  if (!quality) return null;
  const hasErrors = quality.issues.some((i) => i.severity === "error");
  const hasWarnings = quality.issues.some((i) => i.severity === "warning");
  const Icon = hasErrors ? AlertTriangle : hasWarnings ? Info : CheckCircle2;
  const tone = hasErrors
    ? "border-red-500/30 bg-red-500/10 text-red-100"
    : hasWarnings
      ? "border-amber-500/30 bg-amber-500/10 text-amber-100"
      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-100";
  return (
    <div className={`rounded-xl border px-3 py-2.5 text-xs ${tone}`}>
      <div className="flex items-center gap-2 font-semibold">
        <Icon className="h-4 w-4" />
        <span>Quality check: {quality.score}/100</span>
      </div>
      <p className="mt-1 text-current/80">{quality.summary}</p>
      {quality.issues.length > 0 && (
        <ul className="mt-2 space-y-1 text-current/85">
          {quality.issues.slice(0, 4).map((issue, index) => (
            <li key={`${issue.severity}-${index}`} className="break-words">
              {issue.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
