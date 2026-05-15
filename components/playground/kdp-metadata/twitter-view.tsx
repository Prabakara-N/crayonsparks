import type { TwitterPost } from "@/lib/kdp-metadata";
import { MetadataField } from "./metadata-field";

export function TwitterView({ post }: { post: TwitterPost }) {
  return (
    <div className="space-y-3">
      <MetadataField
        label={`Tweet (${post.caption.length}/280) — add your link before posting`}
        value={post.caption}
        multiline
      />
    </div>
  );
}
