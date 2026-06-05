"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Wand2, BookPlus } from "lucide-react";
import { PlaygroundStudio } from "@/components/playground/playground-studio/playground-studio-main";
import { BookStudio, type Plan } from "@/components/playground/book-studio/book-studio-main";
import { CATEGORIES, type ColoringCategory } from "@/lib/prompts";
import { useDialog } from "@/components/ui/confirm-dialog";

/**
 * Maps a built-in ColoringCategory (the 14 ready-made themes from the
 * Gallery) into a finalized Plan that BookStudio's bulk-book flow can
 * render directly. Skips Sparky AI entirely — every category already
 * has 20 curated prompts + cover scene + KDP metadata.
 */
function categoryToPlan(c: ColoringCategory): Plan {
  return {
    title: c.kdp.title,
    coverTitle: c.coverTitle,
    description: c.kdp.description,
    scene: c.scene,
    coverScene: c.coverScene,
    prompts: c.prompts.map((p) => ({ name: p.name, subject: p.subject })),
  };
}

interface SeededCategoryBadge {
  icon: string;
  name: string;
  count: number;
}

const TABS = [
  {
    slug: "single-image",
    label: "Single image",
    icon: Wand2,
    description:
      "Generate one freeform image — fast. Best for testing prompts, making thumbnails, or one-off art.",
    bestFor: "Testing prompts · Quick thumbnails",
  },
  {
    slug: "bulk-book",
    label: "Bulk book",
    icon: BookPlus,
    description:
      "Describe your book idea once and generate the full 20-page interior + cover + back cover in one flow, ready for Amazon KDP.",
    bestFor: "Power users · End-to-end KDP package",
  },
] as const;

type TabSlug = (typeof TABS)[number]["slug"];

const DEFAULT_TAB: TabSlug = "single-image";

function isTabSlug(value: string | null): value is TabSlug {
  return TABS.some((t) => t.slug === value);
}

export function PlaygroundShell() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // A gallery category seeds BookStudio with a pre-built plan; that's the only
  // hand-in the playground keeps (Sparky AI lives on its own /sparky-ai page).
  const [seedPlan, setSeedPlan] = useState<Plan | null>(null);
  const [seededCategory, setSeededCategory] =
    useState<SeededCategoryBadge | null>(null);
  // Ref so we only consume the ?category= param once per page load — even
  // if React re-runs the effect, we never re-seed and clobber the user's
  // in-progress edits.
  const consumedCategoryRef = useRef(false);
  const bulkPlanningRef = useRef(false);
  const dialog = useDialog();

  const activeTab: TabSlug = useMemo(() => {
    const raw = searchParams.get("tab");
    return isTabSlug(raw) ? raw : DEFAULT_TAB;
  }, [searchParams]);

  const setTab = useCallback(
    (slug: TabSlug) => {
      const params = new URLSearchParams(searchParams.toString());
      if (slug === DEFAULT_TAB) {
        params.delete("tab");
      } else {
        params.set("tab", slug);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      // Smooth-scroll to the top after the new tab's React tree has mounted
      // and laid out — calling scrollTo synchronously can be interrupted
      // when the swapped panel changes the document height a frame later.
      // Two rAFs guarantees layout has settled before the scroll starts.
      if (typeof window !== "undefined") {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            window.scrollTo({ top: 0, behavior: "smooth" });
          });
        });
      }
    },
    [router, pathname, searchParams],
  );

  // Gallery → playground hand-off: when ?category=<slug> is present,
  // seed BookStudio with the category's pre-built brief and switch to
  // the bulk-book tab. The user lands one click away from generation.
  useEffect(() => {
    if (consumedCategoryRef.current) return;
    const slug = searchParams.get("category");
    if (!slug) return;
    const cat = CATEGORIES.find((c) => c.slug === slug);
    if (!cat) return;
    consumedCategoryRef.current = true;
    setSeedPlan(categoryToPlan(cat));
    setSeededCategory({
      icon: cat.icon,
      name: cat.name,
      count: cat.prompts.length,
    });
    // Switch to bulk-book and drop ?category= from the URL so a refresh
    // doesn't re-trigger this seeding (which would clobber any edits).
    const params = new URLSearchParams(searchParams.toString());
    params.delete("category");
    params.set("tab", "bulk-book");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, router, pathname]);

  // The bulk-book studio's "switch to Sparky" hands the typed idea to the
  // dedicated Sparky AI page, pre-seeding the chat with mode + idea.
  const switchToChat = useCallback(
    (idea: string, mode: "qa" | "story") => {
      const params = new URLSearchParams();
      params.set("seedMode", mode);
      if (idea.trim()) params.set("seedIdea", idea.trim());
      router.push(`/sparky-ai?${params.toString()}`);
    },
    [router],
  );

  // Backward-compat: the chat used to live at ?tab=chat-book — send any old
  // link to its new home.
  useEffect(() => {
    if (searchParams.get("tab") === "chat-book") {
      router.replace("/sparky-ai");
    }
  }, [searchParams, router]);

  return (
    <div className="space-y-6">
      <div className="text-center mb-10 md:mb-14">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-linear-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/20 text-xs font-medium text-violet-300 mb-5 backdrop-blur">
          <Wand2 className="w-3 h-3" />
          Free-form · Iterative · Powered by AI
        </div>
        <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight text-white">
          Your own <span className="gradient-text">AI playground</span>
        </h1>
        <p className="mt-4 text-neutral-400 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
          Generate a single image and refine it with natural-language feedback,
          or build a complete book end-to-end. Want AI to plan it for you? Head
          to Sparky AI.
        </p>
      </div>

      <div className="flex justify-center">
          <div
            role="tablist"
            aria-label="Playground mode"
            className="flex w-full sm:inline-flex sm:w-auto p-1.5 rounded-2xl border border-white/10 bg-zinc-900/60 backdrop-blur shadow-lg shadow-black/40"
          >
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.slug;
              return (
                <button
                  key={t.slug}
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    if (
                      activeTab === "bulk-book" &&
                      t.slug !== "bulk-book" &&
                      bulkPlanningRef.current
                    ) {
                      void dialog.alert({
                        title: "Your book is being planned",
                        message:
                          "Sparky is still building your book plan. Please wait for it to finish before switching tabs — switching now would interrupt it.",
                        variant: "info",
                        okText: "Got it",
                      });
                      return;
                    }
                    setTab(t.slug);
                  }}
                  className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 sm:gap-2.5 px-2 sm:px-5 md:px-7 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-semibold whitespace-nowrap transition-colors ${active
                    ? "bg-linear-to-r from-violet-500 to-cyan-400 text-white shadow-lg shadow-violet-500/30"
                    : "text-neutral-300 hover:text-white"
                    }`}
                >
                  <Icon className="hidden sm:block w-5 h-5" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

      <ActiveTabDescription tab={TABS.find((t) => t.slug === activeTab)!} />

      {activeTab === "single-image" && <PlaygroundStudio />}

      {activeTab === "bulk-book" && (
        <>
          {seededCategory && (
            <div className="max-w-7xl mx-auto rounded-xl border border-violet-500/30 bg-linear-to-r from-violet-500/10 via-indigo-500/10 to-cyan-500/10 backdrop-blur px-5 py-4 flex items-center gap-3">
              <span className="text-2xl shrink-0" aria-hidden>
                {seededCategory.icon}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {seededCategory.name} · {seededCategory.count} prompts loaded
                </p>
                <p className="text-xs text-neutral-300 mt-0.5">
                  Click{" "}
                  <span className="font-semibold text-violet-200">
                    Start generating
                  </span>{" "}
                  below — or edit any page first. You can also rename the
                  book or swap the cover style.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSeedPlan(null);
                  setSeededCategory(null);
                }}
                className="text-xs text-neutral-400 hover:text-white px-2 py-1 rounded-md hover:bg-white/5 shrink-0"
                aria-label="Dismiss"
              >
                Dismiss
              </button>
            </div>
          )}
          <BookStudio
            key={seedPlan?.title ?? "blank"}
            initialPlan={seedPlan ?? undefined}
            onSwitchToChat={switchToChat}
            onPlanningChange={(planning) => {
              bulkPlanningRef.current = planning;
            }}
            onReset={() => {
              setSeedPlan(null);
              setSeededCategory(null);
            }}
          />
        </>
      )}
    </div>
  );
}

interface TabMeta {
  slug: string;
  label: string;
  description: string;
  bestFor: string;
  icon: typeof Wand2;
}

function ActiveTabDescription({ tab }: { tab: TabMeta }) {
  const Icon = tab.icon;
  return (
    <div className="max-w-7xl mx-auto rounded-2xl border border-white/10 bg-zinc-900/40 backdrop-blur px-5 py-4 flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg bg-linear-to-br from-violet-500/20 to-cyan-500/20 border border-violet-500/30 flex items-center justify-center text-violet-200 shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-neutral-200 leading-relaxed">
          {tab.description}
        </p>
        <p className="text-[11px] mt-1 uppercase tracking-wider font-mono text-violet-300">
          Best for: {tab.bestFor}
        </p>
      </div>
    </div>
  );
}
