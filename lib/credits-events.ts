"use client";

// Lightweight client event so credit displays (e.g. the user menu) can refresh
// the moment a generation spends credits, instead of showing a stale balance
// until the next page load.
const CREDITS_CHANGED = "crayonsparks:credits-changed";

export function emitCreditsChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CREDITS_CHANGED));
  }
}

export function onCreditsChanged(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(CREDITS_CHANGED, callback);
  return () => window.removeEventListener(CREDITS_CHANGED, callback);
}
