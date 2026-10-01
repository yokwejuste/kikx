"use client";

import { memo } from "react";
import { languageFor } from "@/lib/highlight/languages";
import type { Lines } from "@/lib/highlight/highlighter";
import { useHighlight } from "@/lib/highlight/use-highlight";
import { cn } from "@/lib/utils";

const HighlightedLines = memo(function HighlightedLines({ lines }: { lines: Lines }) {
  return lines.map((line, index) => (
    <span key={index} data-line>
      {line.map((token, position) => (
        <span key={position} style={{ color: token.color, fontStyle: token.italic ? "italic" : undefined }}>
          {token.content}
        </span>
      ))}
      {index < lines.length - 1 && "\n"}
    </span>
  ));
});

export function CodeView({ code, path, className }: { code: string; path: string; className?: string }) {
  const lines = useHighlight(code, languageFor(path));
  return (
    <pre className={cn("syntax", className)}>
      <code>{lines ? <HighlightedLines lines={lines} /> : code}</code>
    </pre>
  );
}
