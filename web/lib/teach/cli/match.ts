import { parseLine } from "./parse.ts";
import { normalizePath } from "./paths.ts";

const PATH_FLAGS = ["dir", "into"];

function canonical(input: string): string {
  const parsed = parseLine(input);
  if (parsed.kind !== "kikx") return input.trim().split(/\s+/).join(" ");
  const flags = Object.entries(parsed.flags)
    .map(([name, values]) => [name, values.map((value) => (PATH_FLAGS.includes(name) ? normalizePath(value) : value)).sort()] as const)
    .sort(([left], [right]) => left.localeCompare(right));
  const positional = parsed.positional === null ? null : normalizePath(parsed.positional);
  return JSON.stringify([parsed.command, positional, flags]);
}

export function commandMatches(typed: string, expected: string): boolean {
  return canonical(typed) === canonical(expected);
}
