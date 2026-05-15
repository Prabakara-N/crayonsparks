"use client";

import { useState, useRef, useEffect } from "react";
import type { BookBrief } from "@/lib/book-chat";
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
} from "./guided-chat-constants";
import { fileToDataUrl } from "./file-to-data-url";
import { FormattedAssistantText } from "./formatted-assistant-text";
import { BriefPreview } from "./brief-preview";
import { ModePicker } from "./mode-picker";
import { ChatHeader } from "./chat-header";
import { QuickStartChips } from "./quick-start-chips";
import { QuestionOptions } from "./question-options";
import { ReferenceAttachment } from "./reference-attachment";

export function GuidedChat({
  onBrief,
  seedMode,
  seedIdea,
  onSeedConsumed,
  onActiveChange,
}: {
  onBrief: (
    brief: BookBrief,
    mode: Mode,
    referenceDataUrl?: string | null,
  ) => void;
  onBack: () => void;
  seedMode?: Mode;
  seedIdea?: string;
  onSeedConsumed?: () => void;
  onActiveChange?: (active: boolean) => void;
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
  const [mode, setMode] = useState<Mode | null>(null);
  useEffect(() => {
    onActiveChange?.(mode !== null);
  }, [mode, onActiveChange]);
  const [messages, setMessages] = useState<unknown[]>([]);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [view, setView] = useState<View | null>(null);
  const [pendingBrief, setPendingBrief] = useState<BookBrief | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputHandleRef = useRef<PlaceholdersAndVanishInputHandle | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [bubbles, view, busy, pendingBrief]);

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
    if (!mode || busy) return;
    if (bubbles.length <= 1) return;
    const ok = await dialog.confirm({
      title: "Clear chat?",
      message: "This will start a fresh conversation with Sparky. Your in-progress answers will be lost.",
      confirmText: "Clear chat",
      cancelText: "Keep chatting",
      variant: "danger",
    });
    if (!ok) return;
    setBubbles([{ role: "assistant", text: MODE_INTROS[mode].greeting }]);
    setMessages([]);
    setView(null);
    setPendingBrief(null);
    setError(null);
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy || !mode) return;
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
          mode,
        }),
      });
      const data = (await res.json()) as ApiResponse | { error: string };
      if (!res.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "Chat failed.");
      }
      setMessages(data.messages);
      const v = data.view;
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
    if (!pendingBrief || !mode) return;
    onBrief(pendingBrief, mode, reference);
  }

  function tweakBrief(feedback: string) {
    setPendingBrief(null);
    void send(`Please revise the plan: ${feedback}`);
  }

  if (!mode) {
    return <ModePicker onPick={pickMode} />;
  }

  // Free-form typing is always allowed when not busy — chips are a convenience.
  const inputDisabled = busy;

  return (
    <div className="flex flex-col min-h-[72vh] max-h-[88vh]">
      <ChatHeader
        mode={mode}
        busy={busy}
        showClear={bubbles.some((b) => b.role === "user")}
        onSwitchMode={() => {
          setMode(null);
          setBubbles([]);
          setMessages([]);
          setView(null);
          setError(null);
        }}
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

        {bubbles.length === 1 && !busy && !view && !pendingBrief && mode && (
          <QuickStartChips
            quickStarts={MODE_INTROS[mode].quickStarts}
            onPick={send}
          />
        )}

        {busy && <SparkyThinkingBubble />}

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

        {error && (
          <div className="text-sm text-red-300 bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
      </div>

      <div className="border-t border-white/10 p-3 md:p-4 space-y-2">
        {mode !== "story" && (
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
          key={`${mode}-${pendingBrief ? "preview" : "open"}`}
          placeholders={
            pendingBrief
              ? ["Use the buttons above to confirm or tweak…"]
              : view?.kind === "question" && view.options?.length
                ? ["Pick an option above or type your own answer…"]
                : bubbles.length <= 1
                  ? MODE_INTROS[mode].placeholders
                  : TYPE_ANSWER_PLACEHOLDERS
          }
          disabled={inputDisabled || !!pendingBrief}
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
