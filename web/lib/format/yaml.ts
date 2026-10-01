import { parseDocument, type ErrorCode } from "yaml";

type YamlReason =
  | "duplicateKey"
  | "tabIndent"
  | "badIndent"
  | "missingChar"
  | "colonInValue"
  | "multipleDocs"
  | "badEscape"
  | "syntax";

export interface YamlProblem {
  line: number;
  from: number;
  to: number;
  reason: YamlReason;
}

const REASONS: Partial<Record<ErrorCode, YamlReason>> = {
  DUPLICATE_KEY: "duplicateKey",
  TAB_AS_INDENT: "tabIndent",
  BAD_INDENT: "badIndent",
  MULTILINE_IMPLICIT_KEY: "badIndent",
  MISSING_CHAR: "missingChar",
  BLOCK_AS_IMPLICIT_KEY: "colonInValue",
  MULTIPLE_DOCS: "multipleDocs",
  BAD_DQ_ESCAPE: "badEscape",
};

const PRINT_OPTIONS = { indent: 2, lineWidth: 0, minContentWidth: 0, flowCollectionPadding: false } as const;

function parse(text: string) {
  return parseDocument(text, { schema: "failsafe" });
}

export function checkYaml(text: string): YamlProblem[] {
  const seen = new Set<number>();
  return parse(text).errors.flatMap((error) => {
    const line = error.linePos?.[0].line ?? 1;
    if (seen.has(line)) return [];
    seen.add(line);
    const [from, to] = error.pos;
    return [{ line, from, to: Math.max(to, from + 1), reason: REASONS[error.code] ?? "syntax" }];
  });
}

export function formatYaml(text: string): string {
  if (!text.trim()) return text;
  const document = parse(text);
  if (document.errors.length > 0) return text;
  const printed = document.toString(PRINT_OPTIONS);
  return text.endsWith("\n") ? printed : printed.replace(/\n+$/, "");
}

function opensBlock(content: string): boolean {
  return /:$/.test(content) || /:\s+[|>][+-]?\d*$/.test(content);
}

export function nextLineIndent(line: string): string {
  const indent = line.match(/^\s*/)?.[0] ?? "";
  const content = line.slice(indent.length).replace(/\s+#.*$/, "").trimEnd();
  const item = content.match(/^-(\s+|$)/);
  if (!item) return opensBlock(content) ? `${indent}  ` : indent;
  const itemIndent = indent + " ".repeat(Math.max(item[0].length, 2));
  const rest = content.slice(item[0].length);
  if (!rest) return itemIndent;
  if (opensBlock(rest)) return `${itemIndent}  `;
  return /^[^\s'"#][^:]*:\s/.test(rest) ? itemIndent : indent;
}
