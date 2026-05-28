"use client";

import { useState } from "react";
import {
  AlignLeft,
  Cloud,
  MessageCircle,
  MessageSquare,
  Minus,
  Palette,
  Plus,
  Sparkles,
  Square,
  Trash2,
  Type,
} from "lucide-react";
import {
  BUBBLE_FILL_COLORS,
  BUBBLE_FONTS,
  BUBBLE_STROKE_COLORS,
  BUBBLE_TEXT_COLORS,
  DEFAULT_FILL_COLOR,
  DEFAULT_FONT_BY_SHAPE,
  DEFAULT_FONT_SIZE,
  DEFAULT_STROKE_COLOR,
  DEFAULT_TEXT_COLOR,
  MAX_FONT_SIZE,
  MIN_FONT_SIZE,
  type BubbleFont,
  type BubbleShape,
} from "@/lib/story-bubble-seed";
import type { StoryBubble } from "../types";

interface BubbleToolbarProps {
  bubble: StoryBubble;
  onDelete: (id: string) => void;
  onChangeShape: (id: string, shape: BubbleShape) => void;
  onChangeFont: (id: string, font: BubbleFont) => void;
  onChangeFill: (id: string, color: string) => void;
  onChangeText: (id: string, color: string) => void;
  onChangeStroke: (id: string, color: string) => void;
  onChangeFontSize: (id: string, size: number) => void;
  onApplyToAll?: (id: string) => void;
  applyToAllLabel?: string;
}

interface ShapeOption {
  shape: BubbleShape;
  label: string;
  Icon: typeof MessageSquare;
}

const SHAPES: ShapeOption[] = [
  { shape: "speech", label: "Speech (oval)", Icon: MessageCircle },
  { shape: "comic", label: "Comic (rounded rect)", Icon: MessageSquare },
  { shape: "thought", label: "Thought", Icon: Cloud },
  { shape: "narration", label: "Narration", Icon: AlignLeft },
];

type OpenMenu = "font" | "size" | "fill" | "text" | "stroke" | null;

export function BubbleToolbar({
  bubble,
  onDelete,
  onChangeShape,
  onChangeFont,
  onChangeFill,
  onChangeText,
  onChangeStroke,
  onChangeFontSize,
  onApplyToAll,
  applyToAllLabel = "Apply to all",
}: BubbleToolbarProps) {
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const currentShape = bubble.shape ?? "speech";
  const currentFont =
    (bubble.fontFamily as BubbleFont | undefined) ??
    DEFAULT_FONT_BY_SHAPE[currentShape];
  const currentFill = bubble.fillColor ?? DEFAULT_FILL_COLOR;
  const currentText = bubble.textColor ?? DEFAULT_TEXT_COLOR;
  const currentStroke = bubble.strokeColor ?? DEFAULT_STROKE_COLOR;
  const currentSize = bubble.fontSize ?? DEFAULT_FONT_SIZE;

  const bumpSize = (delta: number) => {
    const next = Math.max(
      MIN_FONT_SIZE,
      Math.min(MAX_FONT_SIZE, currentSize + delta),
    );
    onChangeFontSize(bubble.id, next);
  };

  const toggle = (m: OpenMenu) =>
    setOpenMenu((curr) => (curr === m ? null : m));

  const halfHeightPct = (bubble.height ?? 0.14) * 50;
  const placeBelow = bubble.y < 0.3;
  const verticalShift = placeBelow
    ? `calc(50% + ${halfHeightPct}% + 1rem)`
    : `calc(-50% - ${halfHeightPct}% - 5rem)`;
  const horizontalShift =
    bubble.x < 0.2
      ? "-10%"
      : bubble.x > 0.8
        ? "-90%"
        : "-50%";

  return (
    <div
      style={{
        left: `${bubble.x * 100}%`,
        top: `${bubble.y * 100}%`,
        transform: `translate(${horizontalShift}, ${verticalShift})`,
      }}
      className="absolute pointer-events-auto z-30"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="flex flex-col gap-1 bg-zinc-900/95 backdrop-blur-sm border border-white/10 rounded-lg p-1 shadow-xl">
        <div className="flex items-center justify-center gap-1">
          {SHAPES.map(({ shape, label, Icon }) => {
            const active = currentShape === shape;
            return (
              <button
                key={shape}
                type="button"
                onClick={() => onChangeShape(bubble.id, shape)}
                aria-label={`${label} shape`}
                title={label}
                className={`p-1.5 rounded-md transition-colors ${
                  active
                    ? "bg-violet-500 text-white"
                    : "text-neutral-300 hover:bg-white/10"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            );
          })}

          <div className="w-px h-5 bg-white/10 mx-0.5" />

        <div className="relative">
          <button
            type="button"
            onClick={() => toggle("font")}
            aria-label="Choose font"
            title={`Font: ${currentFont}`}
            className="p-1.5 rounded-md text-neutral-300 hover:bg-white/10"
          >
            <Type className="w-3.5 h-3.5" />
          </button>
          {openMenu === "font" && (
            <div className="absolute top-full mt-1 right-0 bg-zinc-900 border border-white/10 rounded-md shadow-2xl min-w-[180px] py-1 z-40">
              {BUBBLE_FONTS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => {
                    onChangeFont(bubble.id, f);
                    setOpenMenu(null);
                  }}
                  style={{ fontFamily: `'${f}', system-ui, sans-serif` }}
                  className={`block w-full text-left px-3 py-1.5 text-sm hover:bg-white/10 ${
                    currentFont === f ? "text-violet-300" : "text-neutral-200"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center bg-white/5 rounded-md">
          <button
            type="button"
            onClick={() => bumpSize(-2)}
            disabled={currentSize <= MIN_FONT_SIZE}
            aria-label="Decrease font size"
            title="Smaller text"
            className="p-1 rounded-md text-neutral-300 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span
            title="Font size"
            className="text-[11px] text-neutral-300 font-semibold tabular-nums px-1 min-w-[18px] text-center"
          >
            {currentSize}
          </span>
          <button
            type="button"
            onClick={() => bumpSize(2)}
            disabled={currentSize >= MAX_FONT_SIZE}
            aria-label="Increase font size"
            title="Larger text"
            className="p-1 rounded-md text-neutral-300 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
        </div>

        <div className="flex items-center justify-center gap-1">
        <div className="relative">
          <button
            type="button"
            onClick={() => toggle("fill")}
            aria-label="Bubble color"
            title="Bubble color"
            className="p-1.5 rounded-md text-neutral-300 hover:bg-white/10 flex items-center gap-1"
          >
            <Palette className="w-3.5 h-3.5" />
            <span
              className="w-2.5 h-2.5 rounded-full border border-white/30"
              style={{ background: currentFill }}
            />
          </button>
          {openMenu === "fill" && (
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-zinc-900 border border-white/10 rounded-lg shadow-2xl p-3 z-40 w-[260px]">
              <p className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold mb-2">
                Bubble fill
              </p>
              <div className="grid grid-cols-4 gap-2">
                {BUBBLE_FILL_COLORS.map((c) => {
                  const active = currentFill === c.value;
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => {
                        onChangeFill(bubble.id, c.value);
                        setOpenMenu(null);
                      }}
                      title={c.name}
                      className="flex flex-col items-center gap-1"
                    >
                      <span
                        style={{ background: c.value }}
                        className={`w-10 h-10 rounded-md border-2 transition-colors ${
                          active
                            ? "border-violet-400 ring-2 ring-violet-400/30"
                            : "border-white/20 hover:border-white/40"
                        }`}
                      />
                      <span className="text-[9px] text-neutral-400 leading-none">
                        {c.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => toggle("stroke")}
            aria-label="Border color"
            title="Border color"
            className="p-1.5 rounded-md text-neutral-300 hover:bg-white/10 flex items-center gap-1"
          >
            <Square className="w-3.5 h-3.5" />
            <span
              className="w-2.5 h-2.5 rounded-full border border-white/30"
              style={{ background: currentStroke }}
            />
          </button>
          {openMenu === "stroke" && (
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-zinc-900 border border-white/10 rounded-lg shadow-2xl p-3 z-40 w-[260px]">
              <p className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold mb-2">
                Border color
              </p>
              <div className="grid grid-cols-4 gap-2">
                {BUBBLE_STROKE_COLORS.map((c) => {
                  const active = currentStroke === c.value;
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => {
                        onChangeStroke(bubble.id, c.value);
                        setOpenMenu(null);
                      }}
                      title={c.name}
                      className="flex flex-col items-center gap-1"
                    >
                      <span
                        style={{ background: c.value }}
                        className={`w-10 h-10 rounded-md border-2 transition-colors ${
                          active
                            ? "border-violet-400 ring-2 ring-violet-400/30"
                            : "border-white/20 hover:border-white/40"
                        }`}
                      />
                      <span className="text-[9px] text-neutral-400 leading-none">
                        {c.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => toggle("text")}
            aria-label="Text color"
            title="Text color"
            className="p-1.5 rounded-md text-neutral-300 hover:bg-white/10 flex items-center gap-1"
          >
            <span className="text-[11px] font-bold leading-none">A</span>
            <span
              className="w-2.5 h-2.5 rounded-full border border-white/30"
              style={{ background: currentText }}
            />
          </button>
          {openMenu === "text" && (
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-zinc-900 border border-white/10 rounded-lg shadow-2xl p-3 z-40 w-[260px]">
              <p className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold mb-2">
                Text color
              </p>
              <div className="grid grid-cols-4 gap-2">
                {BUBBLE_TEXT_COLORS.map((c) => {
                  const active = currentText === c.value;
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => {
                        onChangeText(bubble.id, c.value);
                        setOpenMenu(null);
                      }}
                      title={c.name}
                      className="flex flex-col items-center gap-1"
                    >
                      <span
                        style={{ background: c.value }}
                        className={`w-10 h-10 rounded-md border-2 transition-colors ${
                          active
                            ? "border-violet-400 ring-2 ring-violet-400/30"
                            : "border-white/20 hover:border-white/40"
                        }`}
                      />
                      <span className="text-[9px] text-neutral-400 leading-none">
                        {c.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-white/10 mx-0.5" />

        {onApplyToAll && (
          <button
            type="button"
            onClick={() => onApplyToAll(bubble.id)}
            aria-label={applyToAllLabel}
            title={applyToAllLabel}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-violet-500/15 text-violet-200 hover:bg-violet-500/30 hover:text-white text-[11px] font-semibold whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {applyToAllLabel}
          </button>
        )}

        <button
          type="button"
          onClick={() => onDelete(bubble.id)}
          aria-label="Delete bubble"
          title="Delete"
          className="p-1.5 rounded-md text-red-300 hover:bg-red-500/20"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        </div>
      </div>
    </div>
  );
}
