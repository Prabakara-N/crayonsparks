"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Loader2, MessageSquare, Paperclip, X } from "lucide-react";
import { toast } from "sonner";
import { orpc } from "@/lib/orpc/client";
import { useAuthContext } from "@/components/auth/auth-provider";
import {
  FEEDBACK_KIND_LABELS,
  FEEDBACK_KINDS,
  type FeedbackKind,
} from "@/lib/feedback/types";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const MAX_SCREENSHOT_BYTES = 4 * 1024 * 1024;

export function FeedbackWidget() {
  const { user } = useAuthContext();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<FeedbackKind>("bug");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [screenshotBase64, setScreenshotBase64] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      // Reset only after close animation
      const t = setTimeout(() => {
        setTitle("");
        setBody("");
        setScreenshotBase64(null);
        setScreenshotName(null);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!user) return null;

  async function handleScreenshot(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Screenshot must be an image (PNG/JPEG/WebP).");
      return;
    }
    if (file.size > MAX_SCREENSHOT_BYTES) {
      toast.error("Screenshot must be under 4MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        setScreenshotBase64(result);
        setScreenshotName(file.name);
      }
    };
    reader.onerror = () => toast.error("Couldn't read that file.");
    reader.readAsDataURL(file);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (title.trim().length < 3) {
      toast.error("Add a short title (3+ chars).");
      return;
    }
    if (body.trim().length < 3) {
      toast.error("Add a description (3+ chars).");
      return;
    }
    setSubmitting(true);
    try {
      await orpc.feedback.submit({
        kind,
        title: title.trim(),
        body: body.trim(),
        page: pathname ?? undefined,
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        screenshotBase64: screenshotBase64 ?? undefined,
      });
      toast.success("Thanks — we'll take a look.");
      setOpen(false);
    } catch {
      toast.error("Couldn't send. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Send feedback"
        className="fixed bottom-4 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-r from-violet-500 to-cyan-400 text-white shadow-lg shadow-violet-500/30 hover:scale-105 active:scale-100 transition-transform"
      >
        <MessageSquare className="h-5 w-5" fill="currentColor" strokeWidth={1.5} />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md p-0 flex flex-col"
        >
          <SheetHeader className="px-5 pt-5">
            <SheetTitle>Send feedback</SheetTitle>
            <SheetDescription>
              Bug, idea, or question — goes straight to the founder.
            </SheetDescription>
          </SheetHeader>

          <form
            onSubmit={submit}
            className="flex-1 overflow-y-auto px-5 py-4 space-y-4"
          >
            <div className="space-y-1.5">
              <Label>Type</Label>
              <div className="grid grid-cols-2 gap-2">
                {FEEDBACK_KINDS.map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    disabled={submitting}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50 ${
                      kind === k
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-muted-foreground/50"
                    }`}
                  >
                    {FEEDBACK_KIND_LABELS[k]}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fb-title">Title</Label>
              <Input
                id="fb-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  kind === "bug"
                    ? "Cover button doesn't respond on second click"
                    : "Short summary"
                }
                disabled={submitting}
                maxLength={140}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fb-body">Details</Label>
              <Textarea
                id="fb-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={
                  kind === "bug"
                    ? "What did you do, what did you expect, what happened?"
                    : "Tell us what's on your mind."
                }
                disabled={submitting}
                rows={5}
                maxLength={4000}
                className="min-h-24"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fb-screenshot">Screenshot (optional)</Label>
              {screenshotBase64 ? (
                <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={screenshotBase64}
                    alt=""
                    className="h-10 w-10 rounded object-cover"
                  />
                  <span className="flex-1 text-sm truncate">
                    {screenshotName}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setScreenshotBase64(null);
                      setScreenshotName(null);
                    }}
                    disabled={submitting}
                    aria-label="Remove screenshot"
                    className="h-7 w-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="fb-screenshot-input"
                  className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-3 cursor-pointer hover:bg-muted/50 text-sm text-muted-foreground"
                >
                  <Paperclip className="h-4 w-4" />
                  Attach an image (max 4MB)
                </label>
              )}
              <input
                id="fb-screenshot-input"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleScreenshot}
                disabled={submitting}
                className="hidden"
              />
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Sending from <span className="font-mono">{pathname}</span>. Your
              email + browser info are attached automatically.
            </p>
          </form>

          <SheetFooter className="border-t border-border flex-col gap-2">
            <Button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="w-full gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Sending…" : "Send"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={submitting}
              className="w-full"
            >
              Cancel
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
