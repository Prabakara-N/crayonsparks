"use client";

import { useState } from "react";
import { ExternalLink, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { orpc } from "@/lib/orpc/client";
import { PlatformIcon } from "@/components/account/integrations/platform-icon";

interface PublishToEtsyButtonProps {
  bookId: string;
}

const WHO_MADE_OPTIONS = [
  { value: "i_did", label: "I made it" },
  { value: "collective", label: "A team I'm part of" },
  { value: "someone_else", label: "Another person/company" },
] as const;

const WHEN_MADE_OPTIONS = [
  { value: "made_to_order", label: "Made to order (digital)" },
  { value: "2020_2025", label: "2020 — 2025" },
  { value: "2010_2019", label: "2010 — 2019" },
] as const;

export function PublishToEtsyButton({ bookId }: PublishToEtsyButtonProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [price, setPrice] = useState("4.99");
  const [taxonomyId, setTaxonomyId] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [whoMade, setWhoMade] =
    useState<(typeof WHO_MADE_OPTIONS)[number]["value"]>("i_did");
  const [whenMade, setWhenMade] =
    useState<(typeof WHEN_MADE_OPTIONS)[number]["value"]>("made_to_order");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    const priceCents = Math.round(parseFloat(price) * 100);
    if (!Number.isFinite(priceCents) || priceCents < 20) {
      toast.error("Price must be at least $0.20.");
      return;
    }
    const taxonomy = parseInt(taxonomyId.trim(), 10);
    if (!Number.isFinite(taxonomy) || taxonomy <= 0) {
      toast.error("Taxonomy ID is required (Etsy category number).");
      return;
    }
    const tags = tagsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 13);

    setSubmitting(true);
    try {
      const res = await orpc.integrations.etsyPublish({
        bookId,
        priceCents,
        taxonomyId: taxonomy,
        quantity: 999,
        whoMade,
        whenMade,
        tags: tags.length > 0 ? tags : undefined,
      });
      toast.success(`Published to ${res.shopName} on Etsy.`);
      setOpen(false);
      window.open(res.listingUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Couldn't publish to Etsy.";
      if (/not connected/i.test(msg)) {
        toast.error("Connect Etsy in Account → Integrations first.");
      } else if (/no open shop/i.test(msg)) {
        toast.error("Open your Etsy shop first, then reconnect.");
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
        className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium text-orange-100 bg-orange-500/15 hover:bg-orange-500/20 border border-orange-500/30 transition-colors"
      >
        <PlatformIcon platform="etsy" className="w-4 h-4" />
        Publish to Etsy
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
                  Publish to Etsy
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Creates an active digital-download listing in your Etsy
                  shop with cover image and PDF.
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
                  Price (USD)
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.20"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  disabled={submitting}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-400/60"
                />
              </label>

              <label className="block">
                <span className="flex items-center justify-between text-xs font-semibold text-neutral-300 mb-1">
                  Taxonomy ID (Etsy category number)
                  <a
                    href="https://openapi.etsy.com/v3/application/seller-taxonomy/nodes"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-violet-300 hover:text-violet-200 font-normal"
                  >
                    browse <ExternalLink className="w-3 h-3" />
                  </a>
                </span>
                <input
                  type="number"
                  required
                  value={taxonomyId}
                  onChange={(e) => setTaxonomyId(e.target.value)}
                  placeholder="e.g. 6826 for Books > Coloring Books"
                  disabled={submitting}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-violet-400/60"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="block text-xs font-semibold text-neutral-300 mb-1">
                    Who made it
                  </span>
                  <select
                    value={whoMade}
                    onChange={(e) =>
                      setWhoMade(
                        e.target.value as (typeof WHO_MADE_OPTIONS)[number]["value"],
                      )
                    }
                    disabled={submitting}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-400/60"
                  >
                    {WHO_MADE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="block text-xs font-semibold text-neutral-300 mb-1">
                    When made
                  </span>
                  <select
                    value={whenMade}
                    onChange={(e) =>
                      setWhenMade(
                        e.target.value as (typeof WHEN_MADE_OPTIONS)[number]["value"],
                      )
                    }
                    disabled={submitting}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-400/60"
                  >
                    {WHEN_MADE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="block text-xs font-semibold text-neutral-300 mb-1">
                  Tags (comma-separated, up to 13)
                </span>
                <input
                  type="text"
                  value={tagsText}
                  onChange={(e) => setTagsText(e.target.value)}
                  placeholder="coloring book, kids, printable, pdf"
                  disabled={submitting}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-violet-400/60"
                />
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
                  disabled={submitting || !taxonomyId.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white bg-linear-to-r from-orange-500 to-red-500 hover:opacity-95 disabled:opacity-60"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <PlatformIcon platform="etsy" className="w-4 h-4" />
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
