"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { orpc } from "@/lib/orpc/client";
import { ensureUserOnce } from "@/lib/auth/ensure-user";
import { useAuthContext } from "@/components/auth/auth-provider";
import { REFERRAL_SOURCES } from "@/lib/referrals/sources";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ReferralSurvey() {
  const { user } = useAuthContext();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string>("");
  const [otherText, setOtherText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const checkedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      checkedRef.current = null;
      return;
    }
    if (checkedRef.current === user.uid) return;
    checkedRef.current = user.uid;
    let cancelled = false;
    ensureUserOnce()
      .then((profile) => {
        if (cancelled || !profile) return;
        if (!profile.referralSource) {
          setOpen(true);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function submit(source: string) {
    if (submitting) return;
    if (source === "other" && !otherText.trim()) {
      toast.error("Please tell us where.");
      return;
    }
    setSubmitting(true);
    try {
      await orpc.auth.setReferralSource({
        source,
        other: source === "other" ? otherText.trim() : undefined,
      });
      setOpen(false);
      toast.success("Thanks — that helps us a lot.");
    } catch {
      toast.error("Couldn't save. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-md p-6 gap-5"
        showCloseButton={false}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="space-y-2">
          <DialogTitle>How did you hear about CrayonSparks?</DialogTitle>
          <DialogDescription>
            One quick question — it helps us focus where to grow.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2">
          {REFERRAL_SOURCES.map((source) => {
            const active = selected === source.id;
            return (
              <button
                key={source.id}
                type="button"
                onClick={() => setSelected(source.id)}
                disabled={submitting}
                className={`px-3 py-2.5 rounded-lg text-sm font-medium text-left border transition-colors disabled:opacity-50 ${
                  active
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-card hover:border-muted-foreground/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                {source.label}
              </button>
            );
          })}
        </div>

        {selected === "other" && (
          <div className="space-y-1.5">
            <Label htmlFor="referral-other">Tell us where</Label>
            <Input
              id="referral-other"
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              placeholder="e.g. ProductHunt, a podcast, a class…"
              disabled={submitting}
              maxLength={200}
              autoFocus
            />
          </div>
        )}

        <Button
          type="button"
          onClick={() => void submit(selected)}
          disabled={submitting || !selected}
          className="gap-2 w-full"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? "Saving…" : "Continue"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
