import type { Metadata } from "next";
import { GenerationsMain } from "@/components/admin/generations/generations-main";

export const metadata: Metadata = { title: "Admin · Generations" };

export default function AdminGenerationsPage() {
  return <GenerationsMain />;
}
