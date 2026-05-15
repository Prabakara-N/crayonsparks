"use client";

import type { ListingPlatform, PlatformStatus } from "@/lib/kdp-metadata";
import { PlatformIcon } from "../platform-icon";
import { TAB_CONFIG } from "./kdp-metadata-tab-config";
import { StatusDot } from "./status-dot";

interface TabBarProps {
  activeTab: ListingPlatform;
  setActiveTab: (tab: ListingPlatform) => void;
  status: Record<ListingPlatform, PlatformStatus>;
}

export function TabBar({ activeTab, setActiveTab, status }: TabBarProps) {
  return (
    <div className="flex flex-wrap gap-1.5 border-b border-white/10 pb-2">
      {TAB_CONFIG.map((tab) => {
        const s = status[tab.id];
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              active
                ? "bg-white/10 text-white"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-white/5"
            }`}
          >
            <PlatformIcon
              src={tab.logoSrc}
              className={`w-3.5 h-3.5 ${active ? tab.accent : ""}`}
            />
            <span>{tab.label}</span>
            <StatusDot status={s} />
          </button>
        );
      })}
    </div>
  );
}
