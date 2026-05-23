"use client";

import { Download } from "lucide-react";
import type { AdminCreditEntry } from "./credit-row";

const HEADER = [
  "id",
  "ownerUid",
  "ownerEmail",
  "delta",
  "balanceAfter",
  "reason",
  "refKind",
  "refId",
  "createdByEmail",
  "createdAt",
] as const;

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

interface CreditCsvExportButtonProps {
  rows: AdminCreditEntry[];
  filename?: string;
}

export function CreditCsvExportButton({
  rows,
  filename = "credits.csv",
}: CreditCsvExportButtonProps) {
  const disabled = rows.length === 0;

  function handleClick() {
    const lines: string[] = [HEADER.join(",")];
    for (const row of rows) {
      lines.push(
        HEADER.map((key) => {
          if (key === "createdAt") {
            return csvEscape(
              row.createdAt ? new Date(row.createdAt).toISOString() : "",
            );
          }
          return csvEscape(row[key as keyof AdminCreditEntry]);
        }).join(","),
      );
    }
    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-amber-100 bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      <Download className="w-3.5 h-3.5" />
      Export CSV ({rows.length})
    </button>
  );
}
