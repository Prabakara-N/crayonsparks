"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <PlatformIcon platform="pinterest" className="h-4 w-4" />
          Pin to Pinterest
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Publish to Pinterest</DialogTitle>
          <DialogDescription>
            Creates a cover pin (and optional carousel of sample pages) linking
            back to your storefront URL.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pinterest-link">
              Destination URL (where the pin links)
            </Label>
            <Input
              id="pinterest-link"
              type="url"
              required
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://your-shop.etsy.com/listing/123…"
              disabled={submitting}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pinterest-board">
              Board name (created if missing)
            </Label>
            <Input
              id="pinterest-board"
              type="text"
              value={boardName}
              onChange={(e) => setBoardName(e.target.value)}
              placeholder="Coloring Books"
              disabled={submitting}
            />
          </div>

          <label className="flex items-start gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={includeCarousel}
              onChange={(e) => setIncludeCarousel(e.target.checked)}
              disabled={submitting}
              className="mt-0.5 accent-primary"
            />
            <span className="text-muted-foreground leading-relaxed">
              Also create a carousel pin with cover + up to 4 sample pages
              (drives more engagement).
            </span>
          </label>

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
              disabled={submitting || !link.trim()}
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
