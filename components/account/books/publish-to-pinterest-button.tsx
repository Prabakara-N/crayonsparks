"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { orpc } from "@/lib/orpc/client";
import { PlatformIcon } from "@/components/account/integrations/platform-icon";

interface PublishToPinterestButtonProps {
  bookId: string;
}

export function PublishToPinterestButton({
  bookId,
}: PublishToPinterestButtonProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [link, setLink] = useState("");
  const [boardName, setBoardName] = useState("");
  const [includeCarousel, setIncludeCarousel] = useState(true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const trimmedBoard = boardName.trim();
      const res = await orpc.integrations.pinterestPublish({
        bookId,
        link: link.trim(),
        boardName: trimmedBoard ? trimmedBoard : undefined,
        includeCarousel,
      });
      const count = res.pins.length;
      toast.success(
        count === 1
          ? "Pinned to Pinterest."
          : `Created ${count} pins on Pinterest.`,
      );
      setOpen(false);
      setLink("");
      setBoardName("");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Couldn't publish to Pinterest.";
      if (/not connected/i.test(msg)) {
        toast.error("Connect Pinterest in Account → Integrations first.");
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium text-red-100 bg-red-500/15 hover:bg-red-500/20 border border-red-500/30 transition-colors"
      >
        <PlatformIcon platform="pinterest" className="w-4 h-4" />
        Pin to Pinterest
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => !submitting && setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-zinc-950 border border-white/10 p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-display text-lg font-semibold text-white">
                  Publish to Pinterest
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Creates a cover pin (and optional carousel of sample pages)
                  linking back to your storefront URL.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={submitting}
                className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 disabled:opacity-50"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="block text-xs font-semibold text-neutral-300 mb-1">
                  Destination URL (where the pin links)
                </span>
                <input
                  type="url"
                  required
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://your-shop.etsy.com/listing/123…"
                  disabled={submitting}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-violet-400/60"
                />
              </label>

              <label className="block">
                <span className="block text-xs font-semibold text-neutral-300 mb-1">
                  Board name (created if missing)
                </span>
                <input
                  type="text"
                  value={boardName}
                  onChange={(e) => setBoardName(e.target.value)}
                  placeholder="Coloring Books"
                  disabled={submitting}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-violet-400/60"
                />
              </label>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeCarousel}
                  onChange={(e) => setIncludeCarousel(e.target.checked)}
                  disabled={submitting}
                  className="mt-0.5 accent-violet-500"
                />
                <span className="text-xs text-neutral-300 leading-relaxed">
                  Also create a carousel pin with cover + up to 4 sample pages
                  (drives more engagement).
                </span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={submitting}
                  className="px-3 py-2 rounded-full text-sm font-medium text-neutral-300 hover:text-white hover:bg-white/5 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !link.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white bg-linear-to-r from-red-500 to-pink-500 hover:opacity-95 disabled:opacity-60"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <PlatformIcon platform="pinterest" className="w-4 h-4" />
                  )}
                  {submitting ? "Publishing…" : "Publish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
