const WORDS_PER_MINUTE = 230;
const READING_FLOOR_MS = 1800;
const READING_CEILING_MS = 9000;
const READING_LEAD_MS = 900;
const TYPING_BASE_MS = 45;
const TYPING_SPREAD_MS = 55;
const TYPING_BREATH_MS = 50;
const BREATH_AFTER = /[\s.,:=/-]/;

export function readingTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const ms = READING_LEAD_MS + (words * 60000) / WORDS_PER_MINUTE;
  return Math.round(Math.min(READING_CEILING_MS, Math.max(READING_FLOOR_MS, ms)));
}

export function typingDelay(character: string, random: number): number {
  const delay = TYPING_BASE_MS + random * TYPING_SPREAD_MS;
  return Math.round(BREATH_AFTER.test(character) ? delay + TYPING_BREATH_MS : delay);
}
