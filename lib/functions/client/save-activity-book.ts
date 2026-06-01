"use client";

import { orpc } from "@/lib/orpc/client";
import type { ActivityBookPlan } from "@/lib/activity-book-planner";
import type { ActivityPageItem } from "@/components/playground/activity-book/types";

type Variants = Awaited<ReturnType<typeof orpc.images.upload>>;

export interface SaveActivityArgs {
  plan: ActivityBookPlan;
  age: "toddlers" | "kids" | "tweens";
  items: ActivityPageItem[];
  includeAnswerKey: boolean;
  coverDataUrl?: string;
  backCoverDataUrl?: string;
  belongsToDataUrl?: string;
  belongsToStyle?: "bw" | "color";
}

export interface SaveActivityProgress {
  total: number;
  done: number;
  step: string;
}

function genBookId(): string {
  const uuid =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "")
      : Math.random().toString(36).slice(2);
  return `book_${uuid}`;
}

async function runWithConcurrency<T>(items: T[], limit: number, worker: (item: T) => Promise<void>): Promise<void> {
  const queue = items.slice();
  await Promise.all(
    Array.from({ length: Math.min(limit, queue.length) }, async () => {
      while (queue.length) {
        const next = queue.shift();
        if (!next) break;
        await worker(next);
      }
    }),
  );
}

export async function saveActivityBookToCloud(
  args: SaveActivityArgs,
  onProgress?: (p: SaveActivityProgress) => void,
): Promise<{ bookId: string }> {
  const done = args.items.filter((it) => it.status === "done" && it.dataUrl);
  if (!done.length) throw new Error("Generate the pages before saving.");

  const bookId = genBookId();
  const pageImage = new Map<string, Variants>();
  const pageSolution = new Map<string, Variants>();
  let coverV: Variants | null = null;
  let backCoverV: Variants | null = null;
  let belongsToV: Variants | null = null;

  interface Job {
    role: string;
    base64: string;
    assign: (v: Variants) => void;
  }
  const jobs: Job[] = [];
  if (args.coverDataUrl) {
    jobs.push({ role: "cover", base64: args.coverDataUrl, assign: (v) => (coverV = v) });
  }
  if (args.backCoverDataUrl) {
    jobs.push({ role: "back-cover", base64: args.backCoverDataUrl, assign: (v) => (backCoverV = v) });
  }
  if (args.belongsToDataUrl) {
    jobs.push({ role: "belongs-to", base64: args.belongsToDataUrl, assign: (v) => (belongsToV = v) });
  }
  for (const it of done) {
    jobs.push({ role: `activity-page-${it.spec.id}`, base64: it.dataUrl as string, assign: (v) => pageImage.set(it.spec.id, v) });
    if (args.includeAnswerKey && it.solutionDataUrl) {
      jobs.push({ role: `activity-solution-${it.spec.id}`, base64: it.solutionDataUrl, assign: (v) => pageSolution.set(it.spec.id, v) });
    }
  }

  const total = jobs.length + 1;
  let completed = 0;
  onProgress?.({ total, done: 0, step: `Uploading 0 / ${jobs.length}` });
  await runWithConcurrency(jobs, 6, async (job) => {
    const variants = await orpc.images.upload({ bookId, role: job.role, base64: job.base64 });
    job.assign(variants);
    completed += 1;
    onProgress?.({ total, done: completed, step: `Uploading ${completed} / ${jobs.length}` });
  });

  onProgress?.({ total, done: completed, step: "Saving book…" });

  const types = Array.from(new Set(done.map((it) => it.spec.type)));
  await orpc.books.save({
    bookId,
    mode: "activity",
    title: args.plan.title,
    coverTitle: args.plan.coverTitle,
    description: args.plan.description ?? "",
    scene: "",
    coverScene: args.plan.coverScene ?? "",
    age: args.age,
    aspectRatio: "85:110",
    pageCount: done.length,
    coverStyle: "illustrated",
    coverBorder: "bleed",
    activityMeta: { types, difficulty: args.plan.pages[0]?.difficulty, hasAnswerKey: args.includeAnswerKey },
    belongsToStyle: belongsToV ? (args.belongsToStyle ?? "bw") : undefined,
    belongsTo: belongsToV ?? undefined,
    cover: coverV ?? undefined,
    backCover: backCoverV ?? undefined,
    pages: done.map((it, i) => {
      const image = pageImage.get(it.spec.id);
      if (!image) throw new Error(`Missing upload for page ${it.spec.id}`);
      return {
        id: it.spec.id,
        index: i,
        name: it.spec.title,
        subject: it.spec.title,
        image,
        solution: pageSolution.get(it.spec.id),
        activity: {
          type: it.spec.type,
          difficulty: it.spec.difficulty,
          theme: it.spec.theme,
          params: it.spec.params as Record<string, unknown>,
        },
      };
    }),
  });

  onProgress?.({ total, done: total, step: "Saved." });
  return { bookId };
}
