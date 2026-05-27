"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { bubbleVisualPaths } from "@/lib/bubble-shapes";
import { BubbleItem } from "./bubble-item";
import { BubbleTailHandle } from "./bubble-tail-handle";
import { BubbleToolbar } from "./bubble-toolbar";
import { useBubbleDrag } from "./use-bubble-drag";
import type { StoryBubble } from "../types";
import {
  DEFAULT_BUBBLE_HEIGHT,
  type BubbleEditorProps,
} from "./bubble-editor-types";

function makeId(): string {
  return `b_${Math.random().toString(36).slice(2, 9)}`;
}

function defaultBubble(): StoryBubble {
  return {
    id: makeId(),
    text: "New bubble",
    x: 0.5,
    y: 0.2,
    width: 0.4,
    height: DEFAULT_BUBBLE_HEIGHT,
    tailTipX: 0.5,
    tailTipY: 0.55,
    shape: "speech",
  };
}

interface EditorSize {
  width: number;
  height: number;
}

export function BubbleEditor({
  bubbles,
  onChange,
  aspectRatio = "2/3",
  imageSrc,
  className,
  showAddButton = true,
}: BubbleEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<EditorSize>({ width: 0, height: 0 });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { beginDrag } = useBubbleDrag({ containerRef, bubbles, onChange });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const updateText = useCallback(
    (id: string, text: string) => {
      onChange(bubbles.map((b) => (b.id === id ? { ...b, text } : b)));
    },
    [bubbles, onChange],
  );

  const deleteBubble = useCallback(
    (id: string) => {
      onChange(bubbles.filter((b) => b.id !== id));
      setSelectedId((curr) => (curr === id ? null : curr));
    },
    [bubbles, onChange],
  );

  const addBubble = useCallback(() => {
    const next = defaultBubble();
    onChange([...bubbles, next]);
    setSelectedId(next.id);
  }, [bubbles, onChange]);

  const changeShape = useCallback(
    (id: string, shape: StoryBubble["shape"]) => {
      onChange(bubbles.map((b) => (b.id === id ? { ...b, shape } : b)));
    },
    [bubbles, onChange],
  );

  const changeFont = useCallback(
    (id: string, fontFamily: StoryBubble["fontFamily"]) => {
      onChange(bubbles.map((b) => (b.id === id ? { ...b, fontFamily } : b)));
    },
    [bubbles, onChange],
  );

  const changeFill = useCallback(
    (id: string, fillColor: string) => {
      onChange(bubbles.map((b) => (b.id === id ? { ...b, fillColor } : b)));
    },
    [bubbles, onChange],
  );

  const changeText = useCallback(
    (id: string, textColor: string) => {
      onChange(bubbles.map((b) => (b.id === id ? { ...b, textColor } : b)));
    },
    [bubbles, onChange],
  );

  const changeStroke = useCallback(
    (id: string, strokeColor: string) => {
      onChange(bubbles.map((b) => (b.id === id ? { ...b, strokeColor } : b)));
    },
    [bubbles, onChange],
  );

  const changeFontSize = useCallback(
    (id: string, fontSize: number) => {
      onChange(bubbles.map((b) => (b.id === id ? { ...b, fontSize } : b)));
    },
    [bubbles, onChange],
  );

  const handleBackgroundPointerDown = useCallback(() => {
    setSelectedId(null);
  }, []);

  const selected = bubbles.find((b) => b.id === selectedId) ?? null;

  return (
    <div
      ref={containerRef}
      onPointerDown={handleBackgroundPointerDown}
      style={{ aspectRatio }}
      className={
        className ??
        "relative w-full max-w-[480px] bg-zinc-100 rounded-2xl overflow-hidden border border-white/10 shadow-xl"
      }
    >
      {imageSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSrc}
          alt="Page preview"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
      ) : (
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#fef3c7_0%,#fce7f3_50%,#dbeafe_100%)] pointer-events-none" />
      )}

      <svg
        width={size.width}
        height={size.height}
        className="absolute inset-0 pointer-events-none"
      >
        {bubbles.map((b) => {
          const shape = b.shape ?? "speech";
          const cx = b.x * size.width;
          const cy = b.y * size.height;
          const rx = (b.width * size.width) / 2;
          const ry = ((b.height ?? DEFAULT_BUBBLE_HEIGHT) * size.height) / 2;
          const v = bubbleVisualPaths(shape, {
            cx,
            cy,
            rx,
            ry,
            tailTipX: b.tailTipX * size.width,
            tailTipY: b.tailTipY * size.height,
          });
          const fill = b.fillColor ?? "#FFFFFF";
          const stroke = b.strokeColor ?? "#1A1A1A";
          return (
            <g key={b.id}>
              <path
                d={v.bodyPath}
                fill={fill}
                stroke={stroke}
                strokeWidth={2.6}
                strokeLinejoin="round"
              />
              {v.tailFillPath && (
                <path d={v.tailFillPath} fill={fill} stroke="none" />
              )}
              {v.tailStrokePath && (
                <path
                  d={v.tailStrokePath}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={2.6}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              )}
              {v.tailDots.map((d, i) => (
                <circle
                  key={i}
                  cx={d.cx}
                  cy={d.cy}
                  r={d.r}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={2.2}
                />
              ))}
            </g>
          );
        })}
      </svg>

      <div className="absolute inset-0 pointer-events-none">
        {bubbles.map((b) => (
          <BubbleItem
            key={b.id}
            bubble={b}
            selected={b.id === selectedId}
            onSelect={setSelectedId}
            onTextChange={updateText}
            onBeginDrag={beginDrag}
          />
        ))}
        {selected && (
          <>
            <BubbleTailHandle bubble={selected} onBegin={beginDrag} />
            <BubbleToolbar
              bubble={selected}
              onDelete={deleteBubble}
              onChangeShape={changeShape}
              onChangeFont={changeFont}
              onChangeFill={changeFill}
              onChangeText={changeText}
              onChangeStroke={changeStroke}
              onChangeFontSize={changeFontSize}
            />
          </>
        )}
      </div>

      {showAddButton && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            addBubble();
          }}
          aria-label="Add bubble"
          className="absolute top-2 right-2 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-violet-500 hover:bg-violet-600 text-white text-xs font-semibold shadow-md pointer-events-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          Bubble
        </button>
      )}
    </div>
  );
}
