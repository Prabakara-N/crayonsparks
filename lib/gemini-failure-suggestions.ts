const SAFETY_SOFTEN_RULES: Array<[RegExp, string]> = [
  [/\bheld up high\b/gi, "presented gently"],
  [/\bhold(ing)? up high\b/gi, "present(ing) gently"],
  [/\bgiant rocky cliff\b/gi, "tall sunny rock outcrop"],
  [/\bdrop(ping)? off (a|the) cliff\b/gi, "stepping near a hill$1"],
  [/\bcliff edge\b/gi, "rock ledge"],
  [/\bcliff\b/gi, "tall rock"],
  [/\bshadowy cave\b/gi, "rocky cave with line-art rocks, no solid black fill"],
  [/\bshadowy\b/gi, "dim"],
  [/\bdark mane\b/gi, "thick mane"],
  [/\bscar over (one|his|her) eye\b/gi, "tuft of fur near $1 eye"],
  [/\bscarred\b/gi, "ruffled"],
  [/\bplotting\b/gi, "watching"],
  [/\bsneaky-looking\b/gi, "curious"],
  [/\bsneaky\b/gi, "curious"],
  [/\bvillain(s)?\b/gi, "rival$1"],
  [/\bscary\b/gi, "silly"],
  [/\bfrightened\b/gi, "surprised"],
  [/\bstampeding wildebeest\b/gi, "running herd of friendly wildebeest"],
  [/\bdust storm of the stampede\b/gi, "swirl of running animals"],
  [/\bstampede\b/gi, "running herd"],
  [/\blightning crackling\b/gi, "soft clouds"],
  [/\bstormy sky\b/gi, "cloudy sky"],
  [/\bnose to nose\b/gi, "facing each other"],
  [/\bconfront(ing|ed|s)?\b/gi, "meeting"],
  [/\bvultures circling\b/gi, "birds soaring"],
  [/\btiny baby\b/gi, "small"],
  [/\btears? streaming\b/gi, "one big tear"],
];

const IP_SUGGESTIONS: Array<[RegExp, string]> = [
  [
    /\bmeerkat\b.*\bwarthog\b|\bwarthog\b.*\bmeerkat\b/i,
    "Swap meerkat + warthog for a different odd-couple animal pair",
  ],
  [
    /\bcliff\b.*\bcub\b|\bcub\b.*\bcliff\b|\bbaboon\b/i,
    "Replace cliff / baboon / cub-presentation wording with a gentler original scene",
  ],
  [
    /\bstargazing\b|\blooking up at thousands of stars\b|\blying on (their|its) backs?\b/i,
    "Reword the stargazing beat into a different calm nighttime activity",
  ],
];

export function buildPromptSuggestions(prompt: string): string[] {
  const out: string[] = [];

  for (const [re, replacement] of SAFETY_SOFTEN_RULES) {
    const cleanRe = new RegExp(re.source, re.flags.replace("g", ""));
    const match = prompt.match(cleanRe);
    if (match) {
      out.push(
        `Replace "${match[0]}" with "${replacement.replace(/\$\d/g, "...")}"`,
      );
    }
    if (out.length >= 4) break;
  }

  for (const [re, suggestion] of IP_SUGGESTIONS) {
    if (re.test(prompt)) {
      out.push(suggestion);
      if (out.length >= 5) break;
    }
  }

  return out;
}
