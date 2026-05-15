import type { BookBrief } from "@/lib/book-chat";

export type Mode = "qa" | "story";

export interface Bubble {
  role: "user" | "assistant";
  text: string;
}

export type View =
  | {
      kind: "question";
      question: string;
      intro?: string;
      options: string[];
      option_descriptions?: string[];
      allow_freeform: boolean;
      allow_multi: boolean;
    }
  | { kind: "brief"; brief: BookBrief }
  | { kind: "message"; text: string };

export interface ApiResponse {
  messages: unknown[];
  view: View;
}

export interface ModeIntro {
  greeting: string;
  placeholders: string[];
  quickStarts: string[];
}
