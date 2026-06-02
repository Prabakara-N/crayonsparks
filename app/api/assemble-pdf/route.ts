import { NextResponse } from "next/server";
import JSZip from "jszip";
import { assembleColoringBookPdf, type PdfPageInput } from "@/lib/pdf";
import { fetchImageAsDataUrl } from "@/lib/storage/fetch-image";
import { rasterizeActivitySvg } from "@/lib/activity-rasterize";
import { answerDividerSvg, licensePageSvg } from "@/lib/activities/answer-pages";
import {
  buildKdpCoverPdf,
  type KdpPaperType,
} from "@/lib/kdp-cover-pdf";

export const runtime = "nodejs";
export const maxDuration = 300;

// Inputs may carry a `dataUrl` (studio flow, raw bytes in-browser) OR a `url`
// pointing at our own R2 storage (saved-library flow). URL inputs are resolved
// server-side via the SSRF-guarded fetcher before assembly.
type ImageRef = { dataUrl?: string; url?: string };
type PageRef = { id: string; name: string; dataUrl?: string; url?: string };

interface Body {
  title?: string;
  category?: string;
  pages?: PageRef[];
  cover?: ImageRef;
  backCover?: ImageRef;
  belongsTo?: ImageRef & { style: "bw" | "color" };
  mode?: "combined" | "interior" | "cover-wrap" | "package";
  trimWidthInches?: number;
  trimHeightInches?: number;
  paper?: KdpPaperType;
  interiorPageCount?: number;
  includeBlankPages?: boolean;
  solutionPages?: PageRef[];
  licensePage?: boolean;
  pageNumbers?: boolean;
  pageBorder?: boolean;
  target?: "kdp" | "etsy" | "all";
}

async function resolveImage(ref?: ImageRef): Promise<{ dataUrl: string } | undefined> {
  if (!ref) return undefined;
  if (ref.dataUrl) return { dataUrl: ref.dataUrl };
  if (ref.url) return { dataUrl: await fetchImageAsDataUrl(ref.url) };
  return undefined;
}

async function resolvePage(p: PageRef): Promise<PdfPageInput> {
  const dataUrl = p.dataUrl ?? (p.url ? await fetchImageAsDataUrl(p.url) : "");
  return { id: p.id, name: p.name, dataUrl };
}

export async function POST(req: Request) {
  let rawBody: Body;
  try {
    rawBody = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  // Resolve any url-based inputs (saved-library flow) into data URLs before
  // the existing data-URL validation + assembly run.
  let body: {
    title?: string;
    category?: string;
    pages?: PdfPageInput[];
    cover?: { dataUrl: string };
    backCover?: { dataUrl: string };
    belongsTo?: { dataUrl: string; style: "bw" | "color" };
    mode?: "combined" | "interior" | "cover-wrap" | "package";
    trimWidthInches?: number;
    trimHeightInches?: number;
    paper?: KdpPaperType;
    interiorPageCount?: number;
    includeBlankPages?: boolean;
    solutionPages?: PdfPageInput[];
    licensePage?: boolean;
    pageNumbers?: boolean;
    pageBorder?: boolean;
    target?: "kdp" | "etsy" | "all";
  };
  try {
    const cover = await resolveImage(rawBody.cover);
    const backCover = await resolveImage(rawBody.backCover);
    const belongsToResolved = rawBody.belongsTo
      ? await resolveImage(rawBody.belongsTo)
      : undefined;
    body = {
      ...rawBody,
      cover,
      backCover,
      belongsTo:
        belongsToResolved && rawBody.belongsTo
          ? { dataUrl: belongsToResolved.dataUrl, style: rawBody.belongsTo.style }
          : undefined,
      pages: rawBody.pages ? await Promise.all(rawBody.pages.map(resolvePage)) : undefined,
      solutionPages: rawBody.solutionPages
        ? await Promise.all(rawBody.solutionPages.map(resolvePage))
        : undefined,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to resolve image input.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const mode = body.mode ?? "combined";
  const safeCategory = (body.category ?? "book").replace(/[^a-z0-9]+/gi, "_");

  // ---- PACKAGE MODE — build ALL print PDFs in ONE request --------------
  // Resolving images once (decoded/fetched a single time above) and building
  // every PDF here avoids the old 4-requests-each-re-sending-all-images cost.
  if (mode === "package") {
    const pages = body.pages ?? [];
    if (pages.length === 0) {
      return NextResponse.json({ error: "No pages to assemble." }, { status: 400 });
    }
    if (pages.length > 60 || (body.solutionPages?.length ?? 0) > 60) {
      return NextResponse.json({ error: "Too many pages (max 60)." }, { status: 400 });
    }
    if (!body.cover?.dataUrl || !body.backCover?.dataUrl) {
      return NextResponse.json(
        { error: "cover and backCover are required for the print package." },
        { status: 400 },
      );
    }
    try {
      const solutionPages = body.solutionPages ?? [];
      const licensePageDataUrl = body.licensePage
        ? (await rasterizeActivitySvg(licensePageSvg(new Date().getFullYear()))).dataUrl
        : undefined;
      const answerDividerDataUrl = solutionPages.length
        ? (await rasterizeActivitySvg(answerDividerSvg())).dataUrl
        : undefined;

      const shared = {
        title: body.title,
        category: body.category ?? "book",
        pages,
        cover: body.cover,
        backCover: body.backCover,
        belongsTo: body.belongsTo,
        solutionPages: solutionPages.length ? solutionPages : undefined,
        licensePageDataUrl,
        answerDividerDataUrl,
        pageBorder: body.pageBorder,
      };
      const interiorPageCount =
        (body.belongsTo ? 2 : 0) +
        (licensePageDataUrl ? 1 : 0) +
        pages.length * 2 +
        (solutionPages.length ? 1 + solutionPages.length : 0);

      const target = body.target ?? "all";
      const wantKdp = target === "kdp" || target === "all";
      const wantEtsy = target === "etsy" || target === "all";

      const zip = new JSZip();
      const readme: string[] = ["CrayonSparks -> Print package", ""];

      if (wantKdp) {
        const [coverPdf, interiorPdf] = await Promise.all([
          buildKdpCoverPdf({
            frontCover: body.cover,
            backCover: body.backCover,
            trimWidthInches: 8.5,
            trimHeightInches: 11,
            interiorPageCount,
            paper: body.paper ?? "bw",
          }),
          assembleColoringBookPdf({ ...shared, interiorOnly: true, includeBlankPages: true }),
        ]);
        zip.file(`${safeCategory}_cover_KDP.pdf`, coverPdf);
        zip.file(`${safeCategory}_interior_KDP.pdf`, interiorPdf);
        readme.push("  *_cover_KDP.pdf     -> KDP COVER section");
        readme.push("  *_interior_KDP.pdf  -> KDP INTERIOR section");
      }
      if (wantEtsy) {
        const [letterPdf, a4Pdf] = await Promise.all([
          assembleColoringBookPdf({ ...shared, includeBlankPages: false, trimWidthInches: 8.5, trimHeightInches: 11 }),
          assembleColoringBookPdf({ ...shared, includeBlankPages: false, trimWidthInches: 8.27, trimHeightInches: 11.69 }),
        ]);
        zip.file(`${safeCategory}_etsy_letter.pdf`, letterPdf);
        zip.file(`${safeCategory}_etsy_a4.pdf`, a4Pdf);
        readme.push("  *_etsy_letter.pdf   -> Etsy/Gumroad, US Letter 8.5x11");
        readme.push("  *_etsy_a4.pdf       -> Etsy/Gumroad, A4 210x297mm");
      }
      zip.file("README.txt", readme.join("\n"));

      const zipBuf = await zip.generateAsync({
        type: "nodebuffer",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });
      const ab = zipBuf.buffer.slice(
        zipBuf.byteOffset,
        zipBuf.byteOffset + zipBuf.byteLength,
      );
      const fileSuffix = target === "kdp" ? "kdp" : target === "etsy" ? "etsy" : "print";
      return new NextResponse(ab as ArrayBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="${safeCategory}_${fileSuffix}_package.zip"`,
          "Cache-Control": "no-store",
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Package build failed.";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  // ---- COVER-WRAP MODE — KDP-correct cover PDF only --------------------
  if (mode === "cover-wrap") {
    if (!body.cover?.dataUrl?.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "cover.dataUrl required for cover-wrap mode." },
        { status: 400 },
      );
    }
    if (!body.backCover?.dataUrl?.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "backCover.dataUrl required for cover-wrap mode." },
        { status: 400 },
      );
    }
    const interiorPageCount =
      body.interiorPageCount ??
      (body.pages?.length
        ? body.pages.length * 2 + (body.belongsTo ? 2 : 0)
        : 24);
    try {
      const bytes = await buildKdpCoverPdf({
        frontCover: body.cover,
        backCover: body.backCover,
        trimWidthInches: body.trimWidthInches ?? 8.5,
        trimHeightInches: body.trimHeightInches ?? 11,
        interiorPageCount,
        paper: body.paper ?? "bw",
      });
      const arrayBuffer = bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength,
      );
      return new NextResponse(arrayBuffer as ArrayBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="crayonsparks_${safeCategory}_cover_KDP.pdf"`,
          "Cache-Control": "no-store",
        },
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Cover wrap PDF build failed.";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  // ---- COMBINED + INTERIOR MODE — pages-based assembly -----------------
  const pages = body.pages ?? [];
  if (pages.length === 0) {
    return NextResponse.json({ error: "No pages to assemble." }, { status: 400 });
  }
  if (pages.length > 60) {
    return NextResponse.json({ error: "Too many pages (max 60)." }, { status: 400 });
  }
  for (const p of pages) {
    if (!p.dataUrl?.startsWith("data:image/")) {
      return NextResponse.json(
        { error: `Invalid dataUrl for page ${p.id}.` },
        { status: 400 },
      );
    }
  }
  try {
    if (body.cover?.dataUrl && !body.cover.dataUrl.startsWith("data:image/")) {
      return NextResponse.json({ error: "Invalid cover dataUrl." }, { status: 400 });
    }
    if (
      body.backCover?.dataUrl &&
      !body.backCover.dataUrl.startsWith("data:image/")
    ) {
      return NextResponse.json(
        { error: "Invalid back-cover dataUrl." },
        { status: 400 },
      );
    }
    if (
      body.belongsTo?.dataUrl &&
      !body.belongsTo.dataUrl.startsWith("data:image/")
    ) {
      return NextResponse.json(
        { error: "Invalid belongs-to dataUrl." },
        { status: 400 },
      );
    }
    const solutionPages = body.solutionPages ?? [];
    if (solutionPages.length > 60) {
      return NextResponse.json({ error: "Too many answer-key pages (max 60)." }, { status: 400 });
    }
    for (const p of solutionPages) {
      if (!p.dataUrl?.startsWith("data:image/")) {
        return NextResponse.json({ error: `Invalid dataUrl for answer page ${p.id}.` }, { status: 400 });
      }
    }
    // License + answer-key divider are rendered as images (no embedded fonts)
    // so KDP doesn't flag the interior for non-embedded base-14 fonts.
    const licensePageDataUrl = body.licensePage
      ? (await rasterizeActivitySvg(licensePageSvg(new Date().getFullYear()))).dataUrl
      : undefined;
    const answerDividerDataUrl = solutionPages.length
      ? (await rasterizeActivitySvg(answerDividerSvg())).dataUrl
      : undefined;
    const bytes = await assembleColoringBookPdf({
      title: body.title,
      category: body.category ?? "book",
      pages,
      cover: body.cover,
      backCover: body.backCover,
      belongsTo: body.belongsTo,
      interiorOnly: mode === "interior",
      includeBlankPages: body.includeBlankPages,
      trimWidthInches: body.trimWidthInches,
      trimHeightInches: body.trimHeightInches,
      solutionPages: solutionPages.length ? solutionPages : undefined,
      licensePageDataUrl,
      answerDividerDataUrl,
      pageBorder: body.pageBorder,
    });
    const arrayBuffer = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    );
    const filenameSuffix = mode === "interior" ? "interior_KDP" : "KDP";
    return new NextResponse(arrayBuffer as ArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="crayonsparks_${safeCategory}_${filenameSuffix}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "PDF assembly failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
