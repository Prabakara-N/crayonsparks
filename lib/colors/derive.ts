// Derive related colors from a hex (e.g. a back-cover body tint and a dark
// matching stripe from a front-cover swatch). Pure, no deps.
function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function toHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

function mix(hex: string, target: { r: number; g: number; b: number }, amount: number): string {
  const c = parseHex(hex);
  if (!c) return hex;
  return toHex(
    c.r + (target.r - c.r) * amount,
    c.g + (target.g - c.g) * amount,
    c.b + (target.b - c.b) * amount,
  );
}

// Soft pastel body tint that still reads as the source hue.
export function tintHex(hex: string, amount = 0.8): string {
  return mix(hex, { r: 255, g: 255, b: 255 }, amount);
}

// Dark, saturated shade of the same hue — used for the back-cover top stripe.
export function shadeHex(hex: string, amount = 0.68): string {
  return mix(hex, { r: 18, g: 22, b: 32 }, amount);
}
