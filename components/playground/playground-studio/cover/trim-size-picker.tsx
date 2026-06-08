"use client";

import { SelectDropdown } from "@/components/ui/select-dropdown";
import { COVER_TRIMS } from "./cover-trim-config";

interface TrimSizePickerProps {
  value: string;
  onChange: (id: string) => void;
}

export function TrimSizePicker({ value, onChange }: TrimSizePickerProps) {
  return (
    <div className="block">
      <span className="mb-1.5 block text-xs font-medium text-neutral-300">
        Trim size
      </span>
      <SelectDropdown
        value={value}
        onChange={onChange}
        options={COVER_TRIMS.map((t) => ({ value: t.id, label: t.label }))}
      />
    </div>
  );
}
