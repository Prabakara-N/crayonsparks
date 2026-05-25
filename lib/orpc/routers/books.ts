import "server-only";

import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase/admin";
import { getReadUrl } from "@/lib/storage/sign-url";
import { protectedProcedure } from "../base";

type StoredVariant = { key?: string; url?: string; [k: string]: unknown };
type StoredVariants = Record<string, StoredVariant | undefined>;

/**
 * Stored presigned URLs expire (1h+ TTL). On every read we regenerate
 * the `url` for each variant from its permanent `key` so the browser
 * always gets a fresh, valid URL.
 */
async function reSignVariants(
  variants: StoredVariants | undefined,
): Promise<StoredVariants | undefined> {
  if (!variants || typeof variants !== "object") return variants;
  const out: StoredVariants = { ...variants };
  for (const size of ["thumb", "medium", "full"] as const) {
    const v = variants[size];
    if (v?.key) {
      out[size] = { ...v, url: await getReadUrl(v.key) };
    }
  }
  return out;
}

const VariantSchema = z.object({
  key: z.string().min(1),
  url: z.string().url(),
  bytes: z.number().int().nonnegative(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

const ImageVariantsSchema = z.object({
  thumb: VariantSchema,
  medium: VariantSchema,
  full: VariantSchema,
});

const DialogueLineSchema = z.object({
  speaker: z.string().min(1),
  text: z.string().min(1),
});

const CharacterSchema = z.object({
  name: z.string().min(1),
  descriptor: z.string().min(1),
});

const PaletteSchema = z.object({
  name: z.string().min(1),
  hexes: z.array(z.string()).min(1).max(8),
});

const PageInputSchema = z.object({
  id: z.string().min(1),
  index: z.number().int().nonnegative(),
  name: z.string().min(1),
  subject: z.string().min(1),
  dialogue: z.array(DialogueLineSchema).optional(),
  narration: z.string().optional(),
  composition: z.string().optional(),
  image: ImageVariantsSchema,
});

// Save shape covers BOTH book kinds via the `mode` discriminator:
//   mode = "qa"    → coloring book: has belongsTo + belongsToStyle, no theEndPage/storyType/etc.
//   mode = "story" → story book:    has theEndPage + theEndMessage + storyType + dialogueStyle
//                                    + characters + palette + dialogue/narration on pages
// All kind-specific fields are optional at the schema level; the client
// includes whichever apply.
const SaveInput = z.object({
  bookId: z.string().min(1).max(64),
  mode: z.enum(["qa", "story"]),
  title: z.string().min(1).max(200),
  coverTitle: z.string().min(1).max(80),
  description: z.string().max(1000),
  scene: z.string().max(1000),
  coverScene: z.string().max(1000),
  age: z.enum(["toddlers", "kids", "tweens"]),
  aspectRatio: z.string().max(16),
  pageCount: z.number().int().min(1).max(100),
  detailLevel: z.enum(["simple", "detailed", "intricate"]).optional(),
  coverStyle: z.enum(["flat", "illustrated"]),
  coverBorder: z.enum(["framed", "bleed"]),
  bottomStripPhrases: z.array(z.string()).max(3).optional(),
  sidePlaqueLines: z.array(z.string()).max(3).optional(),
  coverBadgeStyle: z.string().optional(),
  notes: z.string().optional(),
  // Coloring-book-only:
  belongsToStyle: z.enum(["bw", "color"]).optional(),
  belongsTo: ImageVariantsSchema.optional(),
  // Story-book-only:
  storyType: z.string().optional(),
  dialogueStyle: z.string().optional(),
  backCoverTagline: z.string().optional(),
  theEndMessage: z.string().optional(),
  theEndPage: ImageVariantsSchema.optional(),
  characters: z.array(CharacterSchema).optional(),
  palette: PaletteSchema.optional(),
  // Both kinds:
  characterLock: z.string().nullable().optional(),
  cover: ImageVariantsSchema,
  backCover: ImageVariantsSchema,
  pages: z.array(PageInputSchema).min(1).max(100),
});

const ListInput = z.object({
  limit: z.number().int().min(1).max(50).default(20),
});

const GetInput = z.object({ bookId: z.string().min(1) });

export const booksRouter = {
  save: protectedProcedure
    .input(SaveInput)
    .handler(async ({ input, context }) => {
      const userId = context.userId as string;
      const bookRef = db
        .collection("users")
        .doc(userId)
        .collection("books")
        .doc(input.bookId);

      const existing = await bookRef.get();
      if (existing.exists) {
        throw new ORPCError("CONFLICT", {
          message:
            "A book with this id already exists. Saved books cannot be overwritten yet.",
        });
      }

      const batch = db.batch();
      const now = FieldValue.serverTimestamp();
      const { pages, ...bookMeta } = input;

      batch.set(bookRef, {
        ...bookMeta,
        ownerUid: userId,
        createdAt: now,
        updatedAt: now,
      });

      for (const page of pages) {
        const pageRef = bookRef.collection("pages").doc(page.id);
        batch.set(pageRef, {
          ...page,
          createdAt: now,
        });
      }

      await batch.commit();
      return { bookId: input.bookId, savedAt: Date.now() };
    }),

  list: protectedProcedure.input(ListInput).handler(async ({ input, context }) => {
    const snap = await db
      .collection("users")
      .doc(context.userId as string)
      .collection("books")
      .orderBy("createdAt", "desc")
      .limit(input.limit)
      .get();

    const items = await Promise.all(
      snap.docs.map(async (d) => {
        const data = d.data();
        const mode = (data.mode as "qa" | "story") ?? "qa";
        const thumbKey = data.cover?.thumb?.key as string | undefined;
        let coverThumbUrl: string | null = null;
        if (thumbKey) {
          try {
            coverThumbUrl = await getReadUrl(thumbKey);
          } catch {
            coverThumbUrl = null;
          }
        }
        return {
          bookId: d.id,
          title: (data.title as string) ?? "",
          coverTitle: (data.coverTitle as string) ?? "",
          mode,
          kind: mode === "story" ? "story" : "coloring",
          age: (data.age as string) ?? "toddlers",
          pageCount: (data.pageCount as number) ?? 0,
          coverThumbUrl,
          createdAt: data.createdAt?.toMillis() ?? null,
        };
      }),
    );
    return { items };
  }),

  count: protectedProcedure.handler(async ({ context }) => {
    const userId = context.userId as string;
    const snap = await db
      .collection("users")
      .doc(userId)
      .collection("books")
      .count()
      .get();
    return { total: snap.data().count };
  }),

  get: protectedProcedure.input(GetInput).handler(async ({ input, context }) => {
    const userId = context.userId as string;
    const bookRef = db
      .collection("users")
      .doc(userId)
      .collection("books")
      .doc(input.bookId);
    const bookSnap = await bookRef.get();
    if (!bookSnap.exists) {
      throw new ORPCError("NOT_FOUND", { message: "Book not found." });
    }
    const pagesSnap = await bookRef
      .collection("pages")
      .orderBy("index", "asc")
      .get();

    const bookData = bookSnap.data() ?? {};
    for (const field of ["cover", "backCover", "belongsTo", "theEndPage"]) {
      if (bookData[field]) {
        bookData[field] = await reSignVariants(
          bookData[field] as StoredVariants,
        );
      }
    }

    const pages = await Promise.all(
      pagesSnap.docs.map(async (d) => {
        const data = d.data();
        if (data.image) {
          data.image = await reSignVariants(data.image as StoredVariants);
        }
        return { id: d.id, ...data };
      }),
    );

    return {
      book: { bookId: input.bookId, ...bookData },
      pages,
    };
  }),

  delete: protectedProcedure
    .input(GetInput)
    .handler(async ({ input, context }) => {
      const userId = context.userId as string;
      const bookRef = db
        .collection("users")
        .doc(userId)
        .collection("books")
        .doc(input.bookId);
      const pagesSnap = await bookRef.collection("pages").get();
      const batch = db.batch();
      pagesSnap.docs.forEach((d) => batch.delete(d.ref));
      batch.delete(bookRef);
      await batch.commit();
      return { bookId: input.bookId };
    }),
};
