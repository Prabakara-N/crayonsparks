/**
 * Survives a logged-out user across the login redirect.
 *
 * When an auth-gated action is triggered while signed out, the caller
 * stashes the in-progress form/plan state here, sends the user to
 * /login, and the destination page rehydrates it on return.
 *
 * sessionStorage is the right store: it survives the login round-trip
 * within the tab and clears when the tab closes — exactly a draft's life.
 */

const STORAGE_KEY = "crayonsparks.pendingAction";
const MAX_AGE_MS = 30 * 60 * 1000;

export type PendingActionType =
  | "single-image"
  | "bulk-book"
  | "chat-plan";

export interface PendingAction {
  type: PendingActionType;
  returnTo: string;
  payload: unknown;
  savedAt: number;
}

export function savePendingAction(
  action: Omit<PendingAction, "savedAt">,
): void {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...action, savedAt: Date.now() }),
    );
  } catch {
    // sessionStorage unavailable / quota exceeded — proceed without it.
  }
}

/** Reads and REMOVES the pending action (one-shot). */
export function consumePendingAction(
  expectedType?: PendingActionType,
): PendingAction | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingAction;
    sessionStorage.removeItem(STORAGE_KEY);
    if (expectedType && parsed.type !== expectedType) return null;
    if (Date.now() - parsed.savedAt > MAX_AGE_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingAction(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
