"use client";

import { useState, useRef, useEffect } from "react";
import type { BookBrief, ActivityBookPlan } from "@/lib/book-chat";
import {
  PlaceholdersAndVanishInput,
  type PlaceholdersAndVanishInputHandle,
} from "@/components/ui/placeholders-and-vanish-input";
import { UserBubble } from "@/components/generate/chat-bubble";
import { ImagePreviewDialog } from "@/components/ui/image-preview-dialog";
import { MultiSelectChips } from "@/components/generate/multi-select-chips";
import { SparkyThinkingBubble } from "@/components/generate/sparky-thinking-bubble";
import { useDialog } from "@/components/ui/confirm-dialog";
import type { Mode, Bubble, View, ApiResponse } from "./types";
import {
  MAX_REFERENCE_BYTES,
  ACCEPTED_REFERENCE_TYPES,
  MODE_INTROS,
  TYPE_ANSWER_PLACEHOLDERS,
  BOOK_TYPE_INTRO,
  BOOK_TYPE_OPTIONS,
} from "./guided-chat-constants";
import { fileToDataUrl } from "./file-to-data-url";
import { FormattedAssistantText } from "./formatted-assistant-text";
import { BriefPreview } from "./brief-preview";
import { ActivityPlanPreview } from "./activity-plan-preview";
import { ChatHeader } from "./chat-header";
import { QuickStartChips } from "./quick-start-chips";
import { QuestionOptions } from "./question-options";
import { ReferenceAttachment } from "./reference-attachment";

export function GuidedChat({
  onBrief,
  onActivityPlan,
  seedMode,
  seedIdea,
  onSeedConsumed,
  onActiveChange,
  immersiveOnMobile = false,
}: {
  onBrief: (
    brief: BookBrief,
    mode: "qa" | "story",
    referenceDataUrl?: string | null,
  ) => void;
  onActivityPlan?: (plan: ActivityBookPlan) => void;
  onBack: () => void;
  seedMode?: Mode;
  seedIdea?: string;
  onSeedConsumed?: () => void;
  onActiveChange?: (active: boolean) => void;
  immersiveOnMobile?: boolean;
}) {
  const [reference, setReference] = useState<string | null>(null);
  const [referenceError, setReferenceError] = useState<string | null>(null);
  const [referencePreviewOpen, setReferencePreviewOpen] = useState(false);
  const dialog = useDialog();

  async function handleReferenceUpload(file: File) {
    setReferenceError(null);
    if (!ACCEPTED_REFERENCE_TYPES.includes(file.type)) {
      setReferenceError("PNG, JPG, or WebP only.");
      return;
    }
    if (file.size > MAX_REFERENCE_BYTES) {
      setReferenceError("Image too large (max 6 MB).");
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      setReference(dataUrl);
    } catch {
      setReferenceError("Could not read the image.");
    }
  }
  const [mode, setMode] = useState<Mode | null>(seedMode ?? null);
  // The chat is "active" from the first paint (no separate mode-picker screen),
  // so the playground hero hides and the chat claims the space immediately.
  useEffect(() => {
    onActiveChange?.(true);
  }, [onActiveChange]);
  const [messages, setMessages] = useState<unknown[]>([]);
  const [bubbles, setBubbles] = useState<Bubble[]>(
    seedMode ? [] : [{ role: "assistant", text: BOOK_TYPE_INTRO }],
  );
  const [view, setView] = useState<View | null>(null);
  const [pendingBrief, setPendingBrief] = useState<BookBrief | null>(null);
  const [pendingActivityPlan, setPendingActivityPlan] =
    useState<ActivityBookPlan | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputHandleRef = useRef<PlaceholdersAndVanishInputHandle | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const hasUserMessage = bubbles.some((b) => b.role === "user");
  // Go full-screen on mobile once the conversation starts or a type is chosen.
  const immersive = immersiveOnMobile && (hasUserMessage || !!mode);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [bubbles, view, busy, pendingBrief, pendingActivityPlan]);

  // Lock page scroll while the full-screen mobile chat is open.
  useEffect(() => {
    if (!immersive) return;
    const mq = window.matchMedia("(max-width: 639px)");
    const apply = () => {
      const lock = mq.matches;
      document.documentElement.style.overflow = lock ? "hidden" : "";
      document.body.style.overflow = lock ? "hidden" : "";
    };
    apply();
    mq.addEventListener("change", apply);
    return () => {
      mq.removeEventListener("change", apply);
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [immersive]);

  // Consume the seed once on mount when the shell handed us a mode + idea.
  const seedConsumedRef = useRef(false);
  useEffect(() => {
    if (seedConsumedRef.current) return;
    if (!seedMode) return;
    seedConsumedRef.current = true;
    queueMicrotask(() => {
      setMode(seedMode);
      setBubbles([{ role: "assistant", text: MODE_INTROS[seedMode].greeting }]);
      setMessages([]);
      setView(null);
      setPendingBrief(null);
      setError(null);
      if (seedIdea && seedIdea.trim().length > 0) {
        setTimeout(() => inputHandleRef.current?.setText(seedIdea.trim()), 0);
      }
      onSeedConsumed?.();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedMode, seedIdea]);

  function pickMode(m: Mode) {
    setMode(m);
    setBubbles([{ role: "assistant", text: MODE_INTROS[m].greeting }]);
    setMessages([]);
    setView(null);
    setPendingBrief(null);
    setPendingActivityPlan(null);
    setError(null);
  }

  function pickBookType(label: string) {
    const opt = BOOK_TYPE_OPTIONS.find((o) => o.label === label);
    if (opt) pickMode(opt.mode);
  }

  function resetToBookType() {
    setMode(null);
    setBubbles([{ role: "assistant", text: BOOK_TYPE_INTRO }]);
    setMessages([]);
    setView(null);
    setPendingBrief(null);
    setPendingActivityPlan(null);
    setError(null);
  }

  function stopInFlight() {
    abortRef.current?.abort();
    abortRef.current = null;
    setBusy(false);
  }

  function editLastUserMessage(text: string) {
    inputHandleRef.current?.setText(text);
  }

  async function clearChat() {
    if (busy) return;
    if (bubbles.length <= 1) return;
    const ok = await dialog.confirm({
      title: "Clear chat?",
      message: "This will start a fresh conversation with Sparky. Your in-progress answers will be lost.",
      confirmText: "Clear chat",
      cancelText: "Keep chatting",
      variant: "danger",
    });
    if (!ok) return;
    setBubbles([
      { role: "assistant", text: mode ? MODE_INTROS[mode].greeting : BOOK_TYPE_INTRO },
    ]);
    setMessages([]);
    setView(null);
    setPendingBrief(null);
    setError(null);
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    const activeMode = mode ?? "general";
    setError(null);
    setBubbles((b) => [...b, { role: "user", text: trimmed }]);
    setView(null);
    setBusy(true);
    abortRef.current = new AbortController();
    try {
      const res = await fetch("/api/book-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          messages,
          userMessage: trimmed,
          mode: activeMode,
        }),
      });
      const data = (await res.json()) as ApiResponse | { error: string };
      if (!res.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "Chat failed.");
      }
      const v = data.view;
      if (v.kind === "route") {
        setMode(v.mode);
        setMessages([]);
        setBubbles((b) => [
          ...b,
          { role: "assistant", text: MODE_INTROS[v.mode].greeting },
        ]);
        if (v.idea && v.idea.trim()) {
          const idea = v.idea.trim();
          setTimeout(() => inputHandleRef.current?.setText(idea), 0);
        }
        return;
      }
      setMessages(data.messages);
      if (v.kind === "question") {
        setBubbles((b) => {
          const next = [...b];
          if (v.intro) next.push({ role: "assistant", text: v.intro });
          next.push({ role: "assistant", text: v.question });
          return next;
        });
        setView(v);
      } else if (v.kind === "message") {
        setBubbles((b) => [
          ...b,
          { role: "assistant", text: v.text || "(no response)" },
        ]);
      } else if (v.kind === "activity-plan") {
        setBubbles((b) => [
          ...b,
          {
            role: "assistant",
            text: `Here's your ${v.plan.pages.length}-page activity plan. Take a look — open the studio to start, or tell me what to tweak.`,
          },
        ]);
        setPendingActivityPlan(v.plan);
      } else {
        setBubbles((b) => [
          ...b,
          {
            role: "assistant",
            text: `Here's your ${v.brief.prompts.length}-page plan. Take a look — confirm to save it, or tell me what to tweak.`,
          },
        ]);
        setPendingBrief(v.brief);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong.";
      // Interrupted requests shouldn't show the scary raw aborted message.
      const isInterrupted =
        (e instanceof Error && e.name === "AbortError") ||
        /aborted|signal/i.test(message);
      if (isInterrupted) {
        setBubbles((b) => [
          ...b,
          {
            role: "assistant",
            text: "Hmm, that got interrupted. Want to try again?",
          },
        ]);
      } else {
        setError(message);
      }
    } finally {
      setBusy(false);
    }
  }

  function confirmBrief() {
    if (!pendingBrief || !mode || mode === "activity") return;
    onBrief(pendingBrief, mode, reference);
  }

  function tweakBrief(feedback: string) {
    setPendingBrief(null);
    void send(`Please revise the plan: ${feedback}`);
  }

  function confirmActivity() {
    if (!pendingActivityPlan || !onActivityPlan) return;
    onActivityPlan(pendingActivityPlan);
  }

  function tweakActivity(feedback: string) {
    setPendingActivityPlan(null);
    void send(`Please revise the activity plan: ${feedback}`);
  }

  // Typing is always allowed; Sparky chats generally until a type is chosen.
  const inputDisabled = busy;
  // Activity is only offered where the host can hand a plan to the studio.
  const bookTypeOptions = onActivityPlan
    ? BOOK_TYPE_OPTIONS
    : BOOK_TYPE_OPTIONS.filter((o) => o.mode !== "activity");

  const rootClass = immersive
    ? "flex flex-col overflow-hidden bg-zinc-950 fixed left-0 right-0 bottom-0 top-16 z-[45] sm:static sm:top-auto sm:z-auto sm:overflow-visible sm:bg-transparent sm:max-h-[90vh] sm:min-h-[82vh]"
    : `flex flex-col max-h-[90vh] ${mode ? "min-h-[82vh]" : "min-h-[76vh]"}`;

  return (
    <div className={rootClass}>
      <ChatHeader
        mode={mode}
        busy={busy}
        showClear={bubbles.some((b) => b.role === "user")}
        onSwitchMode={resetToBookType}
        onClearChat={clearChat}
      />

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 md:px-8 py-2 space-y-3"
      >
        {bubbles.map((m, i) => {
          if (m.role === "user") {
            const isLastUser =
              i ===
              bubbles
                .map((b, idx) => ({ b, idx }))
                .filter((x) => x.b.role === "user")
                .at(-1)?.idx;
            return (
              <UserBubble
                key={i}
                text={m.text}
                onEdit={isLastUser && !busy ? editLastUserMessage : undefined}
              />
            );
          }
          return (
            <div key={i} className="flex justify-start">
              <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-bl-md text-sm leading-relaxed bg-white/5 border border-white/10 text-neutral-100">
                <FormattedAssistantText text={m.text} />
              </div>
            </div>
          );
        })}

        {!mode && !busy && !hasUserMessage && (
          <QuestionOptions
            options={bookTypeOptions.map((o) => o.label)}
            optionDescriptions={bookTypeOptions.map((o) => o.description)}
            onPick={pickBookType}
          />
        )}

        {bubbles.length === 1 && !busy && !view && !pendingBrief && mode && (
          <QuickStartChips
            quickStarts={MODE_INTROS[mode].quickStarts}
            onPick={send}
          />
        )}

        {busy && <SparkyThinkingBubble mode={mode} />}

        {view?.kind === "question" && view.options.length > 0 && !busy && (
          view.allow_multi ? (
            <MultiSelectChips
              options={view.options}
              optionDescriptions={view.option_descriptions}
              questionKey={view.question}
              onSubmit={(joined) => send(joined)}
            />
          ) : (
            <QuestionOptions
              options={view.options}
              optionDescriptions={view.option_descriptions}
              onPick={send}
            />
          )
        )}

        {pendingBrief && !busy && (
          <BriefPreview
            brief={pendingBrief}
            onConfirm={confirmBrief}
            onTweak={tweakBrief}
            onUpdate={(next) => setPendingBrief(next)}
          />
        )}

        {pendingActivityPlan && !busy && (
          <ActivityPlanPreview
            plan={pendingActivityPlan}
            onConfirm={confirmActivity}
            onTweak={tweakActivity}
          />
        )}

        {error && (
          <div className="text-sm text-red-300 bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
      </div>

      <div className="border-t border-white/10 p-3 md:p-4 space-y-2">
        {mode === "qa" && (
          <ReferenceAttachment
            reference={reference}
            referenceError={referenceError}
            onUpload={(file) => void handleReferenceUpload(file)}
            onPreview={() => setReferencePreviewOpen(true)}
            onRemove={() => {
              setReference(null);
              setReferenceError(null);
            }}
          />
        )}

        <PlaceholdersAndVanishInput
          ref={inputHandleRef}
          key={`${mode ?? "pick"}-${pendingBrief ? "preview" : "open"}`}
          placeholders={
            !mode
              ? [
                  "Ask Sparky anything…",
                  "Tell me your book idea…",
                  "Say hi, or describe what you want to make…",
                ]
              : pendingBrief || pendingActivityPlan
                ? ["Use the buttons above to confirm or tweak…"]
                : view?.kind === "question" && view.options?.length
                  ? ["Pick an option above or type your own answer…"]
                  : bubbles.length <= 1
                    ? MODE_INTROS[mode].placeholders
                    : TYPE_ANSWER_PLACEHOLDERS
          }
          disabled={inputDisabled || !!pendingBrief || !!pendingActivityPlan}
          loading={busy}
          onStop={stopInFlight}
          onSubmit={() => {
            const text = (inputHandleRef.current?.getValue() ?? "").trim();
            if (text) send(text);
          }}
        />
      </div>

      {reference && (
        <ImagePreviewDialog
          open={referencePreviewOpen}
          onClose={() => setReferencePreviewOpen(false)}
          src={reference}
          alt="Chat reference image"
          caption="Sparky will use this as visual style reference for your book"
        />
      )}
    </div>
  );
}
