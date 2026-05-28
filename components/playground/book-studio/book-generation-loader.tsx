"use client";

import { useEffect, useRef, useState } from "react";
import {
  STORY_LOADER_STEPS,
  COLORING_LOADER_STEPS,
} from "./book-loader-steps";
import type {
  BookGenerationLoaderProps,
  BookLoaderStep,
} from "./book-generation-loader-types";

const CIRCLE_HALF_REM = 3;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function BookGenerationLoader({
  mode,
  title,
  subtitle,
  estimatedSeconds = mode === "story" ? 140 : 90,
  currentStep,
  totalKnownSteps,
}: BookGenerationLoaderProps) {
  const steps: readonly BookLoaderStep[] =
    mode === "story" ? STORY_LOADER_STEPS : COLORING_LOADER_STEPS;

  const [autoStep, setAutoStep] = useState(0);
  const [pulse, setPulse] = useState(0);

  const externalProgress =
    typeof currentStep === "number" && typeof totalKnownSteps === "number" && totalKnownSteps > 0
      ? clamp(currentStep / totalKnownSteps, 0, 1)
      : null;

  useEffect(() => {
    if (externalProgress !== null) return;
    const ms = (estimatedSeconds * 1000) / steps.length;
    const id = setInterval(() => {
      setAutoStep((prev) => {
        if (prev >= steps.length - 1) {
          clearInterval(id);
          return prev;
        }
        return prev + 1;
      });
    }, ms);
    return () => clearInterval(id);
  }, [externalProgress, estimatedSeconds, steps.length]);

  const rootRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = rootRef.current;
    if (!el) return;
    const id = window.setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 200);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setPulse((p) => (p + 1) % 3), 750);
    return () => clearInterval(id);
  }, []);

  const activeStep =
    externalProgress !== null
      ? clamp(Math.floor(externalProgress * steps.length), 0, steps.length - 1)
      : autoStep;
  const pct = Math.round(
    externalProgress !== null
      ? externalProgress * 100
      : ((activeStep + 0.5) / steps.length) * 100,
  );

  const heading =
    title ?? (mode === "story" ? "Building your story" : "Building your book");
  const subheading =
    subtitle ??
    (mode === "story"
      ? "Crafting a narrative journey just for you"
      : "Drafting clean coloring-page prompts");

  return (
    <div
      ref={rootRef}
      className="w-full max-w-4xl mx-auto px-4 sm:px-8 py-8"
    >
      <div className="text-center mb-8 sm:mb-10">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          {heading}
        </h2>
        <p className="text-sm text-neutral-400">{subheading}</p>
      </div>

      <div className="hidden sm:block relative mb-10">
        <div
          className="absolute top-12 h-1.5 bg-white/10 rounded-full overflow-hidden"
          style={{
            left: `${CIRCLE_HALF_REM}rem`,
            right: `${CIRCLE_HALF_REM}rem`,
          }}
        >
          <div
            className="h-full bg-linear-to-r from-cyan-500 via-purple-500 to-yellow-500 rounded-full transition-all duration-700 ease-out"
            style={{
              width:
                steps.length > 1
                  ? `${(activeStep / (steps.length - 1)) * 100}%`
                  : "100%",
            }}
          />
        </div>

        <div className="relative flex justify-between gap-4">
          {steps.map((step, i) => {
            const isActive = activeStep === i;
            const isDone = i < activeStep;
            const Icon = step.Icon;
            return (
              <div
                key={step.id}
                className="flex flex-col items-center flex-1 min-w-0"
              >
                <div
                  className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 z-10 ${
                    isDone || isActive
                      ? `bg-linear-to-br ${step.gradient} shadow-lg`
                      : "bg-zinc-800 border-2 border-zinc-700"
                  } ${isActive ? "scale-110 ring-4 ring-white/20" : ""}`}
                >
                  <Icon
                    className={`w-9 h-9 transition-all duration-300 ${
                      isDone || isActive ? "text-white" : "text-zinc-500"
                    } ${isActive ? "animate-pulse" : ""}`}
                  />
                  {isActive && (
                    <>
                      <span className="absolute inset-0 rounded-full bg-white/15 animate-ping" />
                      <span className="absolute -inset-2 rounded-full border-2 border-white/15 animate-pulse" />
                    </>
                  )}
                </div>
                <div className="mt-3 text-center">
                  <p
                    className={`text-xs font-semibold transition-colors duration-300 ${
                      isDone || isActive ? "text-white" : "text-zinc-500"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p
                    className={`text-[11px] transition-colors duration-300 ${
                      isActive ? "text-neutral-300" : "text-zinc-600"
                    }`}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="sm:hidden space-y-2 mb-6">
        {steps.map((step, i) => {
          const isActive = activeStep === i;
          const isDone = i < activeStep;
          const Icon = step.Icon;
          return (
            <div
              key={step.id}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                isActive
                  ? "bg-zinc-800/80 border border-violet-500/30"
                  : "bg-transparent"
              }`}
            >
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${
                  isDone || isActive
                    ? `bg-linear-to-br ${step.gradient}`
                    : "bg-zinc-800 border border-zinc-700"
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    isDone || isActive ? "text-white" : "text-zinc-600"
                  }`}
                />
              </div>
              <div className="min-w-0">
                <p
                  className={`text-sm font-semibold ${
                    isDone || isActive ? "text-white" : "text-zinc-500"
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-[11px] text-zinc-500">{step.description}</p>
              </div>
              {isActive && (
                <span className="ml-auto w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-zinc-900/60 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-neutral-500 mb-1">
              Currently working on
            </p>
            <p className="text-base sm:text-lg font-bold text-white flex items-center gap-2 truncate">
              {steps[activeStep].label}
              <span className="inline-flex gap-0.5 shrink-0">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full bg-violet-400 transition-opacity duration-200 ${
                      pulse === i ? "opacity-100" : "opacity-30"
                    }`}
                  />
                ))}
              </span>
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
              {pct}%
            </p>
            <p className="text-[11px] text-neutral-500">
              step {activeStep + 1} of {steps.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
