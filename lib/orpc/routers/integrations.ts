import "server-only";

import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase/admin";
import { getReadUrl } from "@/lib/storage/sign-url";
import {
  listIntegrationStatus,
  deleteIntegration,
  getIntegrationToken,
  getIntegration,
  saveIntegration,
} from "@/lib/integrations/common/token-store";
import {
  ensurePinterestBoard,
  createPinterestPin,
  createPinterestCarouselPin,
  type PinterestPin,
} from "@/lib/integrations/pinterest/client";
import { refreshEtsyToken } from "@/lib/integrations/etsy/oauth";
import {
  getEtsyMe,
  getEtsyShop,
  createEtsyDraftListing,
  uploadEtsyListingImage,
  uploadEtsyListingFile,
  updateEtsyListing,
} from "@/lib/integrations/etsy/client";
import { buildEtsyPublishAssets } from "@/lib/integrations/etsy/build-publish-assets";
import { protectedProcedure } from "../base";

const DisconnectInput = z.object({
  platform: z.enum(["gumroad", "pinterest", "etsy"]),
});

const DEFAULT_BOARD_NAME = "Coloring Books";

const PinterestPublishInput = z.object({
  bookId: z.string().min(1).max(64),
  link: z.string().url(),
  boardName: z.string().min(1).max(100).optional(),
  includeCarousel: z.boolean().default(true),
});

interface BookImageVariant {
  key?: string;
}
interface BookImageVariants {
  thumb?: BookImageVariant;
  medium?: BookImageVariant;
  full?: BookImageVariant;
}
interface BookDoc {
  title?: string;
  coverTitle?: string;
  description?: string;
  cover?: BookImageVariants;
}

async function bestPublicUrl(
  variants: BookImageVariants | undefined,
): Promise<string | null> {
  const key =
    variants?.medium?.key ?? variants?.full?.key ?? variants?.thumb?.key;
  return key ? getReadUrl(key) : null;
}

export const integrationsRouter = {
  status: protectedProcedure.handler(async ({ context }) => {
    const items = await listIntegrationStatus(context.userId as string);
    return { items };
  }),

  disconnect: protectedProcedure
    .input(DisconnectInput)
    .handler(async ({ input, context }) => {
      await deleteIntegration(context.userId as string, input.platform);
      return { ok: true };
    }),

  pinterestPublish: protectedProcedure
    .input(PinterestPublishInput)
    .handler(async ({ input, context }) => {
      const uid = context.userId as string;
      const token = await getIntegrationToken(uid, "pinterest");
      if (!token) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Pinterest is not connected for this account.",
        });
      }

      const bookRef = db
        .collection("users")
        .doc(uid)
        .collection("books")
        .doc(input.bookId);
      const snap = await bookRef.get();
      if (!snap.exists) {
        throw new ORPCError("NOT_FOUND", { message: "Book not found." });
      }
      const book = snap.data() as BookDoc;

      const coverUrl = await bestPublicUrl(book.cover);
      if (!coverUrl) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Book is missing a cover image.",
        });
      }

      const title = (book.coverTitle ?? book.title ?? "Coloring Book").trim();
      const description = (
        book.description ?? "A hand-drawn coloring book."
      ).trim();

      const board = await ensurePinterestBoard(
        token,
        input.boardName ?? DEFAULT_BOARD_NAME,
        "Books from CrayonSparks",
      );

      const pins: PinterestPin[] = [];

      const coverPin = await createPinterestPin(token, {
        boardId: board.id,
        title,
        description,
        link: input.link,
        imageUrl: coverUrl,
      });
      pins.push(coverPin);

      if (input.includeCarousel) {
        const pagesSnap = await bookRef
          .collection("pages")
          .orderBy("index", "asc")
          .limit(4)
          .get();
        const pageUrls = (
          await Promise.all(
            pagesSnap.docs.map((d) => {
              const data = d.data() as { image?: BookImageVariants };
              return bestPublicUrl(data.image);
            }),
          )
        ).filter((u): u is string => Boolean(u));

        if (pageUrls.length >= 1) {
          const carouselImages = [coverUrl, ...pageUrls].slice(0, 5);
          if (carouselImages.length >= 2) {
            const carouselPin = await createPinterestCarouselPin(token, {
              boardId: board.id,
              title: `${title} — sample pages`,
              description,
              link: input.link,
              imageUrls: carouselImages,
            });
            pins.push(carouselPin);
          }
        }
      }

      await bookRef
        .collection("publications")
        .doc("pinterest")
        .set({
          platform: "pinterest",
          boardId: board.id,
          boardName: board.name,
          link: input.link,
          pinIds: pins.map((p) => p.id),
          pinUrls: pins.map((p) => p.url),
          publishedAt: FieldValue.serverTimestamp(),
        });

      return { board, pins };
    }),

  etsyPublish: protectedProcedure
    .input(
      z.object({
        bookId: z.string().min(1).max(64),
        priceCents: z.number().int().min(20).max(99999),
        taxonomyId: z.number().int().positive(),
        quantity: z.number().int().min(1).max(999).default(999),
        whoMade: z.enum(["i_did", "someone_else", "collective"]).default("i_did"),
        whenMade: z.string().default("made_to_order"),
        tags: z.array(z.string().min(1).max(20)).max(13).optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const uid = context.userId as string;
      const integration = await getIntegration(uid, "etsy");
      if (!integration) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Etsy is not connected for this account.",
        });
      }

      let accessToken = integration.accessToken;
      const expired =
        integration.tokenExpiresAtMs !== null &&
        integration.tokenExpiresAtMs - 60_000 < Date.now();
      if (expired) {
        if (!integration.refreshToken) {
          throw new ORPCError("BAD_REQUEST", {
            message:
              "Etsy session has expired and no refresh token is stored. Reconnect Etsy.",
          });
        }
        const refreshed = await refreshEtsyToken(integration.refreshToken);
        accessToken = refreshed.accessToken;
        await saveIntegration({
          uid,
          platform: "etsy",
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
          expiresInSec: refreshed.expiresInSec,
          scopes: refreshed.scope,
          accountId: null,
          accountHandle: integration.accountHandle,
        });
      }

      const me = await getEtsyMe(accessToken);
      const shop = await getEtsyShop(accessToken, me.userId);
      if (!shop) {
        throw new ORPCError("BAD_REQUEST", {
          message:
            "Etsy account has no open shop. Open your shop on Etsy first.",
        });
      }

      const bookRef = db
        .collection("users")
        .doc(uid)
        .collection("books")
        .doc(input.bookId);
      const snap = await bookRef.get();
      if (!snap.exists) {
        throw new ORPCError("NOT_FOUND", { message: "Book not found." });
      }
      const bookData = snap.data() ?? {};

      const pagesSnap = await bookRef
        .collection("pages")
        .orderBy("index", "asc")
        .get();
      const pages = pagesSnap.docs.map((d) => ({
        id: d.id,
        index: (d.data().index as number) ?? 0,
        name: (d.data().name as string) ?? "",
        image: d.data().image,
      }));

      const assets = await buildEtsyPublishAssets({
        title: (bookData.title as string) ?? "Coloring Book",
        coverTitle:
          (bookData.coverTitle as string) ??
          (bookData.title as string) ??
          "Coloring Book",
        mode: ((bookData.mode as "qa" | "story") ?? "qa"),
        cover: bookData.cover,
        backCover: bookData.backCover,
        belongsTo: bookData.belongsTo,
        belongsToStyle: bookData.belongsToStyle as "bw" | "color" | undefined,
        pages,
      });

      const title = (
        (bookData.coverTitle as string) ??
        (bookData.title as string) ??
        "Coloring Book"
      ).slice(0, 140);
      const description = (
        (bookData.description as string) ??
        "A hand-drawn printable coloring book."
      ).slice(0, 5000);

      const draft = await createEtsyDraftListing(accessToken, shop.shopId, {
        quantity: input.quantity,
        title,
        description,
        priceCents: input.priceCents,
        whoMade: input.whoMade,
        whenMade: input.whenMade,
        taxonomyId: input.taxonomyId,
        tags: input.tags,
      });

      await uploadEtsyListingImage(
        accessToken,
        shop.shopId,
        draft.listingId,
        assets.coverImageBytes,
        assets.coverImageFilename,
        1,
      );

      await uploadEtsyListingFile(
        accessToken,
        shop.shopId,
        draft.listingId,
        assets.pdfBytes,
        assets.pdfFilename,
        1,
      );

      const typed = await updateEtsyListing(
        accessToken,
        shop.shopId,
        draft.listingId,
        { type: "download" },
      );
      const activated = await updateEtsyListing(
        accessToken,
        shop.shopId,
        draft.listingId,
        { state: "active" },
      );

      const listingUrl =
        activated.url ??
        typed.url ??
        draft.url ??
        `https://www.etsy.com/listing/${draft.listingId}`;

      await bookRef
        .collection("publications")
        .doc("etsy")
        .set({
          platform: "etsy",
          shopId: shop.shopId,
          shopName: shop.shopName,
          listingId: draft.listingId,
          listingUrl,
          priceCents: input.priceCents,
          taxonomyId: input.taxonomyId,
          publishedAt: FieldValue.serverTimestamp(),
        });

      return {
        listingId: draft.listingId,
        listingUrl,
        shopName: shop.shopName,
      };
    }),
};
