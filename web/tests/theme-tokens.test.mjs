import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const web = new URL("..", import.meta.url).pathname;
const roots = ["app", "components"];

const RULES = [
  { name: "hex colour", pattern: /(?<![\w&/])#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b/gi },
  { name: "colour function", pattern: /\b(?:rgba?|hsla?|oklch|oklab|lab|lch|color-mix)\(/g },
  { name: "bracketed size", pattern: /-\[[^\]\s"'`]*\d(?:px|rem|em|vh|vw|dvh|svh|ms|s)(?![a-z])[^\]\s"'`]*\]/g },
  { name: "bracketed design value", pattern: /-\[[^\]\s"'`]*(?:cubic-bezier|color-mix|var\(--)[^\]\s"'`]*\]/g },
  { name: "bracketed z-index", pattern: /\bz-\[\d+\]/g },
  {
    name: "raw palette colour",
    pattern:
      /\b(?:bg|text|border|ring|fill|stroke|from|to|via|shadow|outline|decoration|divide|caret|accent)-(?:white|black|(?:red|green|blue|yellow|amber|emerald|orange|lime|sky|slate|gray|zinc|neutral|stone|rose|pink|purple|violet|indigo|cyan|teal|fuchsia)-\d{2,3})\b/g,
  },
];

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return entry.name.endsWith(".tsx") ? [path] : [];
  });
}

test("components take colours and sizes from the theme tokens", () => {
  const findings = roots
    .flatMap((root) => sourceFiles(join(web, root)))
    .flatMap((path) => {
      const file = relative(web, path);
      return readFileSync(path, "utf8")
        .split("\n")
        .flatMap((line, index) =>
          RULES.flatMap(({ name, pattern }) =>
            [...line.matchAll(pattern)].map((match) => `${file}:${index + 1} ${name} ${match[0]}`),
          ),
        );
    });
  assert.deepEqual(findings, []);
});
