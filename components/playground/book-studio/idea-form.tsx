"use client";

import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  BookPlus,
  ChevronDown,
  ClipboardList,
  Lightbulb,
  Loader2,
  PencilRuler,
  Wand2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { ReferenceImageField } from "@/components/ui/reference-image-field";
import { IdeaSuggestionsPanel } from "@/components/playground/idea-suggestions-panel";
import {
  extractPageCountFromIdeaText,
  categoryToStoryType,
} from "@/lib/idea-suggestions";
import { SelectField } from "@/components/playground/select-field";
import { AspectRatioPicker } from "@/components/playground/aspect-ratio-picker";
import { type StoryType } from "@/lib/story-book-planner";
import { StoryTypePicker } from "@/components/playground/story-type-picker";
import { DialogueStylePicker } from "@/components/playground/dialogue-style-picker";
import type { DialogueStyle } from "@/lib/prompts";
import type { ActivityDifficulty } from "@/lib/activities/types";
import { ActivityCountPicker } from "@/components/playground/activity-book/activity-count-picker";
import { ActivitySplitPreview } from "@/components/playground/activity-book/activity-split-preview";
import type { ActivityCounts } from "@/lib/activities/types";
import { SegmentedControl } from "@/components/playground/activity-book/segmented-control";
import { PlanButton } from "./plan-button";
import {
  AGE_LABELS,
  ASPECTS,
  DETAIL_DESCRIPTIONS,
  DETAIL_LABELS,
} from "./book-studio-constants";
import type { AgeRange, Aspect, DetailLevel } from "./types";

export function IdeaForm({
  idea,
  setIdea,
  pageCount,
  setPageCount,
  age,
  setAge,
  detailLevel,
  setDetailLevel,
  aspectRatio,
  setAspectRatio,
  reference,
  setReference,
  planning,
  onPlan,
  error,
  bookKind,
  setBookKind,
  activityCounts,
  setActivityCounts,
  activityDifficulty,
  setActivityDifficulty,
  storyType,
  setStoryType,
  storyCharacterNames,
  setStoryCharacterNames,
  dialogueStyle,
  setDialogueStyle,
  onSwitchToChat,
  planReady,
  planTitle,
  planPageCount,
  onViewPlan,
}: {
  idea: string;
  setIdea: (v: string) => void;
  pageCount: number;
  setPageCount: (v: number) => void;
  age: AgeRange;
  setAge: (v: AgeRange) => void;
  detailLevel: DetailLevel;
  setDetailLevel: (v: DetailLevel) => void;
  aspectRatio: Aspect;
  setAspectRatio: (v: Aspect) => void;
  reference: string | null;
  setReference: (v: string | null) => void;
  planning: boolean;
  onPlan: () => void;
  error: string | null;
  bookKind: "coloring" | "story" | "activity";
  setBookKind: (v: "coloring" | "story" | "activity") => void;
  activityCounts: ActivityCounts;
  setActivityCounts: (v: ActivityCounts) => void;
  activityDifficulty: ActivityDifficulty | "auto";
  setActivityDifficulty: (v: ActivityDifficulty | "auto") => void;
  storyType: StoryType | null;
  setStoryType: (v: StoryType | null) => void;
  storyCharacterNames: string;
  setStoryCharacterNames: (v: string) => void;
  dialogueStyle: DialogueStyle;
  setDialogueStyle: (v: DialogueStyle) => void;
  onSwitchToChat?: (idea: string, mode: "qa" | "story") => void;
  planReady?: boolean;
  planTitle?: string;
  planPageCount?: number;
  onViewPlan?: () => void;
}) {
  const [showIdeas, setShowIdeas] = useState(false);
  const [showHelper, setShowHelper] = useState(false);
  const [improving, setImproving] = useState(false);
  const isStory = bookKind === "story";
  const isActivity = bookKind === "activity";
  const ideasPanelRef = useRef<HTMLDivElement>(null);

  const handleImprove = async () => {
    if (improving || idea.trim().length < 5) return;
    setImproving(true);
    try {
      const endpoint = isStory
        ? "/api/improve-story-idea"
        : "/api/improve-coloring-idea";
      const payload: Record<string, unknown> = { idea, ageBand: age, pageCount };
      if (isStory) {
        if (storyType) payload.storyType = storyType;
        if (dialogueStyle) payload.dialogueStyle = dialogueStyle;
        if (storyCharacterNames)
          payload.characterNames = storyCharacterNames;
      } else {
        if (detailLevel) payload.detailLevel = detailLevel;
      }
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { idea?: string; error?: string };
      if (!res.ok || !json.idea) {
        throw new Error(json.error || `Improve failed (${res.status})`);
      }
      setIdea(json.idea);
      toast.success("Polished — your idea is now richer.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Couldn't improve the idea.";
      toast.error(message);
    } finally {
      setImproving(false);
    }
  };

  // When the user toggles ideas on, scroll the panel into view. Use
  // `nearest` so the browser only scrolls the minimum needed — bringing
  // the panel top into the lower part of the viewport while the textarea
  // above stays visible. `start` was pulling the page too far down.
  useEffect(() => {
    if (!showIdeas) return;
    const id = requestAnimationFrame(() => {
      ideasPanelRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    });
    return () => cancelAnimationFrame(id);
  }, [showIdeas]);

  const showPlanReadyBanner = planReady && !!onViewPlan;

  return (
    <div className="rounded-3xl p-6 md:p-8 bg-zinc-900/60 backdrop-blur-xl border border-white/10 space-y-6">
      {showPlanReadyBanner && (
        <button
          type="button"
          onClick={onViewPlan}
          className="w-full text-left flex items-center gap-3 rounded-2xl border border-violet-500/40 bg-linear-to-r from-violet-500/15 to-cyan-400/10 px-4 py-3 hover:from-violet-500/25 hover:to-cyan-400/15 transition-colors group"
        >
          <span className="w-9 h-9 rounded-full bg-violet-500/30 flex items-center justify-center shrink-0">
            <ClipboardList className="w-4 h-4 text-violet-100" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-violet-200">
              Plan ready
              {typeof planPageCount === "number" && (
                <span className="opacity-70">
                  {" "}
                  · {planPageCount} {planPageCount === 1 ? "page" : "pages"}
                </span>
              )}
            </span>
            <span className="block text-sm font-semibold text-white truncate">
              {planTitle ?? "Your book"}
            </span>
          </span>
          <span className="text-[12px] font-semibold text-violet-100 inline-flex items-center gap-1 shrink-0 px-3 py-1.5 rounded-full bg-white/10 group-hover:bg-white/15 border border-white/15">
            View plan
          </span>
        </button>
      )}
      {/* Book-kind toggle — coloring vs story. Story redirects to Sparky AI
          chat because story books need multi-turn planning (characters,
          palette, dialogue) that this one-shot form can't capture cleanly. */}
      <div>
        <label className="block text-base font-semibold text-neutral-100 mb-2.5">
          What are you making?
        </label>
        <div className="sm:hidden">
          <SelectField<"coloring" | "story" | "activity">
            value={bookKind}
            onChange={setBookKind}
            disabled={planning}
            ariaLabel="Book type"
            options={[
              { value: "coloring", label: "Coloring book" },
              { value: "story", label: "Story book" },
              { value: "activity", label: "Activity book" },
            ]}
          />
        </div>
        <div
          role="radiogroup"
          aria-label="Book type"
          className="hidden sm:inline-flex sm:w-auto p-1.5 rounded-xl border border-white/10 bg-black/40"
        >
          <button
            type="button"
            role="radio"
            aria-checked={bookKind === "coloring"}
            onClick={() => setBookKind("coloring")}
            disabled={planning}
            className={cn(
              "flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors",
              bookKind === "coloring"
                ? "bg-linear-to-r from-violet-500 to-cyan-400 text-white shadow"
                : "text-neutral-400 hover:text-white",
            )}
          >
            <BookPlus className="w-4 h-4" />
            Coloring book
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={isStory}
            onClick={() => setBookKind("story")}
            disabled={planning}
            className={cn(
              "flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors",
              isStory
                ? "bg-linear-to-r from-cyan-500 to-emerald-400 text-white shadow"
                : "text-neutral-400 hover:text-white",
            )}
          >
            <BookOpen className="w-4 h-4" />
            Story book
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={isActivity}
            onClick={() => setBookKind("activity")}
            disabled={planning}
            className={cn(
              "flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors",
              isActivity
                ? "bg-linear-to-r from-amber-500 to-orange-500 text-white shadow"
                : "text-neutral-400 hover:text-white",
            )}
          >
            <PencilRuler className="w-4 h-4" />
            Activity book
          </button>
        </div>
        {/* Mode-specific helper banner — same visual treatment in both
            modes so the form reads consistently. Larger type and clearer
            copy for non-technical users. */}
        {isActivity ? (
          <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/5 text-amber-100/95 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowHelper((v) => !v)}
              aria-expanded={showHelper}
              className="w-full flex items-center justify-between gap-3 px-5 py-3 text-left"
            >
              <span className="font-semibold text-amber-200 text-sm sm:text-base">
                Activity book · mazes, puzzles, tracing &amp; more
              </span>
              <ChevronDown
                className={cn(
                  "w-4 h-4 shrink-0 text-amber-300 transition-transform duration-300",
                  showHelper && "rotate-180",
                )}
              />
            </button>
            <AnimatePresence initial={false}>
              {showHelper && (
                <motion.div
                  key="activity-helper"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                  className="overflow-hidden"
                >
                  <p className="text-sm leading-relaxed px-5 pb-4">
                    You&apos;ll get an 8.5×11 KDP-ready activity book that mixes
                    mazes, word searches, crosswords, tracing, dot-to-dot, and
                    more — interleaved with a difficulty ramp. Type a theme
                    below, pick which activities to include (or let us surprise
                    you), and we&apos;ll plan the whole book. Most pages render
                    free and instantly.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : isStory ? (
          <div className="mt-3 rounded-xl border border-cyan-500/30 bg-cyan-500/5 text-cyan-100/95 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowHelper((v) => !v)}
              aria-expanded={showHelper}
              className="w-full flex items-center justify-between gap-3 px-5 py-3 text-left"
            >
              <span className="font-semibold text-cyan-200 text-sm sm:text-base">
                Story book · full-color with dialogue
              </span>
              <ChevronDown
                className={cn(
                  "w-4 h-4 shrink-0 text-cyan-300 transition-transform duration-300",
                  showHelper && "rotate-180",
                )}
              />
            </button>
            <AnimatePresence initial={false}>
              {showHelper && (
                <motion.div
                  key="story-helper"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                  className="overflow-hidden"
                >
                  <p className="text-sm leading-relaxed px-5 pb-4">
                    You&apos;ll get a 6×9 story book where the same characters
                    appear across every page, the colors stay consistent, and
                    speech bubbles render the dialogue. Type your story idea
                    below — a fable name, a character, or your own plot —
                    pick a story type if you want a specific tone, and
                    we&apos;ll draft the whole book in one shot.{" "}
                    {onSwitchToChat ? (
                      <>
                        Prefer a back-and-forth chat?{" "}
                        <button
                          type="button"
                          onClick={() => onSwitchToChat(idea, "story")}
                          className="underline underline-offset-2 hover:text-cyan-100 font-semibold"
                        >
                          Plan with Sparky AI →
                        </button>
                      </>
                    ) : null}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-violet-500/30 bg-violet-500/5 text-violet-100/95 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowHelper((v) => !v)}
              aria-expanded={showHelper}
              className="w-full flex items-center justify-between gap-3 px-5 py-3 text-left"
            >
              <span className="font-semibold text-violet-200 text-sm sm:text-base">
                Coloring book · black-and-white line art
              </span>
              <ChevronDown
                className={cn(
                  "w-4 h-4 shrink-0 text-violet-300 transition-transform duration-300",
                  showHelper && "rotate-180",
                )}
              />
            </button>
            <AnimatePresence initial={false}>
              {showHelper && (
                <motion.div
                  key="coloring-helper"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                  className="overflow-hidden"
                >
                  <p className="text-sm leading-relaxed px-5 pb-4">
                    You&apos;ll get an 8.5×11 KDP-ready coloring book with bold
                    outlines kids can color in. Type either a{" "}
                    <strong className="text-violet-100">theme</strong> (e.g.{" "}
                    &ldquo;20 farm animals&rdquo;, &ldquo;ocean creatures&rdquo;)
                    for independent subjects on each page, OR a{" "}
                    <strong className="text-violet-100">story</strong> (e.g.{" "}
                    &ldquo;The Tortoise and the Hare&rdquo;, &ldquo;a panda&apos;s
                    first day&rdquo;) for a narrative coloring book where each
                    page is a scene from the story. We&apos;ll detect which one
                    you want and structure the pages accordingly.{" "}
                    {onSwitchToChat ? (
                      <>
                        Prefer a back-and-forth chat?{" "}
                        <button
                          type="button"
                          onClick={() => onSwitchToChat(idea, "qa")}
                          className="underline underline-offset-2 hover:text-violet-100 font-semibold"
                        >
                          Plan with Sparky AI →
                        </button>
                      </>
                    ) : null}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {isStory && (
        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          <div>
            <label
              htmlFor="story-type"
              className="block text-sm font-semibold text-neutral-200 mb-2"
            >
              Story type
            </label>
            <StoryTypePicker
              id="story-type"
              value={storyType}
              onChange={setStoryType}
              disabled={planning}
            />
            <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
              Shapes the planner&apos;s tone — moral fables build to a lesson,
              bedtime stories wind down to rest, mysteries follow a small
              puzzle. Optional — leave on &ldquo;No preference&rdquo; and
              we&apos;ll match the natural shape of your idea.
            </p>
          </div>
          <div>
            <label
              htmlFor="story-character-names"
              className="block text-sm font-semibold text-neutral-200 mb-2"
            >
              Character names{" "}
              <span className="text-neutral-500 font-normal">(optional)</span>
            </label>
            <input
              id="story-character-names"
              type="text"
              value={storyCharacterNames}
              onChange={(e) => setStoryCharacterNames(e.target.value)}
              placeholder="e.g. Pip, Daisy, Miss Honey"
              disabled={planning}
              className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-60"
            />
            <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
              Comma-separated. Leave blank and we&apos;ll invent kid-safe
              names that fit your story (and use canonical names for known
              fables).
            </p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-neutral-200 mb-2">
              Dialogue style
            </label>
            <DialogueStylePicker
              value={dialogueStyle}
              onChange={setDialogueStyle}
              disabled={planning}
            />
            <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
              How chatty the book feels. Quiet = narration-driven bedtime
              energy. Balanced = captions + dialogue (default). Chatty =
              most pages have speech bubbles with back-and-forth exchanges.
            </p>
          </div>
        </div>
      )}

      {isActivity && (
        <div className="space-y-4">
          <div className="max-w-xs">
            <SegmentedControl
              label="Difficulty"
              value={activityDifficulty}
              onChange={setActivityDifficulty}
              options={[
                { value: "auto", label: "Auto" },
                { value: "easy", label: "Easy" },
                { value: "medium", label: "Med" },
                { value: "hard", label: "Hard" },
              ]}
            />
          </div>
          <ActivityCountPicker
            counts={activityCounts}
            onChange={setActivityCounts}
            pageCount={pageCount}
            age={age}
          />
          <ActivitySplitPreview pageCount={pageCount} age={age} counts={activityCounts} />
        </div>
      )}

      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <label className="block text-sm font-semibold text-neutral-200">
            Your {isStory ? "story" : "book"} idea{" "}
            <span className="text-violet-400">*</span>
          </label>
          <button
            type="button"
            onClick={() => setShowIdeas((v) => !v)}
            disabled={planning}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-linear-to-r from-violet-500/15 to-cyan-500/15 border border-violet-500/40 text-violet-200 hover:from-violet-500/25 hover:to-cyan-500/25 disabled:opacity-50 transition-colors"
          >
            <Lightbulb className="w-3 h-3" />
            {showIdeas ? "Hide ideas" : "Show me ideas"}
          </button>
        </div>
        <div className="relative">
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder={
              isActivity
                ? "e.g. ABC & 123 learning for preschoolers, OR an ocean-themed pack (mazes, word search, tracing, dot-to-dot), OR a general fun activity book for ages 6-8. 24 pages."
                : isStory
                  ? "e.g. The Tortoise and the Hare for ages 3-6, or a story I made up about a tiny dragon learning to fly. 8-12 scenes."
                  : "e.g. A coloring book for ages 3-6 about space adventures — astronauts, rockets, planets, friendly aliens. 20 unique pages."
            }
            rows={5}
            className="w-full px-4 py-3 pb-12 rounded-xl bg-black/50 border border-white/10 text-white text-sm placeholder:text-neutral-500 focus:outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 resize-y min-h-[120px]"
            disabled={planning || improving}
          />
          <button
            type="button"
            onClick={handleImprove}
            disabled={
              planning || improving || idea.trim().length < 5
            }
            title="Polish my idea — AI rewrites it into a richer brief"
            className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/90 hover:bg-violet-500 text-white text-xs font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {improving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Wand2 className="w-3.5 h-3.5" />
            )}
            {improving ? "Polishing…" : "Polish my idea"}
          </button>
        </div>
        {showIdeas && (
          <div ref={ideasPanelRef} className="mt-3 scroll-mt-4">
            <IdeaSuggestionsPanel
              open={showIdeas}
              onClose={() => setShowIdeas(false)}
              onPick={(picked) => {
                setIdea(picked.text);
                const derivedPageCount = extractPageCountFromIdeaText(
                  picked.text,
                );
                if (derivedPageCount) setPageCount(derivedPageCount);
                if (isStory && !storyType) {
                  const derivedType = categoryToStoryType(picked.category);
                  if (derivedType) setStoryType(derivedType as StoryType);
                }
              }}
              kind={isStory ? "story" : isActivity ? "activity" : "coloring"}
              storyType={isStory ? storyType : null}
              currentAge={age}
              onAudienceChange={(slug) => {
                if (slug !== "any") setAge(slug);
              }}
            />
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4 md:gap-10 lg:gap-14">
        <div>
          <label className="block text-sm font-semibold text-neutral-200 mb-2">
            Page count <span className="font-mono text-violet-300">{pageCount}</span>
          </label>
          <input
            type="range"
            min={5}
            max={50}
            step={1}
            value={pageCount}
            onChange={(e) => setPageCount(Number(e.target.value))}
            disabled={planning}
            className="w-full accent-violet-500"
          />
          <div className="flex justify-between text-[10px] text-neutral-500 font-mono mt-1">
            <span>5</span>
            <span>20 (standard)</span>
            <span>50</span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-neutral-200 mb-2">Audience</label>
          <div className="flex flex-wrap gap-1.5">
            {(Object.entries(AGE_LABELS) as [AgeRange, string][]).map(([v, label]) => (
              <button
                key={v}
                type="button"
                onClick={() => setAge(v)}
                disabled={planning}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium border",
                  v === age
                    ? "bg-linear-to-r from-violet-500 to-cyan-400 text-white border-transparent shadow"
                    : "bg-black/40 border-white/10 text-neutral-300 hover:border-violet-500/40"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 md:gap-10 lg:gap-14">
        {bookKind === "coloring" && (
          <div>
            <label className="block text-sm font-semibold text-neutral-200 mb-2">
              Detail level{" "}
              <span className="font-normal text-[11px] text-neutral-400">
                — controls how much background fits around the main subject
              </span>
            </label>
            <SelectField<DetailLevel>
              value={detailLevel}
              onChange={setDetailLevel}
              disabled={planning}
              ariaLabel="Detail level"
              options={(Object.keys(DETAIL_LABELS) as DetailLevel[]).map(
                (v) => ({
                  value: v,
                  label: DETAIL_LABELS[v],
                  hint: DETAIL_DESCRIPTIONS[v],
                }),
              )}
            />
            <p className="text-[11px] text-neutral-500 mt-1.5 leading-relaxed">
              {DETAIL_DESCRIPTIONS[detailLevel]}
            </p>
          </div>
        )}

        <div className={isStory ? "md:col-span-2" : undefined}>
          <label className="block text-sm font-semibold text-neutral-200 mb-2">
            Aspect ratio
          </label>
          <AspectRatioPicker
            value={aspectRatio}
            onChange={setAspectRatio}
            options={ASPECTS.map((a) => ({
              value: a,
              label:
                a === "1:1"
                  ? "Square"
                  : a === "3:4"
                    ? "KDP"
                    : a === "2:3"
                      ? "Tall"
                      : a === "4:3"
                        ? "Landscape"
                        : "Wide",
            }))}
            disabled={planning}
          />
        </div>
      </div>

      {!isStory && (
        <ReferenceImageField
          value={reference}
          onChange={setReference}
          helper="Optional: Gemini will borrow style, palette, and composition from this image for both cover and pages."
        />
      )}

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-300">
          <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <PlanButton
        onClick={onPlan}
        disabled={planning || idea.trim().length < 10}
        planning={planning}
        isStory={isStory}
      />
      <p className="text-[11px] text-center text-neutral-500">
        {isStory
          ? `We'll draft characters, a palette, ${pageCount} scenes, and dialogue from your idea. You can review + edit before generation starts.`
          : `Gemini will draft a title, cover scene, and ${pageCount} page prompts. You can review + edit before generation starts.`}
      </p>
    </div>
  );
}
