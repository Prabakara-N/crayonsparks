"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Move } from "lucide-react";
import {
  fontByKey,
  gridBlockSize,
  type BackCoverDesign,
  type GridAspect,
  type SelectableImage,
} from "../back-cover-grid-types";

interface DesignOverlayProps {
  design: BackCoverDesign;
  images: SelectableImage[];
  aspect: GridAspect;
  onChange: (design: BackCoverDesign) => void;
}

type DragMode = "grid-move" | "grid-resize" | "tagline";

interface DragState {
  mode: DragMode;
  startX: number;
  startY: number;
  start: BackCoverDesign;
}

const SNAP = 0.012;

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function DesignOverlay({
  design,
  images,
  aspect,
  onChange,
}: DesignOverlayProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [dragging, setDragging] = useState<DragMode | null>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      setWidth(el.clientWidth);
      setHeight(el.clientHeight);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const block = gridBlockSize(design.grid, design.gridSize, width);
  const blockHFrac = height > 0 ? block.h / height : 0;

  const begin = useCallback(
    (mode: DragMode) => (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      dragRef.current = {
        mode,
        startX: e.clientX,
        startY: e.clientY,
        start: design,
      };
      setDragging(mode);
    },
    [design],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const st = dragRef.current;
      const el = rootRef.current;
      if (!st || !el) return;
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const dx = (e.clientX - st.startX) / rect.width;
      const dy = (e.clientY - st.startY) / rect.height;
      const hFrac = rect.height > 0 ? block.h / rect.height : 0;
      if (st.mode === "grid-move") {
        let x = clamp(st.start.grid.x + dx, 0, 1 - st.start.grid.w);
        let y = clamp(st.start.grid.y + dy, 0, 0.98);
        if (Math.abs(x + st.start.grid.w / 2 - 0.5) < SNAP)
          x = 0.5 - st.start.grid.w / 2;
        if (Math.abs(y + hFrac / 2 - 0.5) < SNAP) y = 0.5 - hFrac / 2;
        onChange({ ...st.start, grid: { ...st.start.grid, x, y } });
      } else if (st.mode === "grid-resize") {
        onChange({
          ...st.start,
          grid: {
            ...st.start.grid,
            w: clamp(
              st.start.grid.w + dx,
              0.3,
              Math.min(0.98, 1 - st.start.grid.x),
            ),
          },
        });
      } else {
        let x = clamp(st.start.tagline.x + dx, 0.05, 0.95);
        let y = clamp(st.start.tagline.y + dy, 0.02, 0.98);
        if (Math.abs(x - 0.5) < SNAP) x = 0.5;
        if (Math.abs(y - 0.5) < SNAP) y = 0.5;
        onChange({ ...st.start, tagline: { ...st.start.tagline, x, y } });
      }
    },
    [onChange, block.h],
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    dragRef.current = null;
    setDragging(null);
  }, []);

  const activeCenterX =
    dragging === "tagline"
      ? design.tagline.x
      : dragging === "grid-move"
        ? design.grid.x + design.grid.w / 2
        : null;
  const activeCenterY =
    dragging === "tagline"
      ? design.tagline.y
      : dragging === "grid-move"
        ? design.grid.y + blockHFrac / 2
        : null;
  const showVGuide = activeCenterX !== null && Math.abs(activeCenterX - 0.5) < 0.004;
  const showHGuide = activeCenterY !== null && Math.abs(activeCenterY - 0.5) < 0.004;

  const font = fontByKey(design.tagline.fontKey);

  return (
    <div
      ref={rootRef}
      className="relative w-full overflow-hidden touch-none"
      style={{ aspectRatio: aspect, backgroundColor: design.bgColor }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {design.topStripe.show && (
        <div
          className="absolute left-0 top-0 w-full"
          style={{
            height: `${design.topStripe.height * 100}%`,
            backgroundColor: design.topStripe.color,
          }}
        />
      )}

      {showVGuide && (
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-fuchsia-400 pointer-events-none z-20" />
      )}
      {showHGuide && (
        <div className="absolute left-0 right-0 top-1/2 h-px bg-fuchsia-400 pointer-events-none z-20" />
      )}

      {design.tagline.show && design.tagline.text.trim() && width > 0 && (
        <div
          onPointerDown={begin("tagline")}
          className="absolute -translate-x-1/2 -translate-y-1/2 cursor-move text-center leading-tight select-none"
          style={{
            left: design.tagline.x * width,
            top: design.tagline.y * height,
            width: design.tagline.width * width,
            fontFamily: font.cssStack,
            fontStyle: font.italic ? "italic" : "normal",
            fontWeight: font.weight,
            fontSize: width * 0.042 * design.tagline.fontScale,
            color: design.tagline.color,
          }}
        >
          {design.tagline.text}
        </div>
      )}

      {width > 0 && images.length >= block.cols * block.rows && (
        <div
          className="absolute"
          style={{
            left: design.grid.x * width,
            top: design.grid.y * height,
            width: block.w,
            height: block.h,
          }}
        >
          <div
            className="grid h-full w-full cursor-move"
            style={{
              gridTemplateColumns: `repeat(${block.cols}, 1fr)`,
              gridAutoRows: `${block.cellH}px`,
              gap: `${block.gap}px`,
            }}
            onPointerDown={begin("grid-move")}
          >
            {images.slice(0, block.cols * block.rows).map((img) => (
              <div
                key={img.id}
                className="overflow-hidden rounded-sm bg-white ring-2 ring-white shadow"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.dataUrl}
                  alt={img.name}
                  draggable={false}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
          <div
            onPointerDown={begin("grid-resize")}
            className="absolute -bottom-2.5 -right-2.5 w-6 h-6 rounded-full bg-violet-500 border-2 border-white cursor-nwse-resize shadow-lg"
            title="Drag to resize"
          />
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-violet-500 text-white text-[10px] font-semibold flex items-center gap-1 pointer-events-none whitespace-nowrap">
            <Move className="w-3 h-3" /> drag
          </div>
        </div>
      )}
    </div>
  );
}
