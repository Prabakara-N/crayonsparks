export type BookChatMode = "qa" | "story";

export interface BookBriefQualityIssue {
  severity: "error" | "warning" | "info";
  message: string;
}

export interface BookBriefQualityReport {
  score: number;
  summary: string;
  issues: BookBriefQualityIssue[];
}

export interface BookBriefCharacter {
  name: string;
  descriptor: string;
}

export interface BookBriefPalette {
  name: string;
  hexes: string[];
}

export interface BookBriefDialogueLine {
  speaker: string;
  text: string;
}

export interface BookBriefPrompt {
  name: string;
  subject: string;
  dialogue?: BookBriefDialogueLine[];
  narration?: string;
  composition?: string;
}

export interface BookBrief {
  name: string;
  icon: string;
  coverScene: string;
  pageScene: string;
  prompts: BookBriefPrompt[];
  bottomStripPhrases?: string[];
  sidePlaqueLines?: string[];
  coverBadgeStyle?: string;
  characters?: BookBriefCharacter[];
  palette?: BookBriefPalette;
  detailLevel?: "simple" | "detailed" | "intricate";
  quality?: BookBriefQualityReport;
}

export type BookChatView =
  | {
      kind: "question";
      question: string;
      options: string[];
      option_descriptions?: string[];
      allow_freeform: boolean;
      allow_multi: boolean;
    }
  | { kind: "brief"; brief: BookBrief }
  | { kind: "message"; text: string };

export interface BookChatTurnResult {
  messages: import("ai").ModelMessage[];
  view: BookChatView;
}
