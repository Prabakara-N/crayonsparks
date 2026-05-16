import type { Metadata } from "next";
import { Activity } from "lucide-react";
import { ComingSoonSection } from "@/components/admin/coming-soon-section";

export const metadata: Metadata = { title: "Admin · Costs" };

export default function AdminCostsPage() {
  return (
    <ComingSoonSection
      title="Cost monitor"
      description="Estimated daily API spend across Gemini, OpenAI, and Perplexity."
      icon={Activity}
      whenIt="Lights up once each generation writes its provider + token cost to the /generations collection."
    />
  );
}
