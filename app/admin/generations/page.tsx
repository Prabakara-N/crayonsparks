import type { Metadata } from "next";
import { Wand2 } from "lucide-react";
import { ComingSoonSection } from "@/components/admin/coming-soon-section";

export const metadata: Metadata = { title: "Admin · Generations" };

export default function AdminGenerationsPage() {
  return (
    <ComingSoonSection
      title="Generations"
      description="System-wide feed of every generated page, story, and cover."
      icon={Wand2}
      whenIt="Lights up once a /generations Firestore collection is populated on every successful image render (PERSISTENCE_PLAN dependency)."
    />
  );
}
