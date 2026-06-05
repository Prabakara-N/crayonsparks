import { renderInlineMarkdown } from "./inline-markdown";

// Render a Sparky reply with paragraph spacing, headings, real bulleted lists,
// and inline markdown (**bold**, *italic*, `code`).
export function FormattedAssistantText({ text }: { text: string }) {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const lines = trimmed.split(/\r?\n/);
  type Block =
    | { kind: "para"; text: string }
    | { kind: "heading"; text: string }
    | { kind: "list"; items: string[] };
  const blocks: Block[] = [];
  let buffer: string[] = [];
  const flushPara = () => {
    if (buffer.length === 0) return;
    blocks.push({ kind: "para", text: buffer.join(" ").trim() });
    buffer = [];
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushPara();
      continue;
    }
    const headingMatch = line.match(/^#{1,6}\s+(.+)$/);
    if (headingMatch) {
      flushPara();
      blocks.push({ kind: "heading", text: headingMatch[1] });
      continue;
    }
    const bulletMatch = line.match(/^[-•*]\s+(.+)$/);
    if (bulletMatch) {
      flushPara();
      const last = blocks[blocks.length - 1];
      if (last && last.kind === "list") {
        last.items.push(bulletMatch[1]);
      } else {
        blocks.push({ kind: "list", items: [bulletMatch[1]] });
      }
      continue;
    }
    buffer.push(line);
  }
  flushPara();
  return (
    <div className="space-y-2">
      {blocks.map((b, i) =>
        b.kind === "para" ? (
          <p key={i} className="whitespace-pre-wrap break-words">
            {renderInlineMarkdown(b.text)}
          </p>
        ) : b.kind === "heading" ? (
          <p key={i} className="font-semibold text-white break-words">
            {renderInlineMarkdown(b.text)}
          </p>
        ) : (
          <ul key={i} className="list-disc pl-5 space-y-1 marker:text-violet-300">
            {b.items.map((it, j) => (
              <li key={j} className="break-words">
                {renderInlineMarkdown(it)}
              </li>
            ))}
          </ul>
        ),
      )}
    </div>
  );
}
