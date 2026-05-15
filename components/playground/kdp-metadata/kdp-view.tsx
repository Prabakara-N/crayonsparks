import { Tag, ListTree, DollarSign } from "lucide-react";
import type { KdpCore } from "@/lib/kdp-metadata";
import { DescriptionWithToggle } from "../description-with-toggle";
import { MetadataField } from "./metadata-field";
import { FieldLabel } from "./field-label";
import { KeywordChip } from "./keyword-chip";

interface KdpViewProps {
  kdp: KdpCore;
  pageCount: number;
  bookName: string;
}

export function KdpView({ kdp, pageCount, bookName }: KdpViewProps) {
  return (
    <div className="space-y-3">
      <MetadataField label="SEO Title (≤200 chars)" value={kdp.title} mono />
      {kdp.subtitle && <MetadataField label="Subtitle" value={kdp.subtitle} />}
      <DescriptionWithToggle
        title={kdp.title || bookName}
        plain={kdp.descriptionText}
        html={kdp.descriptionHtml}
      />
      <div>
        <FieldLabel
          icon={<Tag className="w-3 h-3" />}
          text="7 Backend Keywords"
        />
        <div className="grid sm:grid-cols-2 gap-1.5">
          {kdp.keywords.map((kw, i) => (
            <KeywordChip key={i} index={i + 1} value={kw} />
          ))}
        </div>
      </div>
      <div>
        <FieldLabel
          icon={<ListTree className="w-3 h-3" />}
          text="Suggested KDP Categories"
        />
        <div className="space-y-1.5">
          {kdp.categories.map((cat, i) => (
            <KeywordChip key={i} index={i + 1} value={cat} />
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs text-neutral-300">
        <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
        <span className="font-semibold">
          Suggested price: ${kdp.suggestedPriceUsd}
        </span>
        <span className="text-neutral-500">· {pageCount} pages</span>
      </div>
      {kdp.notes && (
        <p className="text-[11px] text-amber-200/80 italic">✦ {kdp.notes}</p>
      )}
    </div>
  );
}
