"use client";

import type { KdpPaperType } from "@/lib/kdp-cover-pdf";
import { SelectDropdown } from "@/components/ui/select-dropdown";

interface PaperTypePickerProps {
  value: KdpPaperType;
  onChange: (paper: KdpPaperType) => void;
}

const PAPER_OPTIONS: { value: KdpPaperType; label: string }[] = [
  { value: "bw", label: "Black & white" },
  { value: "standardColor", label: "Standard color" },
  { value: "premiumColor", label: "Premium color" },
];

export function PaperTypePicker({ value, onChange }: PaperTypePickerProps) {
  return (
    <div className="block">
      <span className="mb-1.5 block text-xs font-medium text-neutral-300">
        Paper
      </span>
      <SelectDropdown
        value={value}
        onChange={(v) => onChange(v as KdpPaperType)}
        options={PAPER_OPTIONS}
      />
    </div>
  );
}
