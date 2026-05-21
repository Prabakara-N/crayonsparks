"use client";

import { orpc } from "@/lib/orpc/client";
import type { Plan, PromptItem } from "@/components/playground/book-studio/types";

interface ImageInput {
  dataUrl?: string;
}

export interface SaveBookArgs {
  plan: Plan;
  mode: "qa" | "story";
  age: "toddlers" | "kids" | "tweens";
  aspectRatio: string;
  coverStyle: "flat" | "illustrated";
  coverBorder: "framed" | "bleed";
  belongsToStyle?: "bw" | "color";
  cover: ImageInput;
  backCover: ImageInput;
  belongsTo?: ImageInput;
  theEndPage?: ImageInput;
  pages: PromptItem[];
  characterLock?: string | null;
}

export interface SaveProgress {
  total: number;
  done: number;
  step: string;
}

export interface SaveBookResult {
  bookId: string;
}

interface SaveBookOpts {
  onProgress?: (progress: SaveProgress) => void;
}

type Variants = Awaited<ReturnType<typeof orpc.images.upload>>;

function genBookId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `book_${ts}_${rand}`;
}

/**
 * Uploads every image in a finished book to R2, then writes the
 * Firestore book/page docs. Plain async function — no React.
 *
 * Throws on any failure (validation, upload, save). Caller decides
 * how to surface errors. Progress reported via `opts.onProgress`.
 */
export async function saveBookToCloud(
  args: SaveBookArgs,
  opts: SaveBookOpts = {},
): Promise<SaveBookResult> {
  if (!args.cover.dataUrl) {
    throw new Error("Cover image missing — generate it first.");
  }
  if (!args.backCover.dataUrl) {
    throw new Error("Back cover image missing — generate it first.");
  }
  for (const page of args.pages) {
    if (!page.dataUrl) {
      throw new Error(`Page "${page.name}" has no image — generate it first.`);
    }
  }

  const bookId = genBookId();

  interface Job {
    role: string;
    dataUrl: string;
    assign: (variants: Variants) => void;
  }
  const jobs: Job[] = [];

  let coverV: Variants | null = null;
  let backCoverV: Variants | null = null;
  let belongsToV: Variants | null = null;
  let theEndV: Variants | null = null;
  const pageVariants = new Map<string, Variants>();

  jobs.push({
    role: "cover",
    dataUrl: args.cover.dataUrl,
    assign: (v) => (coverV = v),
  });
  jobs.push({
    role: "back-cover",
    dataUrl: args.backCover.dataUrl,
    assign: (v) => (backCoverV = v),
  });

  if (args.mode === "story" && args.theEndPage?.dataUrl) {
    jobs.push({
      role: "the-end",
      dataUrl: args.theEndPage.dataUrl,
      assign: (v) => (theEndV = v),
    });
  } else if (args.mode === "qa" && args.belongsTo?.dataUrl) {
    jobs.push({
      role: "belongs-to",
      dataUrl: args.belongsTo.dataUrl,
      assign: (v) => (belongsToV = v),
    });
  }

  for (const page of args.pages) {
    jobs.push({
      role: `page-${page.id}`,
      dataUrl: page.dataUrl as string,
      assign: (v) => pageVariants.set(page.id, v),
    });
  }

  const total = jobs.length + 1;
  let done = 0;
  opts.onProgress?.({ total, done, step: `Uploading 0 / ${total - 1}` });

  await runWithConcurrency(jobs, 6, async (job) => {
    const variants = await orpc.images.upload({
      bookId,
      role: job.role,
      base64: job.dataUrl,
    });
    job.assign(variants);
    done += 1;
    opts.onProgress?.({
      total,
      done,
      step: `Uploading ${done} / ${total - 1}`,
    });
  });

  opts.onProgress?.({ total, done, step: "Saving book…" });

  if (!coverV || !backCoverV) {
    throw new Error("Upload incomplete — cover or back cover missing.");
  }

  const saved = await orpc.books.save({
    bookId,
    mode: args.mode,
    title: args.plan.title,
    coverTitle: args.plan.coverTitle,
    description: args.plan.description ?? "",
    scene: args.plan.scene ?? "",
    coverScene: args.plan.coverScene ?? "",
    age: args.age,
    aspectRatio: args.aspectRatio,
    pageCount: args.pages.length,
    detailLevel: args.plan.detailLevel,
    coverStyle: args.coverStyle,
    coverBorder: args.coverBorder,
    bottomStripPhrases: args.plan.bottomStripPhrases,
    sidePlaqueLines: args.plan.sidePlaqueLines,
    coverBadgeStyle: args.plan.coverBadgeStyle,
    notes: args.plan.notes,
    belongsToStyle: args.mode === "qa" ? args.belongsToStyle : undefined,
    belongsTo: belongsToV ?? undefined,
    storyType: args.mode === "story" ? args.plan.storyType : undefined,
    dialogueStyle:
      args.mode === "story" ? args.plan.dialogueStyle : undefined,
    backCoverTagline:
      args.mode === "story" ? args.plan.backCoverTagline : undefined,
    theEndMessage:
      args.mode === "story" ? args.plan.theEndMessage : undefined,
    theEndPage: theEndV ?? undefined,
    characters: args.mode === "story" ? args.plan.characters : undefined,
    palette: args.mode === "story" ? args.plan.palette : undefined,
    characterLock: args.characterLock ?? undefined,
    cover: coverV,
    backCover: backCoverV,
    pages: args.pages.map((p, i) => {
      const variants = pageVariants.get(p.id);
      if (!variants) throw new Error(`Missing variants for page ${p.id}`);
      return {
        id: p.id,
        index: i,
        name: p.name,
        subject: p.subject,
        dialogue: p.dialogue,
        narration: p.narration ?? undefined,
        composition: p.composition ?? undefined,
        image: variants,
      };
    }),
  });

  opts.onProgress?.({ total, done: total, step: "Saved." });
  return { bookId: saved.bookId };
}

async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  const queue = items.slice();
  const runners = Array.from(
    { length: Math.min(limit, queue.length) },
    async () => {
      while (queue.length > 0) {
        const next = queue.shift();
        if (!next) break;
        await worker(next);
      }
    },
  );
  await Promise.all(runners);
}
