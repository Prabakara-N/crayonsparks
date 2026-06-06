"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GuidedChat } from "@/components/generate/guided-chat/guided-chat-main";
import {
  BookStudio,
  type Plan,
} from "@/components/playground/book-studio/book-studio-main";
import type { BookBrief, ActivityBookPlan } from "@/lib/book-chat";
import { createCustomCategory } from "@/lib/custom-categories";
import { useAuthContext } from "@/components/auth/auth-provider";
import {
  savePendingAction,
  consumePendingAction,
} from "@/lib/auth/pending-action";

const RETURN_TO = "/sparky-ai";

function briefToPlan(brief: BookBrief): Plan {
  const isStory = !!(brief.characters?.length || brief.palette);
  return {
    title: brief.name,
    coverTitle: brief.name,
    description: isStory
      ? `${brief.prompts.length}-page story book.`
      : `${brief.prompts.length}-page coloring book.`,
    scene: brief.pageScene,
    coverScene: brief.coverScene,
    prompts: brief.prompts.map((p) => ({
      name: p.name,
      subject: p.subject,
      dialogue: p.dialogue,
      narration: p.narration,
      composition: p.composition,
    })),
    bottomStripPhrases: brief.bottomStripPhrases,
    sidePlaqueLines: brief.sidePlaqueLines,
    coverBadgeStyle: brief.coverBadgeStyle,
    characters: brief.characters,
    palette: brief.palette,
    detailLevel: brief.detailLevel,
    storyType: brief.storyType,
    dialogueStyle: brief.dialogueStyle,
  };
}

export function SparkyMain() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthContext();

  const [view, setView] = useState<"chat" | "studio">("chat");
  const [seedPlan, setSeedPlan] = useState<Plan | null>(null);
  const [seedActivityPlan, setSeedActivityPlan] =
    useState<ActivityBookPlan | null>(null);
  const [seedReference, setSeedReference] = useState<string | null>(null);
  const [seedMode, setSeedMode] = useState<"qa" | "story" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // A bulk-book studio elsewhere can deep-link into this chat with a starting
  // idea (?seedMode=story&seedIdea=...). Consumed once into the chat.
  const [chatSeedMode, setChatSeedMode] = useState<"qa" | "story" | null>(null);
  const [chatSeedIdea, setChatSeedIdea] = useState<string>("");
  const consumedQueryRef = useRef(false);
  const consumedPlanRef = useRef(false);
  const consumedActivityRef = useRef(false);

  useEffect(() => {
    if (consumedQueryRef.current) return;
    consumedQueryRef.current = true;
    const m = searchParams.get("seedMode");
    const idea = searchParams.get("seedIdea");
    if (m === "qa" || m === "story") setChatSeedMode(m);
    if (idea) setChatSeedIdea(idea);
  }, [searchParams]);

  // Restore an approved plan after a logged-out → login round-trip.
  useEffect(() => {
    if (consumedPlanRef.current) return;
    consumedPlanRef.current = true;
    const action = consumePendingAction("chat-plan");
    const p = action?.payload as
      | { plan?: Plan; mode?: "qa" | "story" }
      | undefined;
    if (!p?.plan) return;
    setSeedPlan(p.plan);
    if (p.mode) setSeedMode(p.mode);
    setView("studio");
  }, []);

  useEffect(() => {
    if (consumedActivityRef.current) return;
    consumedActivityRef.current = true;
    const action = consumePendingAction("chat-activity-plan");
    const p = action?.payload as { plan?: ActivityBookPlan } | undefined;
    if (!p?.plan) return;
    setSeedActivityPlan(p.plan);
    setView("studio");
  }, []);

  const handleBrief = useCallback(
    (
      brief: BookBrief,
      mode: "qa" | "story",
      referenceDataUrl?: string | null,
    ) => {
      setError(null);
      try {
        createCustomCategory({
          name: brief.name,
          icon: brief.icon || "📚",
          coverScene: brief.coverScene,
          scene: brief.pageScene,
          prompts: brief.prompts,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save book.");
        return;
      }
      const plan = briefToPlan(brief);
      if (!user) {
        savePendingAction({
          type: "chat-plan",
          returnTo: RETURN_TO,
          payload: { plan, mode },
        });
        router.push(`/login?next=${encodeURIComponent(RETURN_TO)}`);
        return;
      }
      setSeedActivityPlan(null);
      setSeedPlan(plan);
      setSeedReference(referenceDataUrl ?? null);
      setSeedMode(mode);
      setView("studio");
    },
    [user, router],
  );

  const handleActivityPlan = useCallback(
    (plan: ActivityBookPlan) => {
      setError(null);
      if (!user) {
        savePendingAction({
          type: "chat-activity-plan",
          returnTo: RETURN_TO,
          payload: { plan },
        });
        router.push(`/login?next=${encodeURIComponent(RETURN_TO)}`);
        return;
      }
      setSeedPlan(null);
      setSeedReference(null);
      setSeedMode(null);
      setSeedActivityPlan(plan);
      setView("studio");
    },
    [user, router],
  );

  const resetToChat = useCallback(() => {
    setSeedPlan(null);
    setSeedActivityPlan(null);
    setSeedReference(null);
    setSeedMode(null);
    setView("chat");
  }, []);

  if (view === "studio") {
    return (
      <BookStudio
        key={seedActivityPlan?.title ?? seedPlan?.title ?? "blank"}
        initialPlan={seedPlan ?? undefined}
        initialActivityPlan={seedActivityPlan ?? undefined}
        initialReference={seedReference ?? undefined}
        initialMode={seedMode ?? undefined}
        onSwitchToChat={(idea, mode) => {
          setChatSeedMode(mode);
          setChatSeedIdea(idea);
          resetToChat();
        }}
        onReset={resetToChat}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto rounded-3xl bg-zinc-950 border border-white/10 shadow-2xl shadow-violet-500/10 overflow-hidden">
      {error && (
        <div className="px-6 md:px-8 pt-4 -mb-2 text-sm text-red-300 bg-red-500/5 border-b border-red-500/20">
          {error}
        </div>
      )}
      <GuidedChat
        onBrief={handleBrief}
        onActivityPlan={handleActivityPlan}
        onBack={() => router.push("/")}
        immersiveOnMobile
        seedMode={chatSeedMode ?? undefined}
        seedIdea={chatSeedIdea || undefined}
        onSeedConsumed={() => {
          setChatSeedMode(null);
          setChatSeedIdea("");
        }}
      />
    </div>
  );
}
