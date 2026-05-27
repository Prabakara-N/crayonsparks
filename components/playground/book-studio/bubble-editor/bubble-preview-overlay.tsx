"use client";

import { useEffect, useRef, useState } from "react";
import { bubbleVisualPaths } from "@/lib/bubble-shapes";
import { DEFAULT_FONT_BY_SHAPE } from "@/lib/story-bubble-seed";
import type { StoryBubble } from "../types";

const DEFAULT_HEIGHT_FALLBACK = 0.14;

interface BubblePreviewOverlayProps {
  bubbles: StoryBubble[];
}

interface Size {
  width: number;
  height: number;
}

export function BubblePreviewOverlay({ bubbles }: BubblePreviewOverlayProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
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

  if (bubbles.length === 0) return null;

  return (
    <div
      ref={ref}
      className="absolute inset-0 pointer-events-none"
      aria-hidden
    >
      <svg width={size.width} height={size.height} className="absolute inset-0">
        {bubbles.map((b) => {
          const shape = b.shape ?? "speech";
          const cx = b.x * size.width;
          const cy = b.y * size.height;
          const rx = (b.width * size.width) / 2;
          const ry = ((b.height ?? DEFAULT_HEIGHT_FALLBACK) * size.height) / 2;
          const v = bubbleVisualPaths(shape, {
            cx,
            cy,
            rx,
            ry,
            tailTipX: b.tailTipX * size.width,
            tailTipY: b.tailTipY * size.height,
          });
          const font = b.fontFamily ?? DEFAULT_FONT_BY_SHAPE[shape];
          const fill = b.fillColor ?? "#FFFFFF";
          const stroke = b.strokeColor ?? "#1A1A1A";
          const textColor = b.textColor ?? "#1A1A1A";
          return (
            <g key={b.id}>
              <path
                d={v.bodyPath}
                fill={fill}
                stroke={stroke}
                strokeWidth={1.8}
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
                  strokeWidth={1.8}
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
                  strokeWidth={1.4}
                />
              ))}
              <text
                x={cx}
                y={cy}
                fontFamily={`'${font}', 'Patrick Hand', 'Comic Sans MS', system-ui, sans-serif`}
                fontSize={Math.max(8, rx * 0.22)}
                fontWeight={600}
                fill={textColor}
                textAnchor="middle"
                dominantBaseline="central"
              >
                {b.text.length > 24 ? `${b.text.slice(0, 22)}…` : b.text}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
