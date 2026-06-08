export interface CoverSelling {
  ageBand?: string;
  countBadge?: string;
  stripPhrases: string[];
  plaqueLines: string[];
}

export interface CoverBrief {
  isBook: boolean;
  notBookReason?: string;
  summary: string;
  title?: string;
  author?: string;
  genre?: string;
  audience?: string;
  selling?: CoverSelling;
}
