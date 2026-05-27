// Generic shape both BookStudio's `Plan` and Sparky AI's `BookBrief` can be adapted to.
export interface PlanReviewPagePrompt {
  name: string;
  subject: string;
  dialogue?: Array<{
    speaker: string;
    text: string;
    speakerSide?: "left" | "right" | "center";
  }>;
  narration?: string;
}

export interface PlanReviewData {
  title?: string;
  coverTitle?: string;
  description?: string;
  scene?: string;
  coverScene?: string;
  theEndMessage?: string;
  characters?: Array<{ name: string; descriptor: string }>;
  prompts: PlanReviewPagePrompt[];
}
