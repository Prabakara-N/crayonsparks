import "server-only";

const PINTEREST_API = "https://api.pinterest.com/v5";

async function pinterestFetch<T>(
  path: string,
  init: RequestInit & { accessToken: string },
): Promise<T> {
  const { accessToken, ...rest } = init;
  const res = await fetch(`${PINTEREST_API}${path}`, {
    ...rest,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(rest.headers ?? {}),
    },
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(
      `Pinterest ${rest.method ?? "GET"} ${path} failed (${res.status}): ${detail.slice(0, 200)}`,
    );
  }
  return (await res.json()) as T;
}

export interface PinterestAccount {
  username: string | null;
}

export async function getPinterestAccount(
  accessToken: string,
): Promise<PinterestAccount> {
  const json = await pinterestFetch<{ username?: string }>(
    "/user_account",
    { method: "GET", accessToken },
  );
  return { username: json.username ?? null };
}

export interface PinterestBoard {
  id: string;
  name: string;
}

export async function listPinterestBoards(
  accessToken: string,
): Promise<PinterestBoard[]> {
  const json = await pinterestFetch<{
    items?: Array<{ id?: string; name?: string }>;
  }>("/boards?page_size=100", { method: "GET", accessToken });
  return (json.items ?? [])
    .filter((b) => b.id && b.name)
    .map((b) => ({ id: b.id as string, name: b.name as string }));
}

export async function createPinterestBoard(
  accessToken: string,
  name: string,
  description?: string,
): Promise<PinterestBoard> {
  const json = await pinterestFetch<{ id?: string; name?: string }>(
    "/boards",
    {
      method: "POST",
      accessToken,
      body: JSON.stringify({
        name,
        description: description ?? "",
        privacy: "PUBLIC",
      }),
    },
  );
  if (!json.id || !json.name) {
    throw new Error("Pinterest did not return a created board.");
  }
  return { id: json.id, name: json.name };
}

/** Find a board by exact name (case-insensitive) or create it. */
export async function ensurePinterestBoard(
  accessToken: string,
  name: string,
  description?: string,
): Promise<PinterestBoard> {
  const boards = await listPinterestBoards(accessToken);
  const match = boards.find(
    (b) => b.name.trim().toLowerCase() === name.trim().toLowerCase(),
  );
  if (match) return match;
  return createPinterestBoard(accessToken, name, description);
}

export interface CreatePinInput {
  boardId: string;
  title: string;
  description: string;
  link: string;
  imageUrl: string;
}

export interface PinterestPin {
  id: string;
  url: string;
}

export async function createPinterestPin(
  accessToken: string,
  input: CreatePinInput,
): Promise<PinterestPin> {
  const json = await pinterestFetch<{ id?: string }>("/pins", {
    method: "POST",
    accessToken,
    body: JSON.stringify({
      board_id: input.boardId,
      title: input.title.slice(0, 100),
      description: input.description.slice(0, 800),
      link: input.link,
      media_source: {
        source_type: "image_url",
        url: input.imageUrl,
      },
    }),
  });
  if (!json.id) {
    throw new Error("Pinterest did not return a created pin.");
  }
  return { id: json.id, url: `https://www.pinterest.com/pin/${json.id}/` };
}

export interface CreateCarouselPinInput {
  boardId: string;
  title: string;
  description: string;
  link: string;
  imageUrls: string[];
}

export async function createPinterestCarouselPin(
  accessToken: string,
  input: CreateCarouselPinInput,
): Promise<PinterestPin> {
  if (input.imageUrls.length < 2 || input.imageUrls.length > 5) {
    throw new Error("Carousel pin requires 2–5 images.");
  }
  const json = await pinterestFetch<{ id?: string }>("/pins", {
    method: "POST",
    accessToken,
    body: JSON.stringify({
      board_id: input.boardId,
      title: input.title.slice(0, 100),
      description: input.description.slice(0, 800),
      link: input.link,
      media_source: {
        source_type: "multiple_image_urls",
        items: input.imageUrls.map((url) => ({ url })),
      },
    }),
  });
  if (!json.id) {
    throw new Error("Pinterest did not return a created carousel pin.");
  }
  return { id: json.id, url: `https://www.pinterest.com/pin/${json.id}/` };
}
