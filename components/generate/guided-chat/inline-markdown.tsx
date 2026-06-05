import type { ReactNode } from "react";

// Renders the inline markdown Sparky actually emits: **bold**, *italic* / _italic_,
// and `code`. Anything else is passed through verbatim. Order matters — the
// double-asterisk bold alternative must precede the single-asterisk italic one.
const INLINE = /(\*\*([^*]+)\*\*|`([^`]+)`|\*([^*\s][^*]*?)\*|_([^_\s][^_]*?)_)/g;

export function renderInlineMarkdown(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  INLINE.lastIndex = 0;
  while ((m = INLINE.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[2] != null) {
      nodes.push(
        <strong key={key++} className="font-semibold text-white">
          {m[2]}
        </strong>,
      );
    } else if (m[3] != null) {
      nodes.push(
        <code
          key={key++}
          className="px-1 py-0.5 rounded bg-white/10 text-[0.85em] font-mono"
        >
          {m[3]}
        </code>,
      );
    } else {
      nodes.push(<em key={key++}>{m[4] ?? m[5]}</em>);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}
