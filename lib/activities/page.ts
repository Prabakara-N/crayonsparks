// Logical page geometry for activity SVGs — 8.5x11 inches at 100 units/inch.
// The rasterizer scales this to 300 DPI (3x) for print.
export const PAGE = {
  w: 850,
  h: 1100,
  margin: 70,
  titleY: 110,
  instructionY: 150,
  bodyTop: 200,
};

import { ACTIVITY_FONT_FAMILY } from "./server-fonts";

// No quoted family names — interpolated into font-family="${SANS}"; the bundled family is listed first (registered with fontconfig in server-fonts) so rasterization never falls back to tofu.
export const SANS = `${ACTIVITY_FONT_FAMILY}, ui-sans-serif, system-ui, Arial, sans-serif`;

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function titleBlock(title: string, instruction?: string): string {
  const titleEl = `<text x="${PAGE.w / 2}" y="${PAGE.titleY}" text-anchor="middle" font-family="${SANS}" font-size="44" font-weight="700" fill="#111111">${escapeXml(
    title,
  )}</text>`;
  const instrEl = instruction
    ? `<text x="${PAGE.w / 2}" y="${PAGE.instructionY}" text-anchor="middle" font-family="${SANS}" font-size="22" fill="#444444">${escapeXml(
        instruction,
      )}</text>`
    : "";
  return titleEl + instrEl;
}

const FRAME_INSET = 32;

export function pageFrame(): string {
  const x = FRAME_INSET;
  const y = FRAME_INSET;
  const w = PAGE.w - FRAME_INSET * 2;
  const h = PAGE.h - FRAME_INSET * 2;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="22" fill="none" stroke="#d4d4d8" stroke-width="3"/>`;
}

export function footer(label: string): string {
  return `<text x="${PAGE.w / 2}" y="${PAGE.h - 26}" text-anchor="middle" font-family="${SANS}" font-size="20" fill="#9ca3af">${escapeXml(
    label,
  )}</text>`;
}

export function svgDocument(body: string, opts: { frame?: boolean } = {}): string {
  const frame = opts.frame === false ? "" : pageFrame();
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${PAGE.w}" height="${PAGE.h}" viewBox="0 0 ${PAGE.w} ${PAGE.h}"><rect width="${PAGE.w}" height="${PAGE.h}" fill="#ffffff"/>${frame}${body}</svg>`;
}
