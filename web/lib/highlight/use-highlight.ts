"use client";

import { useEffect, useState } from "react";
import { cachedLines, canHighlight, highlight, type Lines } from "@/lib/highlight/highlighter";
import type { Language } from "@/lib/highlight/languages";

export function useHighlight(code: string, language: Language | null): Lines | null {
  const enabled = language !== null && canHighlight(code);
  const [result, setResult] = useState<{ code: string; language: Language; lines: Lines } | null>(null);

  useEffect(() => {
    if (!enabled || cachedLines(code, language)) return;
    let active = true;
    highlight(code, language)
      .then((lines) => active && setResult({ code, language, lines }))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [code, language, enabled]);

  if (!enabled) return null;
  if (result && result.code === code && result.language === language) return result.lines;
  return cachedLines(code, language);
}
