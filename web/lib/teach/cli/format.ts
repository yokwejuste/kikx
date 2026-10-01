import { ABOUT, COMMANDS } from "./spec.ts";

export type Tone = "success" | "heading" | "hint" | "volt" | "error";

export interface Segment {
  text: string;
  tone?: Tone;
}

export type Notice = "foreign";

export type OutputLine = Segment[] | { notice: Notice } | { tip: string };

export interface ListedField {
  name: string;
  required: boolean;
  default?: string | null;
  example?: string | null;
  options?: { value: string }[];
}

export interface ListedComponent {
  reference: string;
  description: string;
  fields: ListedField[];
}

export interface ListedPreset {
  name: string;
  title: string;
  description: string;
  componentCount: number;
}

export interface ProjectConfig {
  name: string;
  defaultNamespace: string;
  outputDir: string;
}

const plain = (text: string): Segment => ({ text });
const toned = (tone: Tone) => (text: string): Segment => ({ text, tone });
const success = toned("success");
const heading = toned("heading");
const hint = toned("hint");
const volt = toned("volt");
const blank: OutputLine = [];
const indented = (path: string): OutputLine => [plain(`  ${path}`)];

export const textLines = (text: string): OutputLine[] => text.replace(/\n$/, "").split("\n").map((line) => [plain(line)]);

export function initOutput(name: string): OutputLine[] {
  return [
    [
      success("Initialized"),
      plain(` kikx project \`${name}\`. `),
      hint("Vendor components with `kikx add <category>/<component>` (see `kikx list`)"),
    ],
  ];
}

export const addOutput = (paths: string[]): OutputLine[] => paths.map((path) => [success("Vendored"), plain(` ${path}`)]);

function fieldNotes(field: ListedField): string {
  const notes: string[] = [];
  if (field.required) notes.push("required");
  if (field.default) notes.push(`default ${field.default}`);
  if (field.example) notes.push(`e.g. ${field.example}`);
  if (field.options?.length) notes.push(`one of ${field.options.map((option) => option.value).join(", ")}`);
  return notes.length > 0 ? `(${notes.join("; ")})` : "";
}

export function listOutput(components: ListedComponent[]): OutputLine[] {
  return [
    [heading("Available components:")],
    ...components.flatMap((component): OutputLine[] => [
      blank,
      [plain("  "), volt(component.reference), plain(": "), hint(component.description)],
      ...component.fields.map((field): OutputLine => {
        const notes = fieldNotes(field);
        return [plain(`      --set ${field.name}=…`), ...(notes ? [plain("  "), hint(notes)] : [])];
      }),
    ]),
    blank,
    [hint("You can also `kikx add <url>` or `kikx add <path-to-registry-item.json>`.")],
  ];
}

export function presetsOutput(presets: ListedPreset[]): OutputLine[] {
  return [
    [heading("Preset templates:")],
    ...presets.flatMap((preset): OutputLine[] => [
      blank,
      [plain("  "), volt(preset.name), plain(`: ${preset.title} `), hint(`(${preset.componentCount} components)`)],
      [plain("      "), hint(preset.description)],
    ]),
    blank,
    [hint("Start one with `kikx setup <name>`, or add it to a project with `kikx apply <name>`.")],
  ];
}

export function setupOutput(name: string, outputDir: string, paths: string[]): OutputLine[] {
  return [
    [success("Initialized"), plain(` kikx project \`${name}\`: wrote ${paths.length} file(s) to ${outputDir}`)],
    ...paths.map(indented),
  ];
}

export function applyOutput(paths: string[]): OutputLine[] {
  return [[success("Vendored"), plain(` ${paths.length} file(s):`)], ...paths.map(indented)];
}

export const versionOutput = (version: string): OutputLine[] => [[plain(`kikx ${version}`)]];

export const latestOutput = (current: string): OutputLine[] => [[plain(`kikx ${current} is the latest version.`)]];

export const installedOutput = (current: string): OutputLine[] => [[plain(`kikx ${current} is already installed.`)]];

export function availableOutput(target: string, current: string): OutputLine[] {
  return [[plain(`kikx ${target} is available (you have ${current}). `), hint("Run `kikx upgrade` to install it.")]];
}

export function upgradedOutput(current: string, target: string): OutputLine[] {
  return [
    [success("Upgrading"), plain(` kikx ${current} to ${target}`)],
    [success(`kikx is now ${target}.`)],
  ];
}

export const errorOutput = (message: string): OutputLine[] => [[{ text: "Error:", tone: "error" }, plain(` ${message}`)]];

export const tipOutput = (name: string | null): OutputLine[] => (name ? [{ tip: name }] : []);

export function usageOutput(message: string, details: string[]): OutputLine[] {
  return [
    [{ text: "error:", tone: "error" }, plain(` ${message}`)],
    ...details.map(indented),
    blank,
    [plain("For more information, try '"), volt("--help"), plain("'.")],
  ];
}

export function helpOutput(): OutputLine[] {
  const width = Math.max(...COMMANDS.map((command) => command.name.length), "help".length) + 2;
  const row = (name: string, about: string): OutputLine => [plain("  "), volt(name.padEnd(width)), plain(about)];
  return [
    [plain(ABOUT)],
    blank,
    [success("Usage:"), plain(" "), volt("kikx"), plain(" <COMMAND>")],
    blank,
    [success("Commands:")],
    ...COMMANDS.map((command) => row(command.name, command.about)),
    row("help", "Print this message or the help of the given subcommand(s)"),
    blank,
    [success("Options:")],
    [plain("  "), volt("-h"), plain(", "), volt("--help"), plain("     Print help")],
    [plain("  "), volt("-V"), plain(", "), volt("--version"), plain("  Print version")],
  ];
}

export function kikxToml(config: ProjectConfig): string {
  return [
    "[project]",
    `name = ${JSON.stringify(config.name)}`,
    `default_namespace = ${JSON.stringify(config.defaultNamespace)}`,
    `output_dir = ${JSON.stringify(config.outputDir)}`,
    "",
  ].join("\n");
}

export function readKikxToml(text: string, defaults: Omit<ProjectConfig, "name">): ProjectConfig | null {
  const values = new Map<string, string>();
  for (const line of text.split("\n")) {
    const match = /^\s*([a-z_]+)\s*=\s*"((?:[^"\\]|\\.)*)"\s*$/.exec(line);
    if (match) values.set(match[1], JSON.parse(`"${match[2]}"`));
  }
  const name = values.get("name");
  if (name === undefined) return null;
  return {
    name,
    defaultNamespace: values.get("default_namespace") ?? defaults.defaultNamespace,
    outputDir: values.get("output_dir") ?? defaults.outputDir,
  };
}
