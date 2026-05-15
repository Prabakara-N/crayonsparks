import type { ImageModel } from "@/lib/constants";

export type AspectRatio = "1:1" | "3:4" | "4:3" | "2:3" | "3:2" | "9:16" | "16:9";

export type ImageCategory =
  | "generic"
  | "coloring-page"
  | "wall-art"
  | "nursery-print"
  | "sticker"
  | "greeting-card"
  | "book-illustration"
  | "pinterest-pin";

export type Status = "idle" | "generating" | "refining" | "done" | "error";

export interface Version {
  dataUrl: string;
  instruction?: string;
  model?: ImageModel;
}
