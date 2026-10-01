export type KeyValueSeparator = "\n" | " ";

export type KeyValueProblem =
  | { kind: "name"; key: string }
  | { kind: "duplicate"; key: string }
  | { kind: "noKey"; text: string }
  | { kind: "noEquals"; text: string };

type Item = { kind: "pair"; key: string; value: string } | { kind: "text"; text: string };

const VARIABLE_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;
const QUOTED = /^(["'])[\s\S]*\1$/;

export function isVariableName(name: string): boolean {
  return VARIABLE_NAME.test(name);
}

function tokenize(text: string): string[] {
  const tokens: string[] = [];
  let token = "";
  let quote: string | null = null;
  for (const ch of text) {
    if (quote) {
      token += ch;
      if (ch === quote) quote = null;
    } else if (ch === "'" || ch === '"') {
      token += ch;
      quote = ch;
    } else if (/\s/.test(ch)) {
      if (token) tokens.push(token);
      token = "";
    } else {
      token += ch;
    }
  }
  if (token) tokens.push(token);
  return tokens;
}

function joinAroundEquals(tokens: string[]): string[] {
  const joined: string[] = [];
  for (const token of tokens) {
    const previous = joined[joined.length - 1];
    const glue =
      previous !== undefined &&
      (token.startsWith("=") || (previous.endsWith("=") && !token.includes("=")) || previous === "=");
    if (glue) joined[joined.length - 1] = previous + token;
    else joined.push(token);
  }
  return joined;
}

function quoteValue(value: string): string {
  if (!/\s/.test(value) || QUOTED.test(value)) return value;
  return value.includes('"') ? `'${value}'` : `"${value}"`;
}

function readChunk(text: string): Item[] {
  const items: Item[] = [];
  const words: Record<number, string[]> = {};
  for (const token of joinAroundEquals(tokenize(text))) {
    const eq = token.indexOf("=");
    const last = items[items.length - 1];
    if (eq > 0) {
      items.push({ kind: "pair", key: token.slice(0, eq), value: token.slice(eq + 1) });
      words[items.length - 1] = [];
    } else if (eq < 0 && last?.kind === "pair") {
      words[items.length - 1].push(token);
    } else {
      items.push({ kind: "text", text: token });
    }
  }
  return items.map((item, index) =>
    item.kind === "pair" && words[index].length
      ? { ...item, value: quoteValue([item.value, ...words[index]].filter(Boolean).join(" ")) }
      : item,
  );
}

function readItems(text: string, separator: KeyValueSeparator): Item[] {
  if (separator === " ") return readChunk(text);
  return text.split("\n").flatMap((line): Item[] => {
    const trimmed = line.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("#")) return [{ kind: "text", text: trimmed }];
    return readChunk(trimmed);
  });
}

export function parseKeyValuePairs(raw?: string): [string, string][] {
  return readItems(raw ?? "", " ").flatMap((item) => (item.kind === "pair" ? [[item.key, item.value] as [string, string]] : []));
}

export function formatKeyValues(text: string, separator: KeyValueSeparator): string {
  return readItems(text, separator)
    .map((item) => (item.kind === "pair" ? `${item.key}=${item.value}` : item.text))
    .join(separator);
}

export function keyProblems(keys: string[], checkNames: boolean): (KeyValueProblem | null)[] {
  const seen = new Set<string>();
  return keys.map((raw) => {
    const key = raw.trim();
    if (!key) return null;
    if (seen.has(key)) return { kind: "duplicate", key };
    seen.add(key);
    return checkNames && !isVariableName(key) ? { kind: "name", key } : null;
  });
}

export function keyValueProblems(text: string, separator: KeyValueSeparator, checkNames = true): KeyValueProblem[] {
  const items = readItems(text, separator);
  const pairs = items.flatMap((item) => (item.kind === "pair" ? [item.key] : []));
  const stray = items.flatMap((item): KeyValueProblem[] => {
    if (item.kind !== "text" || item.text.startsWith("#")) return [];
    return [item.text.startsWith("=") ? { kind: "noKey", text: item.text } : { kind: "noEquals", text: item.text }];
  });
  const keyed = keyProblems(pairs, checkNames).filter((problem): problem is KeyValueProblem => problem !== null);
  const unique = new Map([...stray, ...keyed].map((problem) => [JSON.stringify(problem), problem]));
  return [...unique.values()];
}
