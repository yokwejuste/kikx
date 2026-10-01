import { COMMANDS, commandSpec, SHELL_COMMANDS, type CommandSpec, type FlagSpec } from "./spec.ts";

export interface CompletionSources {
  templates: () => Promise<string[]>;
  components: () => Promise<string[]>;
  listDirectory: (path: string) => string[];
}

export interface Completion {
  line: string;
  cursor: number;
  matches: string[];
}

const PROGRAM = "kikx";
const FILE_PROGRAMS = ["cat", "ls"];
const TEMPLATE_COMMANDS = ["setup", "apply"];
const COMPONENT_COMMANDS = ["add"];

function commonPrefix(words: string[]): string {
  return words.reduce((prefix, word) => {
    let length = 0;
    while (length < prefix.length && prefix[length] === word[length]) length++;
    return prefix.slice(0, length);
  });
}

function findFlag(spec: CommandSpec, token: string): FlagSpec | undefined {
  const name = token.includes("=") ? token.slice(0, token.indexOf("=")) : token;
  return name.startsWith("--")
    ? spec.flags.find((flag) => flag.long === name.slice(2))
    : spec.flags.find((flag) => flag.short === name.slice(1));
}

function argumentState(spec: CommandSpec, args: string[]): { expectsValue: boolean; positionalTaken: boolean; used: Set<string> } {
  const used = new Set<string>();
  let positionalTaken = false;
  let expectsValue = false;
  for (const token of args) {
    if (expectsValue) {
      expectsValue = false;
      continue;
    }
    if (token.startsWith("-") && token !== "-") {
      const flag = findFlag(spec, token);
      if (flag) used.add(flag.long);
      expectsValue = !!flag?.value && !token.includes("=");
    } else {
      positionalTaken = true;
    }
  }
  return { expectsValue, positionalTaken, used };
}

function pathCandidates(word: string, sources: CompletionSources): string[] {
  const folder = word.slice(0, word.lastIndexOf("/") + 1);
  return sources.listDirectory(folder).map((entry) => `${folder}${entry}`);
}

async function kikxCandidates(word: string, args: string[], sources: CompletionSources): Promise<string[]> {
  if (args.length === 0) {
    return word.startsWith("-") ? ["--help", "--version"] : [...COMMANDS.map((command) => command.name), "help"];
  }
  const [name, ...rest] = args;
  if (name === "help") return rest.length === 0 ? COMMANDS.map((command) => command.name) : [];
  const spec = commandSpec(name);
  if (!spec) return [];
  const state = argumentState(spec, rest);
  if (state.expectsValue) return [];
  if (word.startsWith("-")) {
    const flags = spec.flags.filter((flag) => flag.multiple || !state.used.has(flag.long)).map((flag) => `--${flag.long}`);
    return [...flags, "--help"];
  }
  if (!spec.positional || state.positionalTaken) return [];
  if (TEMPLATE_COMMANDS.includes(spec.name)) return [...(await sources.templates()), ...pathCandidates(word, sources)];
  if (COMPONENT_COMMANDS.includes(spec.name)) return sources.components();
  return [];
}

async function candidatesFor(word: string, words: string[], sources: CompletionSources): Promise<string[]> {
  if (words.length === 0) return [PROGRAM, ...SHELL_COMMANDS];
  const [program, ...args] = words;
  if (FILE_PROGRAMS.includes(program)) return pathCandidates(word, sources);
  if (program === PROGRAM) return kikxCandidates(word, args, sources);
  return [];
}

export async function complete(line: string, cursor: number, sources: CompletionSources): Promise<Completion> {
  const before = line.slice(0, cursor);
  const wordStart = Math.max(before.lastIndexOf(" "), before.lastIndexOf("\t")) + 1;
  const word = before.slice(wordStart);
  const words = before.slice(0, wordStart).split(/\s+/).filter(Boolean);
  const candidates = await candidatesFor(word, words, sources).catch(() => []);
  const matches = [...new Set(candidates.filter((candidate) => candidate.startsWith(word)))].sort();
  if (matches.length === 0) return { line, cursor, matches };
  const single = matches.length === 1;
  const completion = single ? `${matches[0]}${matches[0].endsWith("/") ? "" : " "}` : commonPrefix(matches);
  if (completion.length <= word.length && !single) return { line, cursor, matches };
  const after = line.slice(cursor);
  const spaced = single && after.startsWith(" ") ? completion.trimEnd() : completion;
  return {
    line: `${line.slice(0, wordStart)}${spaced}${after}`,
    cursor: wordStart + spaced.length + (spaced === completion ? 0 : 1),
    matches,
  };
}
