import type { ModelMessage } from "ai";
import type { QualityScore } from "@/components/playground/types";
import type { StoryBubble } from "@/components/playground/book-studio/types";
import type { PageMeta, PageStatus } from "@/lib/refine-chat";
import type { ImageModel } from "@/lib/constants";

export type RefineContext =
  | "cover"
  | "back-cover"
  | "page"
  | "story-cover"
  | "story-back-cover"
  | "story-page"
  | "custom";

export type AspectRatio =
  | "1:1"
  | "3:4"
  | "4:3"
  | "2:3"
  | "3:2"
  | "9:16"
  | "16:9";

export interface Version {
  dataUrl: string;
  instruction?: string;
}

export type Turn =
  | {
      kind: "user";
      id: string;
      text: string;
      referenceDataUrl?: string;
    }
  | {
      kind: "assistant";
      id: string;
      reply: string;
      awaitingReply?: boolean;
      generatingImage?: boolean;
      imageDataUrl?: string;
      referenceLabels?: string[];
    };

export interface RefineBookContextProp {
  bookTitle: string;
  bookScene?: string;
  audience?: string;
  targetId: string;
  targetLabel: string;
  targetSubject?: string;
  pages: PageMeta[];
  coverStatus: PageStatus;
  backCoverStatus: PageStatus;
  palette?: { name: string; hexes: string[] };
}

export interface ImageRefineModalProps {
  open: boolean;
  onClose: () => void;
  sourceDataUrl?: string;
  aspectRatio?: AspectRatio;
  context: RefineContext;
  title?: string;
  subtitle?: string;
  onRefined?: (dataUrl: string) => void;
  downloadName?: string;
  frontCoverDataUrl?: string;
  bookTitle?: string;
  coverScene?: string;
  bookDescription?: string;
  pageSubjects?: string[];
  pageCount?: number;
  quality?: QualityScore | null;
  bookContext?: RefineBookContextProp;
  getPageDataUrl?: (pageId: string) => string | null;
  model?: ImageModel;
  onBackgroundChange?: (
    state: "idle" | "running" | "done",
    explicitTargetId?: string,
  ) => void;
  openNonce?: number;
  bubbles?: StoryBubble[];
}

export type SessionEntry = {
  turns: Turn[];
  history: ModelMessage[];
  versions: Version[];
};
