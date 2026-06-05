export type CostRangeId = "24h" | "7d" | "15d" | "30d" | "3mo" | "custom";

export interface CostRangePreset {
  id: Exclude<CostRangeId, "custom">;
  label: string;
  days: number;
}

export const COST_RANGE_PRESETS: CostRangePreset[] = [
  { id: "24h", label: "24h", days: 1 },
  { id: "7d", label: "7 days", days: 7 },
  { id: "15d", label: "15 days", days: 15 },
  { id: "30d", label: "30 days", days: 30 },
  { id: "3mo", label: "3 months", days: 90 },
];
