import { Tag } from "lucide-react";
import type { EtsyMetadata } from "@/lib/kdp-metadata";
import { MetadataField } from "./metadata-field";
import { FieldLabel } from "./field-label";
import { KeywordChip } from "./keyword-chip";

export function EtsyView({ etsy }: { etsy: EtsyMetadata }) {
  return (
    <div className="space-y-3">
      <MetadataField
        label={`Etsy title (${etsy.title.length}/140 chars)`}
        value={etsy.title}
      />
      <MetadataField
        label="Etsy description (plain text)"
        value={etsy.description}
        multiline
      />
      <div>
        <FieldLabel
          icon={<Tag className="w-3 h-3" />}
          text="13 Etsy tags (≤20 chars each)"
        />
        <div className="grid sm:grid-cols-2 gap-1.5">
          {etsy.tags.map((tag, i) => (
            <KeywordChip key={i} index={i + 1} value={tag} />
          ))}
        </div>
      </div>
    </div>
  );
}
