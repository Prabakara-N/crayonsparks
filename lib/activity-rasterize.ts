import "server-only";

import sharp from "sharp";
import { PAGE } from "@/lib/activities/page";

// Rasterizes an activity SVG to a print-quality PNG. The SVG uses a
// 850x1100 logical canvas (8.5x11 at 100 units/inch); at 300 DPI that is
// 2550x3300 px. density tells librsvg/resvg to scale up crisply.
export interface RasterizeResult {
  base64: string;
  dataUrl: string;
  width: number;
  height: number;
}

export async function rasterizeActivitySvg(
  svg: string,
  dpi = 300,
): Promise<RasterizeResult> {
  const width = Math.round((PAGE.w / 100) * dpi);
  const height = Math.round((PAGE.h / 100) * dpi);
  const png = await sharp(Buffer.from(svg), { density: dpi })
    .resize(width, height, { fit: "fill" })
    .flatten({ background: "#ffffff" })
    .png()
    .toBuffer();
  const base64 = png.toString("base64");
  return {
    base64,
    dataUrl: `data:image/png;base64,${base64}`,
    width,
    height,
  };
}
