import type { CoverBrief } from "@/components/playground/playground-studio/cover/cover-brief-types";

interface FetchCoverBriefArgs {
  text?: string;
  pdf?: File;
  wantSelling: boolean;
}

export async function fetchCoverBrief({
  text,
  pdf,
  wantSelling,
}: FetchCoverBriefArgs): Promise<CoverBrief> {
  let res: Response;
  if (pdf) {
    const form = new FormData();
    form.append("pdf", pdf);
    form.append("wantSelling", String(wantSelling));
    res = await fetch("/api/cover-brief", { method: "POST", body: form });
  } else {
    res = await fetch("/api/cover-brief", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text ?? "", wantSelling }),
    });
  }
  const json = (await res.json()) as CoverBrief & { error?: string };
  if (!res.ok) throw new Error(json.error || "Could not analyze the book.");
  return json;
}
