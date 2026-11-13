/**
 * Shared copy validator for authored and generated display strings.
 * Enforces text rules: no emojis, no em dashes, no en dashes, no semicolons.
 * Preserves literal technical syntax, codes, and negative measurements.
 */

export interface CopyViolation {
  field: string;
  rule: string;
  matched: string;
}

const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
const PROHIBITED_DASHES = /[—–]/; // em dash and en dash
const PROHIBITED_SEMICOLON = /;/;

export function validateProseText(text: string, fieldPath: string = ""): CopyViolation[] {
  const violations: CopyViolation[] = [];
  if (!text) return violations;

  if (EMOJI_REGEX.test(text)) {
    violations.push({
      field: fieldPath,
      rule: "no_emojis",
      matched: text.match(EMOJI_REGEX)?.[0] || "",
    });
  }

  if (PROHIBITED_DASHES.test(text)) {
    violations.push({
      field: fieldPath,
      rule: "no_prohibited_dashes",
      matched: text.match(PROHIBITED_DASHES)?.[0] || "",
    });
  }

  if (PROHIBITED_SEMICOLON.test(text)) {
    violations.push({
      field: fieldPath,
      rule: "no_semicolons",
      matched: text.match(PROHIBITED_SEMICOLON)?.[0] || "",
    });
  }

  return violations;
}

export function sanitizeProseText(text: string): string {
  if (!text) return "";
  let clean = text.replace(EMOJI_REGEX, "");
  clean = clean.replace(/[—–]/g, ", ");
  clean = clean.replace(/;/g, ".");
  return clean;
}

