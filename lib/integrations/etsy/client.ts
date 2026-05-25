import "server-only";

const ETSY_API = "https://api.etsy.com/v3/application";

function env(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is not configured.`);
  }
  return value;
}

interface EtsyFetchInit {
  accessToken: string;
  method?: string;
  body?: string | Uint8Array;
  contentType?: string;
}

async function etsyFetch<T>(path: string, init: EtsyFetchInit): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${init.accessToken}`,
    "x-api-key": env("ETSY_CLIENT_ID"),
  };
  if (init.contentType) headers["Content-Type"] = init.contentType;

  const isMultipart = !!init.contentType?.startsWith("multipart/");
  const res = await fetch(`${ETSY_API}${path}`, {
    method: init.method ?? "GET",
    signal: AbortSignal.timeout(isMultipart ? 45_000 : 20_000),
    headers,
    body: init.body as BodyInit | undefined,
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(
      `Etsy ${init.method ?? "GET"} ${path} failed (${res.status}): ${detail.slice(0, 300)}`,
    );
  }
  return (await res.json()) as T;
}

export interface EtsyMe {
  userId: number;
  shopId: number | null;
}

export async function getEtsyMe(accessToken: string): Promise<EtsyMe> {
  const json = await etsyFetch<{ user_id?: number; shop_id?: number | null }>(
    "/users/me",
    { accessToken },
  );
  if (!json.user_id) {
    throw new Error("Etsy /users/me did not return a user_id.");
  }
  return { userId: json.user_id, shopId: json.shop_id ?? null };
}

export interface EtsyShop {
  shopId: number;
  shopName: string;
}

export async function getEtsyShop(
  accessToken: string,
  userId: number,
): Promise<EtsyShop | null> {
  const json = await etsyFetch<{
    shop_id?: number;
    shop_name?: string;
  }>(`/users/${userId}/shops`, { accessToken });
  if (!json.shop_id || !json.shop_name) return null;
  return { shopId: json.shop_id, shopName: json.shop_name };
}

export interface CreateDraftListingInput {
  quantity: number;
  title: string;
  description: string;
  priceCents: number;
  whoMade: "i_did" | "someone_else" | "collective";
  whenMade: string;
  taxonomyId: number;
  tags?: string[];
}

export interface EtsyListing {
  listingId: number;
  url: string | null;
  state: string;
}

/**
 * Etsy expects `price` as a decimal (e.g. 4.99), not cents. We accept
 * cents and divide because every other money field in this codebase is
 * stored in cents.
 */
export async function createEtsyDraftListing(
  accessToken: string,
  shopId: number,
  input: CreateDraftListingInput,
): Promise<EtsyListing> {
  const body = new URLSearchParams({
    quantity: String(input.quantity),
    title: input.title,
    description: input.description,
    price: (input.priceCents / 100).toFixed(2),
    who_made: input.whoMade,
    when_made: input.whenMade,
    taxonomy_id: String(input.taxonomyId),
  });
  if (input.tags && input.tags.length > 0) {
    body.set("tags", input.tags.slice(0, 13).join(","));
  }

  const json = await etsyFetch<{
    listing_id?: number;
    url?: string;
    state?: string;
  }>(`/shops/${shopId}/listings`, {
    accessToken,
    method: "POST",
    contentType: "application/x-www-form-urlencoded",
    body: body.toString(),
  });
  if (!json.listing_id) {
    throw new Error("Etsy did not return a created listing_id.");
  }
  return {
    listingId: json.listing_id,
    url: json.url ?? null,
    state: json.state ?? "draft",
  };
}

async function buildMultipart(
  fields: Array<{
    name: string;
    value: string | { bytes: Uint8Array; filename: string; mime: string };
  }>,
): Promise<{ body: Uint8Array; boundary: string }> {
  const boundary = `----CrayonSparks${Math.random().toString(36).slice(2)}`;
  const parts: Uint8Array[] = [];
  const enc = new TextEncoder();
  for (const f of fields) {
    parts.push(enc.encode(`--${boundary}\r\n`));
    if (typeof f.value === "string") {
      parts.push(
        enc.encode(
          `Content-Disposition: form-data; name="${f.name}"\r\n\r\n${f.value}\r\n`,
        ),
      );
    } else {
      parts.push(
        enc.encode(
          `Content-Disposition: form-data; name="${f.name}"; filename="${f.value.filename}"\r\nContent-Type: ${f.value.mime}\r\n\r\n`,
        ),
      );
      parts.push(f.value.bytes);
      parts.push(enc.encode("\r\n"));
    }
  }
  parts.push(enc.encode(`--${boundary}--\r\n`));
  const total = parts.reduce((n, p) => n + p.byteLength, 0);
  const body = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    body.set(p, offset);
    offset += p.byteLength;
  }
  return { body, boundary };
}

export async function uploadEtsyListingImage(
  accessToken: string,
  shopId: number,
  listingId: number,
  imageBytes: Uint8Array,
  filename: string,
  rank = 1,
): Promise<{ listingImageId: number }> {
  const { body, boundary } = await buildMultipart([
    {
      name: "image",
      value: { bytes: imageBytes, filename, mime: "image/jpeg" },
    },
    { name: "rank", value: String(rank) },
  ]);
  const json = await etsyFetch<{ listing_image_id?: number }>(
    `/shops/${shopId}/listings/${listingId}/images`,
    {
      accessToken,
      method: "POST",
      contentType: `multipart/form-data; boundary=${boundary}`,
      body,
    },
  );
  if (!json.listing_image_id) {
    throw new Error("Etsy did not return a listing_image_id.");
  }
  return { listingImageId: json.listing_image_id };
}

export async function uploadEtsyListingFile(
  accessToken: string,
  shopId: number,
  listingId: number,
  fileBytes: Uint8Array,
  filename: string,
  rank = 1,
): Promise<{ listingFileId: number }> {
  const { body, boundary } = await buildMultipart([
    {
      name: "file",
      value: { bytes: fileBytes, filename, mime: "application/pdf" },
    },
    { name: "name", value: filename },
    { name: "rank", value: String(rank) },
  ]);
  const json = await etsyFetch<{ listing_file_id?: number }>(
    `/shops/${shopId}/listings/${listingId}/files`,
    {
      accessToken,
      method: "POST",
      contentType: `multipart/form-data; boundary=${boundary}`,
      body,
    },
  );
  if (!json.listing_file_id) {
    throw new Error("Etsy did not return a listing_file_id.");
  }
  return { listingFileId: json.listing_file_id };
}

export interface UpdateEtsyListingInput {
  state?: "draft" | "active" | "inactive";
  type?: "physical" | "download";
}

export async function updateEtsyListing(
  accessToken: string,
  shopId: number,
  listingId: number,
  input: UpdateEtsyListingInput,
): Promise<EtsyListing> {
  const body = new URLSearchParams();
  if (input.state) body.set("state", input.state);
  if (input.type) body.set("type", input.type);

  const json = await etsyFetch<{
    listing_id?: number;
    url?: string;
    state?: string;
  }>(`/shops/${shopId}/listings/${listingId}`, {
    accessToken,
    method: "PATCH",
    contentType: "application/x-www-form-urlencoded",
    body: body.toString(),
  });
  return {
    listingId: json.listing_id ?? listingId,
    url: json.url ?? null,
    state: json.state ?? "unknown",
  };
}
