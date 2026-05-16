import type { Metadata } from "next";
import { SettingsMain } from "@/components/account/settings/settings-main";

export const metadata: Metadata = {
  title: "Settings",
};

export default function AccountSettingsPage() {
  return <SettingsMain />;
}
