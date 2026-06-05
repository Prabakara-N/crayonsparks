import "server-only";

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Point fontconfig at our bundled public/fonts dir so sharp/librsvg resolves the family (it ignores SVG @font-face) instead of rendering tofu on font-less hosts. Clean bold sans for activity titles/headers.
export const ACTIVITY_FONT_FAMILY = "Liberation Sans";

let registered = false;

export function ensureActivityFontsRegistered(): void {
  if (registered) return;
  registered = true;
  try {
    const fontsDir = join(process.cwd(), "public/fonts");
    const cacheDir = "/tmp/fontcache";
    mkdirSync(cacheDir, { recursive: true });
    const confPath = "/tmp/activity-fonts.conf";
    const conf = `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig><dir>${fontsDir}</dir><dir>/usr/share/fonts</dir><dir>/usr/local/share/fonts</dir><cachedir>${cacheDir}</cachedir></fontconfig>`;
    writeFileSync(confPath, conf);
    process.env.FONTCONFIG_FILE = confPath;
  } catch {
    // best-effort — falls back to whatever system fonts exist
  }
}
