"use client";

import { useCallback } from "react";
import { orpc } from "@/lib/orpc/client";

export function useImages() {
  return {
    upload: useCallback(
      (bookId: string, role: string, base64: string) =>
        orpc.images.upload({ bookId, role, base64 }),
      [],
    ),
  };
}
