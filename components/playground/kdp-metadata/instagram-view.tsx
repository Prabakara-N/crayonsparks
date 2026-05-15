import { Tag } from "lucide-react";
import type { InstagramPost } from "@/lib/kdp-metadata";
import { MetadataField } from "./metadata-field";
import { FieldLabel } from "./field-label";
import { KeywordChip } from "./keyword-chip";

export function InstagramView({ post }: { post: InstagramPost }) {
  return (
    <div className="space-y-3">
      <MetadataField label="Caption" value={post.caption} multiline />
      <div>
        <FieldLabel icon={<Tag className="w-3 h-3" />} text="5 hashtags" />
        <div className="grid sm:grid-cols-2 gap-1.5">
          {post.hashtags.map((tag, i) => (
            <KeywordChip key={i} index={i + 1} value={tag} />
          ))}
        </div>
      </div>
    </div>
  );
}
