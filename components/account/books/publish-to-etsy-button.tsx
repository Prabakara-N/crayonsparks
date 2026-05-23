"use client";

import { useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { orpc } from "@/lib/orpc/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

type WhoMade = (typeof WHO_MADE_OPTIONS)[number]["value"];
type WhenMade = (typeof WHEN_MADE_OPTIONS)[number]["value"];

export function PublishToEtsyButton({ bookId }: PublishToEtsyButtonProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [price, setPrice] = useState("4.99");
  const [taxonomyId, setTaxonomyId] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [whoMade, setWhoMade] = useState<WhoMade>("i_did");
  const [whenMade, setWhenMade] = useState<WhenMade>("made_to_order");

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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <PlatformIcon platform="etsy" className="h-4 w-4" />
          Publish to Etsy
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Publish to Etsy</DialogTitle>
          <DialogDescription>
            Creates an active digital-download listing in your Etsy shop with
            cover image and PDF.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="etsy-price">Price (USD)</Label>
            <Input
              id="etsy-price"
              type="number"
              step="0.01"
              min="0.20"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="etsy-taxonomy">
                Taxonomy ID (Etsy category number)
              </Label>
              <a
                href="https://openapi.etsy.com/v3/application/seller-taxonomy/nodes"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                browse <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <Input
              id="etsy-taxonomy"
              type="number"
              required
              value={taxonomyId}
              onChange={(e) => setTaxonomyId(e.target.value)}
              placeholder="e.g. 6826 for Books > Coloring Books"
              disabled={submitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="etsy-who">Who made it</Label>
              <Select
                value={whoMade}
                onValueChange={(v) => setWhoMade(v as WhoMade)}
                disabled={submitting}
              >
                <SelectTrigger id="etsy-who">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WHO_MADE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="etsy-when">When made</Label>
              <Select
                value={whenMade}
                onValueChange={(v) => setWhenMade(v as WhenMade)}
                disabled={submitting}
              >
                <SelectTrigger id="etsy-when">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WHEN_MADE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="etsy-tags">
              Tags (comma-separated, up to 13)
            </Label>
            <Input
              id="etsy-tags"
              type="text"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="coloring book, kids, printable, pdf"
              disabled={submitting}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !taxonomyId.trim()}
              className="gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Publishing…" : "Publish"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
