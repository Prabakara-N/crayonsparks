"use client";

import { MessageSquare } from "lucide-react";

interface EditBubblesButtonProps {
  bubbleCount: number;
  onClick: () => void;
}

export function EditBubblesButton({
  bubbleCount,
  onClick,
}: EditBubblesButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onClick();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`Edit ${bubbleCount} speech bubble${bubbleCount === 1 ? "" : "s"}`}
      title={`Edit ${bubbleCount} bubble${bubbleCount === 1 ? "" : "s"}`}
      className="absolute bottom-3 right-14 z-50 inline-flex h-9 items-center gap-1.5 px-3 rounded-full bg-violet-600/90 text-white text-xs font-semibold shadow-lg backdrop-blur-sm transition-opacity duration-150 hover:bg-violet-500 focus:opacity-100 opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
    >
      <MessageSquare className="h-3.5 w-3.5" />
      Bubbles ({bubbleCount})
    </button>
  );
}
