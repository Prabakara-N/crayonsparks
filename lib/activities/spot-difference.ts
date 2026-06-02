import type { ActivityResult, ActivitySpec } from "./types";
import { PAGE, SANS, svgDocument, titleBlock } from "./page";

const DIFF_COUNT: Record<string, number> = { easy: 4, medium: 5, hard: 6 };

export function spotDifferenceCount(spec: ActivitySpec): number {
  return spec.params.differenceCount ?? DIFF_COUNT[spec.difficulty] ?? 5;
}

// Real spot-the-difference: Picture 1 is the original scene, Picture 2 is the
// same scene with `count` genuine changes, and the answer key is Picture 2
// with those changes circled. All three come from the image model — no
// procedural dot/star overlays.
export function generateSpotDifference(
  spec: ActivitySpec,
  picture1?: string,
  picture2?: string,
  picture2Circled?: string,
): ActivityResult {
  const count = spotDifferenceCount(spec);

  const imgX = PAGE.margin;
  const imgW = PAGE.w - 2 * PAGE.margin;
  const gap = 24;
  const availH = PAGE.h - PAGE.bodyTop - PAGE.margin - gap;
  const imgH = availH / 2;
  const topY = PAGE.bodyTop;
  const bottomY = topY + imgH + gap;

  const imageEl = (src: string | undefined, y: number) =>
    src
      ? `<image href="${src}" x="${imgX}" y="${y}" width="${imgW}" height="${imgH}" preserveAspectRatio="xMidYMid slice"/>`
      : `<rect x="${imgX}" y="${y}" width="${imgW}" height="${imgH}" fill="#f4f4f5"/>`;
  const frame = (y: number) =>
    `<rect x="${imgX}" y="${y}" width="${imgW}" height="${imgH}" fill="none" stroke="#111" stroke-width="2"/>`;
  const labelLeft = `<text x="${imgX + 8}" y="${topY - 8}" font-family="${SANS}" font-size="18" font-weight="700" fill="#111">Picture 1</text>`;
  const labelRight = `<text x="${imgX + 8}" y="${bottomY - 8}" font-family="${SANS}" font-size="18" font-weight="700" fill="#111">Picture 2 — find ${count}</text>`;

  const title = titleBlock(
    spec.title || "Spot the Difference",
    `Find the ${count} differences between Picture 1 and Picture 2.`,
  );
  const top = title + imageEl(picture1, topY) + frame(topY) + labelLeft;
  const base = top + imageEl(picture2, bottomY) + frame(bottomY) + labelRight;
  const solution = top + imageEl(picture2Circled ?? picture2, bottomY) + frame(bottomY) + labelRight;

  return {
    svg: svgDocument(base),
    solutionSvg: svgDocument(solution),
    meta: { differenceCount: count, hasCircledKey: !!picture2Circled },
  };
}
