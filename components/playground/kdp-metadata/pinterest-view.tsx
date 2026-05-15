import type { PinterestPin } from "@/lib/kdp-metadata";
import { MetadataField } from "./metadata-field";

export function PinterestView({ pin }: { pin: PinterestPin }) {
  return (
    <div className="space-y-3">
      <MetadataField
        label={`Pin title (${pin.title.length}/100)`}
        value={pin.title}
      />
      <MetadataField
        label={`Pin description (${pin.description.length}/800)`}
        value={pin.description}
        multiline
      />
    </div>
  );
}
