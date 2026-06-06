"use client";

import { useEffect, useState } from "react";

const HEARTBEAT_URL = "/api/health";
const HEARTBEAT_INTERVAL_MS = 20_000;
const HEARTBEAT_TIMEOUT_MS = 8_000;

async function isReachable(): Promise<boolean> {
  try {
    const res = await fetch(`${HEARTBEAT_URL}?t=${Date.now()}`, {
      method: "HEAD",
      cache: "no-store",
      signal: AbortSignal.timeout(HEARTBEAT_TIMEOUT_MS),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let active = true;
    const update = (value: boolean) => {
      if (active) setIsOnline(value);
    };

    const verify = async () => {
      if (!navigator.onLine) {
        update(false);
        return;
      }
      update(await isReachable());
    };

    void verify();
    const onOnline = () => void verify();
    const onOffline = () => update(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    const id = window.setInterval(() => void verify(), HEARTBEAT_INTERVAL_MS);

    return () => {
      active = false;
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.clearInterval(id);
    };
  }, []);

  return isOnline;
}
