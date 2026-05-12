import type {
  BookBrief,
  BookBriefQualityIssue,
  BookBriefQualityReport,
  BookChatMode,
} from "./book-chat-types";

function wordCount(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function normalizedKey(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function hasDuplicate(values: string[]): boolean {
  const seen = new Set<string>();
  for (const value of values.map(normalizedKey).filter(Boolean)) {
    if (seen.has(value)) return true;
    seen.add(value);
  }
  return false;
}

function reportSummary(errors: number, warnings: number): string {
  if (errors > 0) return `${errors} blocking issue${errors === 1 ? "" : "s"} need revision.`;
  if (warnings > 0) return `${warnings} improvement${warnings === 1 ? "" : "s"} to review.`;
  return "Plan passed the pre-generation quality check.";
}

export function auditBookBrief(
  brief: BookBrief,
  mode: BookChatMode,
): BookBriefQualityReport {
  const issues: BookBriefQualityIssue[] = [];
  if (brief.prompts.length < 5) {
    issues.push({ severity: "error", message: "Plan has fewer than 5 pages." });
  }
  if (!brief.coverScene.trim()) {
    issues.push({ severity: "error", message: "Cover scene is missing." });
  }
  if (!brief.pageScene.trim()) {
    issues.push({ severity: "warning", message: "Shared page backdrop is missing." });
  }
  if (hasDuplicate(brief.prompts.map((p) => p.name))) {
    issues.push({ severity: "warning", message: "Some page names are duplicates." });
  }
  if (hasDuplicate(brief.prompts.map((p) => p.subject))) {
    issues.push({ severity: "warning", message: "Some page subjects are duplicates or near-duplicates." });
  }
  if (mode === "qa" && !brief.detailLevel) {
    issues.push({ severity: "warning", message: "Coloring book detail level is missing." });
  }
  if (mode === "story") {
    auditStoryBrief(brief, issues);
  } else {
    auditColoringBrief(brief, issues);
  }
  const errors = issues.filter((i) => i.severity === "error").length;
  const warnings = issues.filter((i) => i.severity === "warning").length;
  return {
    score: Math.max(0, 100 - errors * 25 - warnings * 8),
    summary: reportSummary(errors, warnings),
    issues,
  };
}

function auditColoringBrief(
  brief: BookBrief,
  issues: BookBriefQualityIssue[],
): void {
  for (const [index, prompt] of brief.prompts.entries()) {
    const words = wordCount(prompt.subject);
    if (words < 4) {
      issues.push({
        severity: "warning",
        message: `Page ${index + 1} subject is too vague for a reliable coloring page.`,
      });
    }
    if (words > 28) {
      issues.push({
        severity: "warning",
        message: `Page ${index + 1} subject may be too complex for clean line art.`,
      });
    }
  }
}

function auditStoryBrief(
  brief: BookBrief,
  issues: BookBriefQualityIssue[],
): void {
  const characterNames = new Set(
    (brief.characters ?? []).map((c) => c.name.trim()).filter(Boolean),
  );
  if (characterNames.size === 0) {
    issues.push({ severity: "error", message: "Story book is missing locked characters." });
  }
  if (!brief.palette || brief.palette.hexes.length < 3) {
    issues.push({ severity: "error", message: "Story book is missing a 3+ color palette." });
  }
  for (const [index, prompt] of brief.prompts.entries()) {
    const page = index + 1;
    for (const line of prompt.dialogue ?? []) {
      if (!characterNames.has(line.speaker.trim())) {
        issues.push({
          severity: "error",
          message: `Page ${page} dialogue speaker "${line.speaker}" is not a locked character.`,
        });
      }
      if (wordCount(line.text) > 12) {
        issues.push({
          severity: "warning",
          message: `Page ${page} dialogue is over 12 words and may render poorly.`,
        });
      }
    }
    if (prompt.narration && wordCount(prompt.narration) > 14) {
      issues.push({
        severity: "warning",
        message: `Page ${page} narration is over 14 words and may render poorly.`,
      });
    }
    if (
      characterNames.size > 0 &&
      ![...characterNames].some((name) => prompt.subject.includes(name))
    ) {
      issues.push({
        severity: "warning",
        message: `Page ${page} subject does not name a locked character.`,
      });
    }
  }
}
