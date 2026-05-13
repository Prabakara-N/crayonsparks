"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, RefreshCw, Loader2, X } from "lucide-react";
import type {
  IdeaAudience,
  IdeaKind,
  IdeaStoryType,
  IdeaSuggestion,
} from "@/lib/idea-suggestions";

const AUDIENCES: Array<{ slug: IdeaAudience; label: string }> = [
  { slug: "any", label: "Surprise me" },
  { slug: "toddlers", label: "Toddlers 3-6" },
  { slug: "kids", label: "Kids 6-10" },
  { slug: "tweens", label: "Tweens 10-14" },
];

const COLORING_FALLBACK_IDEAS: IdeaSuggestion[] = [
  {
    text: "20 cute ocean animal coloring pages with big simple shapes ages 3-6",
    category: "Animals",
    icon: "🐠",
  },
  {
    text: "Friendly construction vehicle coloring pages with bold outlines for little builders",
    category: "Vehicles",
    icon: "🦖",
  },
  {
    text: "Cute baby farm animal coloring pages with simple scenes for toddlers",
    category: "Animals",
    icon: "🦄",
  },
  {
    text: "Magical unicorn coloring pages with castles, rainbows, and gentle fantasy details",
    category: "Fantasy",
    icon: "🚜",
  },
  {
    text: "Big friendly dinosaur coloring pages with playful prehistoric scenes ages 4-7",
    category: "Animals",
    icon: "🐮",
  },
  {
    text: "Simple fruit and vegetable character coloring pages for preschool practice",
    category: "Food",
    icon: "🎃",
  },
];

const STORY_FALLBACK_IDEAS: IdeaSuggestion[] = [
  {
    text: "The Tortoise and the Hare retold for toddlers ages 3-6 (8 scenes)",
    category: "Fable",
    icon: "🐢",
  },
  {
    text: "The Crow and the Pitcher — a clever fable for kids ages 4-7 (8 scenes)",
    category: "Fable",
    icon: "🐦",
  },
  {
    text: "The Lion and the Mouse — friendship across sizes for ages 5-8 (8 scenes)",
    category: "Fable",
    icon: "🦁",
  },
  {
    text: "Goldilocks and the Three Bears for toddlers ages 3-6 (10 scenes)",
    category: "Fairytale",
    icon: "🐻",
  },
  {
    text: "A shy elephant learns confidence with gentle friends, ages 3-6 (10 scenes)",
    category: "Original",
    icon: "🐉",
  },
  {
    text: "A tiny turtle learns patience while waiting his turn, ages 3-6 (8 scenes)",
    category: "Original",
    icon: "🐼",
  },
  {
    text: "A little lion learns kindness after helping a smaller friend, ages 4-7 (10 scenes)",
    category: "Original",
    icon: "🌙",
  },
  {
    text: "An alphabet adventure with one tiny mission per letter, ages 3-6 (12 scenes)",
    category: "Original",
    icon: "🦊",
  },
];

const STORY_TYPE_FALLBACK_IDEAS: Partial<Record<IdeaStoryType, IdeaSuggestion[]>> = {
  bedtime: [
    {
      text: "A sleepy moon rabbit learns a calming bedtime routine, ages 3-6 (10 scenes)",
      category: "Bedtime",
      icon: "🌙",
    },
    {
      text: "A tiny bear says goodnight to the forest one friend at a time (8 scenes)",
      category: "Bedtime",
      icon: "🐻",
    },
  ],
  mystery: [
    {
      text: "Milo Mouse follows tiny pawprints to find the missing picnic bell (10 scenes)",
      category: "Mystery",
      icon: "🔎",
    },
    {
      text: "A classroom hamster solves who moved the rainbow crayons, ages 4-7 (8 scenes)",
      category: "Mystery",
      icon: "🧩",
    },
  ],
  moral: [
    {
      text: "The Lion and the Mouse retold as a kindness lesson, ages 4-7 (8 scenes)",
      category: "Fable",
      icon: "🦁",
    },
    {
      text: "A proud peacock learns sharing makes the garden brighter, ages 3-6 (10 scenes)",
      category: "Fable",
      icon: "🦚",
    },
  ],
  fairytale: [
    {
      text: "A tiny baker helps a lost fairy find the starlight gate (12 scenes)",
      category: "Fairytale",
      icon: "🧚",
    },
    {
      text: "Goldilocks learns gentle manners with three friendly bears, ages 3-6 (10 scenes)",
      category: "Fairytale",
      icon: "🐻",
    },
  ],
  adventure: [
    {
      text: "A brave turtle carries a map across the rainbow river, ages 4-7 (12 scenes)",
      category: "Adventure",
      icon: "🗺️",
    },
    {
      text: "Two fox friends search the meadow for a lost kite, ages 3-6 (10 scenes)",
      category: "Adventure",
      icon: "🪁",
    },
  ],
  fantasy: [
    {
      text: "A tiny dragon learns to fly using one gentle magic feather (12 scenes)",
      category: "Fantasy",
      icon: "🐉",
    },
    {
      text: "A cloud kitten discovers a door to the rainbow library, ages 4-7 (10 scenes)",
      category: "Fantasy",
      icon: "🌈",
    },
  ],
  comic: [
    {
      text: "A clumsy dinosaur tries to bake one very wobbly cake (10 scenes)",
      category: "Comic",
      icon: "🍰",
    },
    {
      text: "Three ducklings start a silly marching band in the park (8 scenes)",
      category: "Comic",
      icon: "🥁",
    },
  ],
  fiction: [
    {
      text: "A shy kitten makes one new friend on the first day of school (10 scenes)",
      category: "Original",
      icon: "🐱",
    },
    {
      text: "A little koala learns to ask for help at art class (8 scenes)",
      category: "Original",
      icon: "🐨",
    },
  ],
  "non-fiction": [
    {
      text: "A curious bee tours how flowers become fruit, ages 4-7 (10 scenes)",
      category: "Educational",
      icon: "🐝",
    },
    {
      text: "A raindrop shows the water cycle through a gentle journey (10 scenes)",
      category: "Educational",
      icon: "💧",
    },
  ],
};

interface IdeaSuggestionsPanelProps {
  open: boolean;
  onClose: () => void;
  onPick: (idea: IdeaSuggestion) => void;
  kind?: IdeaKind;
  storyType?: IdeaStoryType | null;
  currentAge?: "toddlers" | "kids" | "tweens";
  onAudienceChange?: (audience: IdeaAudience) => void;
}

export function IdeaSuggestionsPanel({
  open,
  onClose,
  onPick,
  kind = "coloring",
  storyType = null,
  currentAge,
  onAudienceChange,
}: IdeaSuggestionsPanelProps) {
  const [audience, setAudience] = useState<IdeaAudience>(currentAge ?? "any");
  const [ideas, setIdeas] = useState<IdeaSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  const fetchIdeas = useCallback(
    async (aud: IdeaAudience, k: IdeaKind, selectedStoryType: IdeaStoryType | null) => {
      setLoading(true);
      setError(null);
      setUsingFallback(false);
      try {
        const res = await fetch("/api/idea-suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            audience: aud,
            kind: k,
            storyType: k === "story" ? selectedStoryType : null,
          }),
        });
        const json = (await res.json()) as {
          ideas?: IdeaSuggestion[];
          error?: string;
        };
        if (!res.ok || !json.ideas?.length) {
          throw new Error(json.error || "No ideas returned.");
        }
        setIdeas(json.ideas);
      } catch (e) {
        // Soft-fail: show static fallback so the UX still works.
        setError(e instanceof Error ? e.message : "Couldn't fetch ideas.");
        setIdeas(
          k === "story"
            ? [
                ...(selectedStoryType
                  ? STORY_TYPE_FALLBACK_IDEAS[selectedStoryType] ?? []
                  : []),
                ...STORY_FALLBACK_IDEAS,
              ].slice(0, 8)
            : COLORING_FALLBACK_IDEAS,
        );
        setUsingFallback(true);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Initial fetch when first opened; re-fetch when audience OR kind changes.
  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => {
      void fetchIdeas(audience, kind, storyType);
    }, 0);
    return () => window.clearTimeout(id);
  }, [open, audience, kind, storyType, fetchIdeas]);

  // Mirror the form's age picker into the panel's audience pill.
  useEffect(() => {
    if (currentAge && currentAge !== audience) setAudience(currentAge);
  }, [currentAge]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -6, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -6, scale: 0.98 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl border border-violet-500/30 bg-zinc-950/95 backdrop-blur-xl shadow-2xl shadow-violet-500/20 p-4 space-y-3"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <h4 className="font-display text-sm font-semibold text-white">
              {kind === "story"
                ? "Pick a story, Sparky'll plan it"
                : "Pick an idea, Sparky'll plan it"}
            </h4>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-white/5 text-neutral-400"
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {AUDIENCES.map((a) => {
            const active = a.slug === audience;
            return (
              <button
                key={a.slug}
                type="button"
                onClick={() => {
                  setAudience(a.slug);
                  onAudienceChange?.(a.slug);
                }}
                disabled={loading}
                className={`text-[11px] px-2.5 py-1 rounded-full border font-medium transition-colors disabled:opacity-50 ${
                  active
                    ? "bg-linear-to-r from-violet-500 to-cyan-400 text-white border-transparent"
                    : "bg-white/5 border-white/10 text-neutral-300 hover:border-violet-500/40 hover:text-white"
                }`}
              >
                {a.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => void fetchIdeas(audience, kind, storyType)}
            disabled={loading}
            className="ml-auto inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-neutral-300 hover:border-violet-500/40 hover:text-white disabled:opacity-50"
            aria-label="Try other ideas"
          >
            {loading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
            Try other ideas
          </button>
        </div>

        {usingFallback && (
          <p className="text-[10px] text-amber-300/80 italic">
            ⚠ Couldn&apos;t reach the AI right now — showing starter ideas.
            {error ? ` (${error})` : ""}
          </p>
        )}

        <div className="grid sm:grid-cols-2 gap-1.5 max-h-[60vh] overflow-y-auto pr-1">
          {loading
            ? [0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div
                  key={i}
                  className="h-14 rounded-xl bg-white/5 border border-white/10 animate-pulse"
                />
              ))
            : ideas.map((idea, i) => (
                <button
                  key={`${idea.text}-${i}`}
                  type="button"
                  onClick={() => {
                    onPick(idea);
                    onClose();
                  }}
                  className="text-left p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-violet-500/40 hover:bg-violet-500/5 transition-colors group"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-base shrink-0 leading-tight">
                      {idea.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-neutral-200 leading-snug group-hover:text-white">
                        {idea.text}
                      </p>
                      <span className="inline-block mt-1 text-[9px] uppercase tracking-wider font-mono text-violet-300/80">
                        {idea.category}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
