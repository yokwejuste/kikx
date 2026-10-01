import { flagValue, hasFlag, keyValues, parseLine, type KikxCommand } from "./parse.ts";
import { COMMANDS } from "./spec.ts";
import { closestName } from "./suggest.ts";
import { ancestors, baseName, escapes, joinPath, normalizePath } from "./paths.ts";
import {
  addOutput,
  applyOutput,
  availableOutput,
  errorOutput,
  helpOutput,
  initOutput,
  installedOutput,
  kikxToml,
  latestOutput,
  listOutput,
  presetsOutput,
  readKikxToml,
  setupOutput,
  textLines,
  tipOutput,
  upgradedOutput,
  usageOutput,
  versionOutput,
  type ListedComponent,
  type ListedPreset,
  type OutputLine,
  type ProjectConfig,
} from "./format.ts";

export const CONFIG_FILE = "kikx.toml";

export interface CliMachine {
  files: Record<string, string>;
  dirs: string[];
  version: string | null;
}

export interface RenderInput {
  reference: string;
  name: string;
  fields: Record<string, string>;
  labels: Record<string, string>;
  defaultNamespace: string;
}

export interface WrittenFile {
  path: string;
  content: string;
}

export interface EngineDeps {
  folder: string;
  defaultNamespace: string;
  defaultOutputDir: string;
  registry: () => Promise<ListedComponent[]>;
  presets: () => Promise<ListedPreset[]>;
  preset: (name: string) => Promise<unknown>;
  fetchJson: (url: string) => Promise<unknown>;
  render: (input: RenderInput) => Promise<WrittenFile[]>;
  releases: () => Promise<string[]>;
  errorMessage: (error: unknown) => string;
}

export interface RunResult {
  machine: CliMachine;
  lines: OutputLine[];
  written: string[];
  clear?: boolean;
}

interface PresetManifest {
  project?: { name?: string; namespace?: string; outputDir?: string };
  components: { reference: string; name: string; fields?: Record<string, string>; labels?: Record<string, string> }[];
}

class CliError extends Error {}

const fail = (message: string): never => {
  throw new CliError(message);
};

export const emptyMachine = (): CliMachine => ({ files: {}, dirs: [], version: null });

export const cwdOf = (folder: string): string => `~/${folder}`;

const COMMON_FIELDS: [string, string][] = [
  ["image", "image"],
  ["replicas", "replicas"],
  ["port", "port"],
  ["target-port", "target_port"],
  ["namespace", "namespace"],
  ["host", "host"],
  ["path", "path"],
  ["service", "service"],
];

export function isDirectory(machine: CliMachine, path: string): boolean {
  const normalized = normalizePath(path);
  if (normalized === "") return true;
  return machine.dirs.includes(normalized) || Object.keys(machine.files).some((file) => file.startsWith(`${normalized}/`));
}

export function listDirectory(machine: CliMachine, path: string): string[] {
  const prefix = normalizePath(path);
  const inside = (entry: string) => (prefix === "" ? entry : entry.startsWith(`${prefix}/`) ? entry.slice(prefix.length + 1) : null);
  const names = new Set<string>();
  for (const entry of [...machine.dirs, ...Object.keys(machine.files)]) {
    const rest = inside(entry);
    if (!rest) continue;
    const [first, ...deeper] = rest.split("/");
    names.add(deeper.length > 0 || machine.dirs.includes(joinPath(prefix, first)) ? `${first}/` : first);
  }
  return [...names].sort();
}

function withDirs(dirs: string[], paths: string[]): string[] {
  return [...new Set([...dirs, ...paths.flatMap(ancestors)])].sort();
}

function writeAll(machine: CliMachine, files: WrittenFile[], force: boolean, display: (path: string) => string): CliMachine {
  const seen = new Set<string>();
  for (const file of files) {
    if (escapes(file.path)) fail(`refusing to write \`${file.path}\`: it escapes the target directory`);
    if (seen.has(file.path)) fail(`two files rendered to the same path: \`${file.path}\``);
    seen.add(file.path);
  }
  for (const file of files) {
    const exists = machine.files[file.path] !== undefined || isDirectory(machine, file.path);
    if (exists && !force) fail(`${display(file.path)} already exists. Pass --force to overwrite`);
  }
  const written = Object.fromEntries(files.map((file) => [file.path, file.content]));
  return {
    ...machine,
    files: { ...machine.files, ...written },
    dirs: withDirs(machine.dirs, files.map((file) => file.path)),
  };
}

function readManifest(parsed: unknown, reference: string): PresetManifest {
  const manifest = parsed as PresetManifest | null;
  const valid =
    !!manifest &&
    typeof manifest === "object" &&
    Array.isArray(manifest.components) &&
    manifest.components.every((component) => typeof component?.reference === "string" && typeof component?.name === "string");
  if (!valid) fail(`${reference} is not a valid kikx preset manifest`);
  return manifest as PresetManifest;
}

class Run {
  private machine: CliMachine;
  private readonly deps: EngineDeps;
  private readonly cwd: string;
  tip: string | null = null;

  constructor(machine: CliMachine, deps: EngineDeps) {
    this.machine = machine;
    this.deps = deps;
    this.cwd = cwdOf(deps.folder);
  }

  private readonly display = (path: string) => (path ? `${this.cwd}/${path}` : this.cwd);

  result(lines: OutputLine[], written: string[] = []): RunResult {
    return { machine: this.machine, lines, written };
  }

  private config(): ProjectConfig | null {
    const text = this.machine.files[CONFIG_FILE];
    if (text === undefined) return null;
    return readKikxToml(text, { defaultNamespace: this.deps.defaultNamespace, outputDir: this.deps.defaultOutputDir });
  }

  private ensureNoConfig(force: boolean): void {
    if (this.machine.files[CONFIG_FILE] !== undefined && !force) {
      fail(`${CONFIG_FILE} already exists in ${this.cwd}. Pass --force to overwrite`);
    }
  }

  private saveConfig(config: ProjectConfig): void {
    this.machine = {
      ...this.machine,
      files: { ...this.machine.files, [CONFIG_FILE]: kikxToml(config) },
      dirs: config.outputDir ? withDirs([...this.machine.dirs, config.outputDir], [config.outputDir]) : this.machine.dirs,
    };
  }

  private write(files: WrittenFile[], force: boolean): string[] {
    this.machine = writeAll(this.machine, files, force, this.display);
    return files.map((file) => file.path);
  }

  private async resolvePreset(reference: string): Promise<PresetManifest> {
    const templates = await this.deps.presets();
    if (templates.some((template) => template.name === reference)) {
      return readManifest(await this.deps.preset(reference), reference);
    }
    if (/^https?:\/\//.test(reference)) {
      const fetched = await this.deps.fetchJson(reference).catch(() => fail(`failed to fetch kikx preset manifest from ${reference}`));
      return readManifest(fetched, reference);
    }
    const text = this.machine.files[normalizePath(reference)];
    if (text === undefined) {
      this.tip = closestName(reference, templates.map((template) => template.name));
      fail(`\`${reference}\` isn't a template name, a URL or an existing local file. Run \`kikx presets\` to see the templates`);
    }
    let parsed: unknown = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      fail(`${reference} is not a valid kikx preset manifest`);
    }
    return readManifest(parsed, reference);
  }

  private async renderManifest(manifest: PresetManifest, namespace: string, base: string): Promise<WrittenFile[]> {
    const rendered = await Promise.all(
      manifest.components.map((component) =>
        this.deps.render({
          reference: component.reference,
          name: component.name,
          fields: component.fields ?? {},
          labels: component.labels ?? {},
          defaultNamespace: namespace,
        }),
      ),
    );
    return rendered.flat().map((file) => ({ path: joinPath(base, file.path), content: file.content }));
  }

  private async installed(): Promise<{ current: string; releases: string[] }> {
    const releases = await this.deps.releases().catch(() => fail("failed to read the kikx releases"));
    if (releases.length === 0) fail("failed to read the kikx releases");
    const current = this.machine.version ?? releases[1] ?? releases[0];
    this.machine = { ...this.machine, version: current };
    return { current, releases };
  }

  async version(): Promise<RunResult> {
    const { current } = await this.installed();
    return this.result(versionOutput(current));
  }

  async init(command: KikxCommand): Promise<RunResult> {
    this.ensureNoConfig(hasFlag(command, "force"));
    const name = flagValue(command, "name") ?? this.deps.folder;
    this.saveConfig({
      name,
      defaultNamespace: flagValue(command, "namespace") ?? this.deps.defaultNamespace,
      outputDir: normalizePath(flagValue(command, "dir") ?? this.deps.defaultOutputDir),
    });
    return this.result(initOutput(name), [CONFIG_FILE]);
  }

  async add(command: KikxCommand): Promise<RunResult> {
    const config = this.config() ?? fail(`no ${CONFIG_FILE} found in ${this.cwd}. Run \`kikx init\` first`);
    const common = COMMON_FIELDS.flatMap(([flag, field]): [string, string][] => {
      const value = flagValue(command, flag);
      return value === undefined ? [] : [[field, value]];
    });
    const reference = command.positional ?? "";
    const rendered = await this.deps
      .render({
        reference,
        name: flagValue(command, "name") ?? "",
        fields: Object.fromEntries([...common, ...keyValues(command, "set")]),
        labels: Object.fromEntries(keyValues(command, "label")),
        defaultNamespace: config.defaultNamespace,
      })
      .catch(async (error: unknown) => {
        this.tip = await this.componentTip(reference);
        throw error;
      });
    const files = rendered.map((file) => ({ path: joinPath(config.outputDir, file.path), content: file.content }));
    const written = this.write(files, hasFlag(command, "force"));
    return this.result(addOutput(written.map(this.display)), written);
  }

  private async componentTip(reference: string): Promise<string | null> {
    if (/^https?:\/\//.test(reference) || this.machine.files[normalizePath(reference)] !== undefined) return null;
    const components = await this.deps.registry().catch(() => []);
    return closestName(reference, components.map((component) => component.reference));
  }

  async list(): Promise<RunResult> {
    return this.result(listOutput(await this.deps.registry()));
  }

  async presets(): Promise<RunResult> {
    return this.result(presetsOutput(await this.deps.presets()));
  }

  async setup(command: KikxCommand): Promise<RunResult> {
    const force = hasFlag(command, "force");
    this.ensureNoConfig(force);
    const manifest = await this.resolvePreset(command.positional ?? "");
    const project = manifest.project;
    const config: ProjectConfig = {
      name: project?.name || this.deps.folder,
      defaultNamespace: project?.namespace || this.deps.defaultNamespace,
      outputDir: normalizePath(project?.outputDir || this.deps.defaultOutputDir),
    };
    const files = await this.renderManifest(manifest, config.defaultNamespace, config.outputDir);
    const written = this.write(files, force);
    this.saveConfig(config);
    return this.result(setupOutput(config.name, this.display(config.outputDir), written.map(this.display)), written);
  }

  async apply(command: KikxCommand): Promise<RunResult> {
    const manifest = await this.resolvePreset(command.positional ?? "");
    const namespace = manifest.project?.namespace || this.deps.defaultNamespace;
    const files = await this.renderManifest(manifest, namespace, normalizePath(flagValue(command, "into") ?? ""));
    const written = this.write(files, hasFlag(command, "force"));
    return this.result(applyOutput(written.map(this.display)), written);
  }

  async upgrade(command: KikxCommand): Promise<RunResult> {
    const { current, releases } = await this.installed();
    const wanted = flagValue(command, "version")?.replace(/^v/, "");
    const target = wanted ?? (compareVersions(releases[0], current) > 0 ? releases[0] : null);
    if (target === null) return this.result(latestOutput(current));
    if (target === current) return this.result(installedOutput(current));
    if (hasFlag(command, "check")) return this.result(availableOutput(target, current));
    if (!releases.includes(target)) fail("the upgrade failed");
    this.machine = { ...this.machine, version: target };
    return this.result(upgradedOutput(current, target));
  }

  shell(program: string, args: string[]): RunResult {
    if (program === "clear") return { ...this.result([]), clear: true };
    const targets = args.length > 0 ? args : program === "ls" ? [""] : [];
    const lines = targets.flatMap((target): OutputLine[] => {
      const path = normalizePath(target);
      const file = this.machine.files[path];
      if (file !== undefined) return program === "cat" ? textLines(file) : [[{ text: baseName(path) }]];
      if (!isDirectory(this.machine, path)) return [[{ text: `${program}: ${target}: No such file or directory` }]];
      if (program === "cat") return [[{ text: `cat: ${target}: Is a directory` }]];
      const entries = listDirectory(this.machine, path);
      return entries.length > 0 ? [[{ text: entries.join("  ") }]] : [];
    });
    return this.result(lines);
  }
}

export function compareVersions(left: string, right: string): number {
  const parts = (version: string) => version.replace(/^v/, "").split(/[.-]/).map((part) => Number.parseInt(part, 10) || 0);
  const [a, b] = [parts(left), parts(right)];
  for (let index = 0; index < Math.max(a.length, b.length); index++) {
    const difference = (a[index] ?? 0) - (b[index] ?? 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

function subcommandTip(unknown: string | undefined): string | null {
  return unknown === undefined ? null : closestName(unknown, [...COMMANDS.map((command) => command.name), "help"]);
}

export async function runLine(input: string, machine: CliMachine, deps: EngineDeps): Promise<RunResult> {
  const parsed = parseLine(input);
  const run = new Run(machine, deps);
  try {
    switch (parsed.kind) {
      case "empty":
        return run.result([]);
      case "help":
        return run.result(helpOutput());
      case "usage":
        return run.result([...usageOutput(parsed.message, parsed.details), ...tipOutput(subcommandTip(parsed.unknown))]);
      case "foreign":
        return run.result([{ notice: "foreign" }]);
      case "shell":
        return run.shell(parsed.program, parsed.args);
      case "version":
        return await run.version();
      case "kikx": {
        const commands: Record<string, (command: KikxCommand) => Promise<RunResult>> = {
          init: (command) => run.init(command),
          add: (command) => run.add(command),
          list: () => run.list(),
          presets: () => run.presets(),
          setup: (command) => run.setup(command),
          apply: (command) => run.apply(command),
          upgrade: (command) => run.upgrade(command),
        };
        return await commands[parsed.command](parsed);
      }
    }
  } catch (error) {
    return {
      machine,
      lines: [...errorOutput(error instanceof CliError ? error.message : deps.errorMessage(error)), ...tipOutput(run.tip)],
      written: [],
    };
  }
}
