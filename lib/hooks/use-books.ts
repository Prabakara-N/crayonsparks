"use client";

import { useCallback } from "react";
import { orpc } from "@/lib/orpc/client";

export function useBooks() {
  return {
    save: useCallback(
      (input: Parameters<typeof orpc.books.save>[0]) => orpc.books.save(input),
      [],
    ),
    list: useCallback(
      (limit?: number) =>
        orpc.books.list({ limit: limit ?? 20 }),
      [],
    ),
    get: useCallback(
      (bookId: string) => orpc.books.get({ bookId }),
      [],
    ),
    delete: useCallback(
      (bookId: string) => orpc.books.delete({ bookId }),
      [],
    ),
    uploadImage: useCallback(
      (bookId: string, role: string, base64: string) =>
        orpc.images.upload({ bookId, role, base64 }),
      [],
    ),
  };
}
