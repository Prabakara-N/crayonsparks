import type {
  ListingDraft,
  ListingPlatform,
  PlatformStatus,
} from "@/lib/kdp-metadata";
import { LoadingState } from "./loading-state";
import { ErrorState } from "./error-state";
import { PendingState } from "./pending-state";
import { KdpView } from "./kdp-view";
import { EtsyView } from "./etsy-view";
import { GumroadView } from "./gumroad-view";
import { PinterestView } from "./pinterest-view";
import { InstagramView } from "./instagram-view";
import { TwitterView } from "./twitter-view";

interface TabContentProps {
  tab: ListingPlatform;
  draft: ListingDraft;
  status: PlatformStatus;
  error?: string;
  pageCount: number;
  bookName: string;
  onRetry: () => void;
}

export function TabContent({
  tab,
  draft,
  status,
  error,
  pageCount,
  bookName,
  onRetry,
}: TabContentProps) {
  if (status === "loading") {
    return <LoadingState platform={tab} />;
  }
  if (status === "error") {
    return <ErrorState error={error} onRetry={onRetry} />;
  }
  if (status === "pending") {
    return <PendingState />;
  }

  switch (tab) {
    case "kdp":
      return draft.kdp ? (
        <KdpView kdp={draft.kdp} pageCount={pageCount} bookName={bookName} />
      ) : null;
    case "etsy":
      return draft.etsy ? <EtsyView etsy={draft.etsy} /> : null;
    case "gumroad":
      return draft.gumroad ? <GumroadView gumroad={draft.gumroad} /> : null;
    case "pinterest":
      return draft.pinterest ? <PinterestView pin={draft.pinterest} /> : null;
    case "instagram":
      return draft.instagram ? (
        <InstagramView post={draft.instagram} />
      ) : null;
    case "twitter":
      return draft.twitter ? <TwitterView post={draft.twitter} /> : null;
  }
}
