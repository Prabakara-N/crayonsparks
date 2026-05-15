import { Tag, ListTree } from "lucide-react";
import type { GumroadMetadata } from "@/lib/kdp-metadata";
import { MetadataField } from "./metadata-field";
import { FieldLabel } from "./field-label";
import { KeywordChip } from "./keyword-chip";

export function GumroadView({ gumroad }: { gumroad: GumroadMetadata }) {
  return (
    <div className="space-y-3">
      <MetadataField
        label={`Product name (${gumroad.name.length}/140)`}
        value={gumroad.name}
      />
      <MetadataField
        label={`One-line summary (${gumroad.summary.length}/280)`}
        value={gumroad.summary}
      />
      <MetadataField
        label="Description (paste into Gumroad description field)"
        value={gumroad.description}
        multiline
      />
      <div>
        <FieldLabel
          icon={<ListTree className="w-3 h-3" />}
          text={`Additional information (${gumroad.additionalInfo.length})`}
        />
        <div className="space-y-1">
          {gumroad.additionalInfo.map((row, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs"
            >
              <span className="text-violet-400 font-mono shrink-0">
                {i + 1}.
              </span>
              <span className="font-semibold text-neutral-100 shrink-0">
                {row.label}
              </span>
              <span className="text-neutral-400">—</span>
              <span className="text-neutral-300 truncate">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <FieldLabel icon={<Tag className="w-3 h-3" />} text="Gumroad tags" />
        <div className="grid sm:grid-cols-2 gap-1.5">
          {gumroad.tags.map((tag, i) => (
            <KeywordChip key={i} index={i + 1} value={tag} />
          ))}
        </div>
      </div>
      <MetadataField label="Gumroad category" value={gumroad.category} />
    </div>
  );
}
