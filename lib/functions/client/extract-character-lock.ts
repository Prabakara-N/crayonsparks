"use client";

interface ExtractCharacterLockArgs {
  coverDataUrl: string;
  bookTitle: string;
}

export interface ExtractCharacterLockResult {
  block: string;
}

/**
 * Posts the rendered cover to `/api/extract-characters` and returns the
 * locked-character descriptor block that downstream page-generation
 * prompts will embed. Pure async function — caller handles state.
 */
export async function extractCharacterLock(
  args: ExtractCharacterLockArgs,
): Promise<ExtractCharacterLockResult> {
  const res = await fetch("/api/extract-characters", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      coverDataUrl: args.coverDataUrl,
      bookTitle: args.bookTitle,
    }),
  });
  const json = (await res.json()) as {
    lockBlock?: string;
    error?: string;
  };
  if (!res.ok || !json.lockBlock) {
    throw new Error(json.error || "Character extraction failed");
  }
  return { block: json.lockBlock };
}
