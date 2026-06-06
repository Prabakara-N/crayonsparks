"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Wifi, WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/lib/hooks/use-online-status";

const TOAST_ID = "connection-status";

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
      toast.error("You're offline", {
        id: TOAST_ID,
        description: "Check your connection — recent changes may not save.",
        icon: <WifiOff className="h-4 w-4" />,
        duration: Infinity,
      });
    } else if (wasOffline.current) {
      wasOffline.current = false;
      toast.success("Back online", {
        id: TOAST_ID,
        description: "Your connection is back.",
        icon: <Wifi className="h-4 w-4" />,
        duration: 3000,
      });
    }
  }, [isOnline]);

  return null;
}
