"use client";

import { useEffect, useRef } from "react";

interface BubbleTextAreaProps {
  text: string;
  editable: boolean;
  onChange: (text: string) => void;
  fontFamily?: string;
  color?: string;
  fontSize?: number;
}

export function BubbleTextArea({
  text,
  editable,
  onChange,
  fontFamily,
  color,
  fontSize,
}: BubbleTextAreaProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (el && el.innerText !== text) {
      el.innerText = text;
    }
  }, [text]);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div
        ref={ref}
        role="textbox"
        tabIndex={editable ? 0 : -1}
        contentEditable={editable}
        suppressContentEditableWarning
        spellCheck={false}
        onInput={(e) => onChange(e.currentTarget.innerText)}
        onPointerDown={(e) => {
          if (editable) e.stopPropagation();
        }}
        onDoubleClick={(e) => e.stopPropagation()}
        className={`text-center font-bold leading-tight outline-none break-words w-[72%] cursor-text pointer-events-auto ${
          fontSize ? "" : "text-[clamp(11px,2.6cqw,22px)]"
        }`}
        style={{
          fontFamily: fontFamily
            ? `'${fontFamily}', 'Patrick Hand', 'Comic Sans MS', 'Marker Felt', 'Chalkboard SE', system-ui, sans-serif`
            : "'Patrick Hand', 'Comic Sans MS', 'Marker Felt', 'Chalkboard SE', system-ui, sans-serif",
          color: color ?? "#1A1A1A",
          containerType: "inline-size",
          fontSize: fontSize ? `${fontSize}px` : undefined,
        }}
      />
    </div>
  );
}
