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

// No quoted family names — this string is interpolated into
// font-family="${SANS}" inside SVG, and inner double quotes would break the
// XML attribute and make sharp/librsvg fail to parse the page.
export const SANS = "ui-sans-serif, system-ui, Arial, sans-serif";

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

export function svgDocument(body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${PAGE.w}" height="${PAGE.h}" viewBox="0 0 ${PAGE.w} ${PAGE.h}"><rect width="${PAGE.w}" height="${PAGE.h}" fill="#ffffff"/>${body}</svg>`;
}
