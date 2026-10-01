import { commandSpec, flagLabel, SHELL_COMMANDS, type FlagSpec } from "./spec.ts";

export interface KikxCommand {
  kind: "kikx";
  command: string;
  positional: string | null;
  flags: Record<string, string[]>;
}

export type ParsedLine =
  | { kind: "empty" }
  | KikxCommand
  | { kind: "help" }
  | { kind: "version" }
  | { kind: "shell"; program: string; args: string[] }
  | { kind: "foreign"; program: string }
  | { kind: "usage"; message: string; details: string[] };

const PROGRAM = "kikx";
const HELP_FLAGS = ["help", "--help", "-h"];
const VERSION_FLAGS = ["--version", "-V"];

export function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let quote: string | null = null;
  let started = false;
  for (const char of input) {
    if (quote) {
      if (char === quote) quote = null;
      else current += char;
    } else if (char === '"' || char === "'") {
      quote = char;
      started = true;
    } else if (/\s/.test(char)) {
      if (started) tokens.push(current);
      current = "";
      started = false;
    } else {
      current += char;
      started = true;
    }
  }
  if (started) tokens.push(current);
  return tokens;
}

const usage = (message: string, details: string[] = []): ParsedLine => ({ kind: "usage", message, details });

function findFlag(flags: FlagSpec[], token: string): { flag?: FlagSpec; inline?: string } {
  const [name, inline] = token.includes("=") ? [token.slice(0, token.indexOf("=")), token.slice(token.indexOf("=") + 1)] : [token, undefined];
  const flag = name.startsWith("--")
    ? flags.find((candidate) => candidate.long === name.slice(2))
    : flags.find((candidate) => candidate.short === name.slice(1));
  return { flag, inline };
}

function invalidValue(flag: FlagSpec, value: string): string | null {
  if (flag.keyValue && !value.includes("=")) {
    return `invalid value '${value}' for '${flagLabel(flag)}': expected KEY=VALUE, got \`${value}\``;
  }
  if (flag.numeric && !/^\d+$/.test(value)) {
    return `invalid value '${value}' for '${flagLabel(flag)}': invalid digit found in string`;
  }
  return null;
}

export function parseLine(input: string): ParsedLine {
  const tokens = tokenize(input);
  if (tokens.length === 0) return { kind: "empty" };
  const [program, name, ...rest] = tokens;
  if (program !== PROGRAM) {
    return SHELL_COMMANDS.includes(program) ? { kind: "shell", program, args: tokens.slice(1) } : { kind: "foreign", program };
  }
  if (name === undefined || HELP_FLAGS.includes(name)) return { kind: "help" };
  if (VERSION_FLAGS.includes(name)) return { kind: "version" };
  const spec = commandSpec(name);
  if (!spec) return usage(`unrecognized subcommand '${name}'`);

  const flags: Record<string, string[]> = {};
  let positional: string | null = null;
  for (let index = 0; index < rest.length; index++) {
    const token = rest[index];
    if (HELP_FLAGS.includes(token)) return { kind: "help" };
    if (!token.startsWith("-") || token === "-") {
      if (!spec.positional || positional !== null) return usage(`unexpected argument '${token}' found`);
      positional = token;
      continue;
    }
    const { flag, inline } = findFlag(spec.flags, token);
    if (!flag) return usage(`unexpected argument '${token}' found`);
    if (flags[flag.long] && !flag.multiple) return usage(`the argument '${flagLabel(flag)}' cannot be used multiple times`);
    if (!flag.value) {
      flags[flag.long] = [];
      continue;
    }
    const value = inline ?? rest[++index];
    if (value === undefined) return usage(`a value is required for '${flagLabel(flag)}' but none was supplied`);
    const invalid = invalidValue(flag, value);
    if (invalid) return usage(invalid);
    flags[flag.long] = [...(flags[flag.long] ?? []), value];
  }

  const missing = [
    ...spec.flags.filter((flag) => flag.required && !flags[flag.long]).map(flagLabel),
    ...(spec.positional && positional === null ? [`<${spec.positional}>`] : []),
  ];
  if (missing.length > 0) return usage("the following required arguments were not provided:", missing);
  return { kind: "kikx", command: spec.name, positional, flags };
}

export const flagValue = (command: KikxCommand, name: string): string | undefined => command.flags[name]?.[0];

export const hasFlag = (command: KikxCommand, name: string): boolean => name in command.flags;

export function keyValues(command: KikxCommand, name: string): [string, string][] {
  return (command.flags[name] ?? []).map((pair) => [pair.slice(0, pair.indexOf("=")), pair.slice(pair.indexOf("=") + 1)]);
}
