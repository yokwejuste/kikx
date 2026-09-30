import type { HighlighterCore } from "shiki/core";
import { loadLanguage, type Language } from "@/lib/highlight/languages";

export interface Token {
  content: string;
  color?: string;
  italic: boolean;
}

export type Lines = Token[][];

const MAX_CHARACTERS = 100_000;
const MAX_LINE_LENGTH = 2_000;
const CACHE_SIZE = 32;
const ITALIC = 1;

let highlighter: Promise<HighlighterCore> | null = null;
const loaded = new Map<Language, Promise<void>>();
const cache = new Map<string, Lines>();

function getHighlighter() {
  highlighter ??= Promise.all([
    import("shiki/core"),
    import("shiki/engine/javascript"),
    import("@/lib/highlight/theme"),
  ]).then(([{ createHighlighterCore }, { createJavaScriptRegexEngine }, { kikxTheme }]) =>
    createHighlighterCore({ themes: [kikxTheme], langs: [], engine: createJavaScriptRegexEngine() }),
  );
  return highlighter;
}

async function ensureLanguage(core: HighlighterCore, language: Language) {
  if (!loaded.has(language)) {
    loaded.set(
      language,
      loadLanguage(language).then((module) => core.loadLanguage(module.default)),
    );
  }
  await loaded.get(language);
}

export function canHighlight(code: string) {
  return code.length > 0 && code.length <= MAX_CHARACTERS;
}

export function cachedLines(code: string, language: Language) {
  return cache.get(`${language}\u0000${code}`) ?? null;
}

export async function highlight(code: string, language: Language): Promise<Lines> {
  const key = `${language}\u0000${code}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const core = await getHighlighter();
  await ensureLanguage(core, language);
  const { tokens } = core.codeToTokens(code, {
    lang: language,
    theme: "kikx",
    tokenizeMaxLineLength: MAX_LINE_LENGTH,
  });
  const lines = tokens.map((line) =>
    line.map((token) => ({
      content: token.content,
      color: token.color,
      italic: ((token.fontStyle ?? 0) & ITALIC) !== 0,
    })),
  );
  cache.set(key, lines);
  if (cache.size > CACHE_SIZE) cache.delete(cache.keys().next().value!);
  return lines;
}
