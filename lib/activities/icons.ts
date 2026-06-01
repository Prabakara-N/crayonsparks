// Simple, recognizable black line-art icons for procedural activity pages
// (counting shapes, picture-matching). Pure functions, no deps — safe to import
// from the planner (server) and generators alike. Each returns SVG centered at
// (cx, cy) inside a `size`-wide box, stroked black on white so it stays
// ink-friendly and on-brand with the rest of the line art.
type IconFn = (cx: number, cy: number, size: number, sw: number) => string;

const f = (n: number) => n.toFixed(1);

const ICONS: Record<string, IconFn> = {
  star: (cx, cy, size, sw) => {
    const r = size / 2;
    const ri = r * 0.42;
    const pts: string[] = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 === 0 ? r : ri;
      pts.push(`${f(cx + Math.cos(a) * rr)},${f(cy + Math.sin(a) * rr)}`);
    }
    return `<polygon points="${pts.join(" ")}" fill="none" stroke="#111" stroke-width="${sw}" stroke-linejoin="round"/>`;
  },
  heart: (cx, cy, size, sw) => {
    const r = size / 2;
    const d = `M ${cx} ${f(cy + r * 0.8)} C ${f(cx - r * 1.4)} ${f(cy - r * 0.2)}, ${f(cx - r * 0.5)} ${f(cy - r * 0.9)}, ${cx} ${f(cy - r * 0.3)} C ${f(cx + r * 0.5)} ${f(cy - r * 0.9)}, ${f(cx + r * 1.4)} ${f(cy - r * 0.2)}, ${cx} ${f(cy + r * 0.8)} Z`;
    return `<path d="${d}" fill="none" stroke="#111" stroke-width="${sw}" stroke-linejoin="round"/>`;
  },
  ball: (cx, cy, size, sw) => {
    const r = size / 2;
    return (
      `<circle cx="${cx}" cy="${cy}" r="${f(r)}" fill="none" stroke="#111" stroke-width="${sw}"/>` +
      `<path d="M ${f(cx - r)} ${cy} Q ${cx} ${f(cy - r * 0.6)} ${f(cx + r)} ${cy}" fill="none" stroke="#111" stroke-width="${f(sw * 0.8)}"/>` +
      `<path d="M ${f(cx - r)} ${cy} Q ${cx} ${f(cy + r * 0.6)} ${f(cx + r)} ${cy}" fill="none" stroke="#111" stroke-width="${f(sw * 0.8)}"/>`
    );
  },
  sun: (cx, cy, size, sw) => {
    const r = size * 0.3;
    let rays = "";
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      rays += `<line x1="${f(cx + Math.cos(a) * r * 1.3)}" y1="${f(cy + Math.sin(a) * r * 1.3)}" x2="${f(cx + Math.cos(a) * r * 1.9)}" y2="${f(cy + Math.sin(a) * r * 1.9)}" stroke="#111" stroke-width="${sw}" stroke-linecap="round"/>`;
    }
    return `<circle cx="${cx}" cy="${cy}" r="${f(r)}" fill="none" stroke="#111" stroke-width="${sw}"/>${rays}`;
  },
  cloud: (cx, cy, size, sw) => {
    const r = size / 2;
    const d = `M ${f(cx - r)} ${f(cy + r * 0.4)} Q ${f(cx - r * 1.1)} ${f(cy - r * 0.1)} ${f(cx - r * 0.5)} ${f(cy - r * 0.2)} Q ${f(cx - r * 0.4)} ${f(cy - r * 0.7)} ${f(cx + r * 0.1)} ${f(cy - r * 0.5)} Q ${f(cx + r * 0.5)} ${f(cy - r * 0.9)} ${f(cx + r * 0.7)} ${f(cy - r * 0.3)} Q ${f(cx + r * 1.2)} ${f(cy - r * 0.3)} ${f(cx + r)} ${f(cy + r * 0.4)} Z`;
    return `<path d="${d}" fill="none" stroke="#111" stroke-width="${sw}" stroke-linejoin="round"/>`;
  },
  flower: (cx, cy, size, sw) => {
    const r = size * 0.18;
    const rr = size * 0.3;
    let petals = "";
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      petals += `<circle cx="${f(cx + Math.cos(a) * rr)}" cy="${f(cy + Math.sin(a) * rr)}" r="${f(r)}" fill="none" stroke="#111" stroke-width="${sw}"/>`;
    }
    return `${petals}<circle cx="${cx}" cy="${cy}" r="${f(r * 0.9)}" fill="none" stroke="#111" stroke-width="${sw}"/>`;
  },
  tree: (cx, cy, size, sw) => {
    const r = size * 0.32;
    return (
      `<circle cx="${cx}" cy="${f(cy - size * 0.12)}" r="${f(r)}" fill="none" stroke="#111" stroke-width="${sw}"/>` +
      `<rect x="${f(cx - size * 0.08)}" y="${f(cy + size * 0.16)}" width="${f(size * 0.16)}" height="${f(size * 0.32)}" fill="none" stroke="#111" stroke-width="${sw}"/>`
    );
  },
  apple: (cx, cy, size, sw) => {
    const r = size * 0.38;
    return (
      `<circle cx="${cx}" cy="${f(cy + size * 0.06)}" r="${f(r)}" fill="none" stroke="#111" stroke-width="${sw}"/>` +
      `<line x1="${cx}" y1="${f(cy - r + size * 0.06)}" x2="${cx}" y2="${f(cy - r - size * 0.12)}" stroke="#111" stroke-width="${sw}"/>` +
      `<path d="M ${cx} ${f(cy - r - size * 0.06)} q ${f(size * 0.2)} ${f(-size * 0.12)} ${f(size * 0.24)} ${f(size * 0.02)} q ${f(-size * 0.2)} ${f(size * 0.12)} ${f(-size * 0.24)} ${f(-size * 0.02)} z" fill="none" stroke="#111" stroke-width="${sw}"/>`
    );
  },
  fish: (cx, cy, size, sw) => {
    const w = size * 0.45;
    return (
      `<ellipse cx="${cx}" cy="${cy}" rx="${f(w)}" ry="${f(size * 0.28)}" fill="none" stroke="#111" stroke-width="${sw}"/>` +
      `<polygon points="${f(cx + w)},${cy} ${f(cx + w * 1.5)},${f(cy - size * 0.2)} ${f(cx + w * 1.5)},${f(cy + size * 0.2)}" fill="none" stroke="#111" stroke-width="${sw}" stroke-linejoin="round"/>` +
      `<circle cx="${f(cx - w * 0.5)}" cy="${f(cy - size * 0.04)}" r="${f(size * 0.04)}" fill="#111"/>`
    );
  },
  balloon: (cx, cy, size, sw) => {
    const r = size * 0.3;
    return (
      `<ellipse cx="${cx}" cy="${f(cy - size * 0.08)}" rx="${f(r)}" ry="${f(r * 1.2)}" fill="none" stroke="#111" stroke-width="${sw}"/>` +
      `<line x1="${cx}" y1="${f(cy - size * 0.08 + r * 1.2)}" x2="${cx}" y2="${f(cy + size * 0.45)}" stroke="#111" stroke-width="${f(sw * 0.8)}"/>`
    );
  },
  house: (cx, cy, size, sw) => {
    const w = size * 0.7;
    const h = size * 0.48;
    const x = cx - w / 2;
    const y = cy - h * 0.08;
    return (
      `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="none" stroke="#111" stroke-width="${sw}"/>` +
      `<polygon points="${f(x)},${f(y)} ${cx},${f(y - h * 0.6)} ${f(x + w)},${f(y)}" fill="none" stroke="#111" stroke-width="${sw}" stroke-linejoin="round"/>`
    );
  },
  cup: (cx, cy, size, sw) => {
    const w = size * 0.5;
    const h = size * 0.5;
    const x = cx - w / 2;
    const y = cy - h / 2;
    return (
      `<path d="M ${f(x)} ${f(y)} L ${f(x + w)} ${f(y)} L ${f(x + w * 0.85)} ${f(y + h)} L ${f(x + w * 0.15)} ${f(y + h)} Z" fill="none" stroke="#111" stroke-width="${sw}" stroke-linejoin="round"/>` +
      `<path d="M ${f(x + w)} ${f(y + h * 0.15)} q ${f(size * 0.2)} 0 ${f(size * 0.18)} ${f(size * 0.18)} q ${f(-0.02 * size)} ${f(size * 0.15)} ${f(-size * 0.2)} ${f(size * 0.12)}" fill="none" stroke="#111" stroke-width="${sw}"/>`
    );
  },
  egg: (cx, cy, size, sw) =>
    `<path d="M ${cx} ${f(cy - size * 0.45)} C ${f(cx + size * 0.35)} ${f(cy - size * 0.35)}, ${f(cx + size * 0.32)} ${f(cy + size * 0.45)}, ${cx} ${f(cy + size * 0.45)} C ${f(cx - size * 0.32)} ${f(cy + size * 0.45)}, ${f(cx - size * 0.35)} ${f(cy - size * 0.35)}, ${cx} ${f(cy - size * 0.45)} Z" fill="none" stroke="#111" stroke-width="${sw}"/>`,
  bone: (cx, cy, size, sw) => {
    const w = size * 0.5;
    const kr = size * 0.15;
    const by = size * 0.11;
    const knob = (x: number, y: number) =>
      `<circle cx="${f(x)}" cy="${f(y)}" r="${f(kr)}" fill="#fff" stroke="#111" stroke-width="${sw}"/>`;
    const bar = `<rect x="${f(cx - w)}" y="${f(cy - by)}" width="${f(w * 2)}" height="${f(by * 2)}" rx="${f(by)}" fill="#fff" stroke="#111" stroke-width="${sw}"/>`;
    return knob(cx - w, cy - by) + knob(cx - w, cy + by) + knob(cx + w, cy - by) + knob(cx + w, cy + by) + bar;
  },
  paw: (cx, cy, size, sw) => {
    const toe = size * 0.12;
    const tx = [-0.28, -0.1, 0.1, 0.28];
    const ty = [-0.3, -0.42, -0.42, -0.3];
    let toes = "";
    for (let i = 0; i < 4; i++)
      toes += `<circle cx="${f(cx + tx[i] * size)}" cy="${f(cy + ty[i] * size)}" r="${f(toe)}" fill="none" stroke="#111" stroke-width="${sw}"/>`;
    return `${toes}<ellipse cx="${cx}" cy="${f(cy + size * 0.08)}" rx="${f(size * 0.22)}" ry="${f(size * 0.19)}" fill="none" stroke="#111" stroke-width="${sw}"/>`;
  },
  butterfly: (cx, cy, size, sw) => {
    const r = size * 0.24;
    return (
      `<ellipse cx="${f(cx - r * 0.9)}" cy="${f(cy - r * 0.5)}" rx="${f(r * 0.9)}" ry="${f(r)}" fill="none" stroke="#111" stroke-width="${sw}"/>` +
      `<ellipse cx="${f(cx + r * 0.9)}" cy="${f(cy - r * 0.5)}" rx="${f(r * 0.9)}" ry="${f(r)}" fill="none" stroke="#111" stroke-width="${sw}"/>` +
      `<ellipse cx="${f(cx - r * 0.9)}" cy="${f(cy + r * 0.6)}" rx="${f(r * 0.7)}" ry="${f(r * 0.8)}" fill="none" stroke="#111" stroke-width="${sw}"/>` +
      `<ellipse cx="${f(cx + r * 0.9)}" cy="${f(cy + r * 0.6)}" rx="${f(r * 0.7)}" ry="${f(r * 0.8)}" fill="none" stroke="#111" stroke-width="${sw}"/>` +
      `<line x1="${cx}" y1="${f(cy - r)}" x2="${cx}" y2="${f(cy + r)}" stroke="#111" stroke-width="${f(sw * 1.5)}" stroke-linecap="round"/>`
    );
  },
  car: (cx, cy, size, sw) => {
    const w = size * 0.7;
    const h = size * 0.28;
    const x = cx - w / 2;
    const y = cy - h / 2;
    return (
      `<path d="M ${f(x)} ${f(y + h)} L ${f(x)} ${f(y + h * 0.4)} L ${f(x + w * 0.25)} ${f(y + h * 0.4)} L ${f(x + w * 0.4)} ${f(y)} L ${f(x + w * 0.75)} ${f(y)} L ${f(x + w * 0.85)} ${f(y + h * 0.4)} L ${f(x + w)} ${f(y + h * 0.4)} L ${f(x + w)} ${f(y + h)} Z" fill="none" stroke="#111" stroke-width="${sw}" stroke-linejoin="round"/>` +
      `<circle cx="${f(x + w * 0.25)}" cy="${f(y + h)}" r="${f(size * 0.1)}" fill="none" stroke="#111" stroke-width="${sw}"/>` +
      `<circle cx="${f(x + w * 0.75)}" cy="${f(y + h)}" r="${f(size * 0.1)}" fill="none" stroke="#111" stroke-width="${sw}"/>`
    );
  },
};

export const ICON_NAMES = Object.keys(ICONS);

export function iconSvg(name: string, cx: number, cy: number, size: number, sw = 3): string {
  const fn = ICONS[name?.toLowerCase()] ?? ICONS.star;
  return fn(cx, cy, size, sw);
}

export function isIconName(name: string): boolean {
  return typeof name === "string" && name.toLowerCase() in ICONS;
}
