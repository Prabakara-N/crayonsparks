import type { ActivitySpec } from "@/lib/activities/types";

export type ActivityPageStatus = "pending" | "generating" | "done" | "error";

export interface ActivityPageItem {
  spec: ActivitySpec;
  status: ActivityPageStatus;
  dataUrl?: string;
  solutionDataUrl?: string;
  error?: string;
}
