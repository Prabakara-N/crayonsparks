"use client";

import { useCallback, useState } from "react";
import {
  saveBookToCloud,
  type SaveBookArgs,
  type SaveBookResult,
  type SaveProgress,
} from "@/lib/functions/client/save-book";

/**
 * React wrapper around saveBookToCloud — owns the saving / progress /
 * error state so components can subscribe + re-render against it.
 * The real work (parallel uploads + Firestore write) lives in the
 * plain function `saveBookToCloud` so it stays React-free and testable.
 */
export function useSaveBook() {
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<SaveProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const saveBook = useCallback(
    async (args: SaveBookArgs): Promise<SaveBookResult | null> => {
      setError(null);
      setSaving(true);
      try {
        const result = await saveBookToCloud(args, { onProgress: setProgress });
        setSaving(false);
        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save book.");
        setSaving(false);
        return null;
      }
    },
    [],
  );

  return { saveBook, saving, progress, error };
}
