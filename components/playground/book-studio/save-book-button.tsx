"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, BookmarkPlus, Check } from "lucide-react";
import { toast } from "sonner";
import { useSaveBook } from "@/lib/hooks/use-save-book";
import { useUser } from "@/lib/hooks/use-user";
import type { Plan, PromptItem } from "./types";

interface ImageInput {
  dataUrl?: string;
}

interface SaveBookButtonProps {
  plan: Plan;
  mode: "qa" | "story";
  age: "toddlers" | "kids" | "tweens";
  aspectRatio: string;
  coverStyle: "flat" | "illustrated";
  coverBorder: "framed" | "bleed";
  belongsToStyle?: "bw" | "color";
  cover: ImageInput;
  backCover: ImageInput;
  belongsTo?: ImageInput;
  theEndPage?: ImageInput;
  pages: PromptItem[];
  characterLock?: string | null;
  disabled?: boolean;
}

export function SaveBookButton(props: SaveBookButtonProps) {
  const router = useRouter();
  const { user } = useUser();
  const { saveBook, saving, progress, error } = useSaveBook();
  const [savedBookId, setSavedBookId] = useState<string | null>(null);

  const isSignedIn = !!user;
  const canClick = isSignedIn && !props.disabled && !saving && !savedBookId;

  async function handleClick() {
    if (!isSignedIn) {
      router.push(
        `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`,
      );
      return;
    }
    const result = await saveBook({
      plan: props.plan,
      mode: props.mode,
      age: props.age,
      aspectRatio: props.aspectRatio,
      coverStyle: props.coverStyle,
      coverBorder: props.coverBorder,
      belongsToStyle: props.belongsToStyle,
      cover: props.cover,
      backCover: props.backCover,
      belongsTo: props.belongsTo,
      theEndPage: props.theEndPage,
      pages: props.pages,
      characterLock: props.characterLock,
    });
    if (result) {
      setSavedBookId(result.bookId);
      toast.success("Book saved to your library.", {
        action: {
          label: "View library",
          onClick: () => router.push("/account/books"),
        },
      });
    } else if (error) {
      toast.error(error);
    }
  }

  if (savedBookId) {
    return (
      <button
        type="button"
        onClick={() => router.push("/account/books")}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white bg-emerald-500/80 hover:bg-emerald-500 shadow-md shadow-emerald-500/30 transition-colors"
      >
        <Check className="w-4 h-4" />
        Saved · view library
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!canClick}
      title={isSignedIn ? "Save this book to your library" : "Sign in to save"}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white bg-linear-to-r from-violet-500 to-cyan-400 hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-violet-500/30 transition-opacity"
    >
      {saving ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <BookmarkPlus className="w-4 h-4" />
      )}
      {saving ? progress?.step ?? "Saving…" : "Save to library"}
    </button>
  );
}
