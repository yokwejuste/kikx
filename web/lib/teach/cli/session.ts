import { useSyncExternalStore } from "react";
import { api, type RegistryItem } from "@/lib/api/client";
import { presetFileName, presetJson, toPresetManifest } from "@/lib/project/preset";
import { projectDefaults } from "@/lib/registry/store";
import type { CompletionSources } from "@/lib/teach/cli/complete";
import { emptyMachine, listDirectory, runLine, type CliMachine, type EngineDeps } from "@/lib/teach/cli/engine";
import type { OutputLine } from "@/lib/teach/cli/format";
import { remember } from "@/lib/teach/cli/history";
import { kikxReleases } from "@/lib/teach/cli/releases";

export interface CliEntry {
  id: number;
  command: string;
  lines: OutputLine[];
  running: boolean;
  interrupted?: boolean;
}

export interface CliSnapshot {
  machine: CliMachine;
  entries: CliEntry[];
  ran: string[];
  busy: boolean;
  selected: string | null;
}

const initial = (): CliSnapshot => ({ machine: emptyMachine(), entries: [], ran: [], busy: false, selected: null });

const HISTORY_KEY = "kikx-cli:history";

let snapshot = initial();
let nextId = 1;
const listeners = new Set<() => void>();

function update(change: (current: CliSnapshot) => CliSnapshot): void {
  snapshot = change(snapshot);
  for (const listener of listeners) listener();
}

function loadHistory(): string[] {
  try {
    const stored = JSON.parse(sessionStorage.getItem(HISTORY_KEY) ?? "[]");
    return Array.isArray(stored) ? stored.filter((command): command is string => typeof command === "string") : [];
  } catch {
    return [];
  }
}

function saveHistory(history: string[]): void {
  try {
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    return;
  }
}

const once = <T>(load: () => Promise<T>): (() => Promise<T>) => {
  let pending: Promise<T> | null = null;
  return () => {
    pending ??= load().catch((error: unknown) => {
      pending = null;
      throw error;
    });
    return pending;
  };
};

const templateNames = once(async () => (await api.presets()).map((preset) => preset.name));

const referenceOf = (item: RegistryItem): string => item.reference ?? `${item.category}/${item.name}`;

const componentReferences = once(async () => (await api.registry()).items.map(referenceOf));

function engineDeps(): EngineDeps {
  const defaults = projectDefaults();
  return {
    folder: defaults.defaultProjectName,
    defaultNamespace: defaults.defaultNamespace,
    defaultOutputDir: defaults.defaultOutputDir,
    registry: async () =>
      (await api.registry()).items.map((item) => ({ ...item, reference: referenceOf(item) })),
    presets: () => api.presets(),
    preset: (name) => api.preset(name),
    fetchJson: async (url) => (await fetch(url)).json(),
    render: async (input) =>
      (
        await api.render({
          reference: input.reference,
          name: input.name,
          fields: input.fields,
          labels: Object.entries(input.labels).map(([key, value]) => ({ key, value })),
          defaultNamespace: input.defaultNamespace,
        })
      ).files,
    releases: kikxReleases,
    errorMessage: (error) => (error instanceof Error ? error.message : String(error)),
  };
}

export const cliSession = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  snapshot: (): CliSnapshot => snapshot,

  busy: (): boolean => snapshot.busy,

  ranCount: (): number => snapshot.ran.length,

  ranSince: (count: number): string[] => snapshot.ran.slice(count),

  reset(): void {
    update(initial);
  },

  history: loadHistory,

  completionSources: (): CompletionSources => ({
    templates: templateNames,
    components: componentReferences,
    listDirectory: (path) => listDirectory(snapshot.machine, path),
  }),

  clearScreen(): void {
    update((current) => ({ ...current, entries: [] }));
  },

  echo(command: string, lines: OutputLine[], interrupted = false): void {
    const id = nextId++;
    update((current) => ({ ...current, entries: [...current.entries, { id, command, lines, running: false, interrupted }] }));
  },

  async replay(commands: string[]): Promise<void> {
    update(initial);
    for (const command of commands) await cliSession.execute(command);
  },

  select(path: string): void {
    update((current) => ({ ...current, selected: path }));
  },

  async execute(command: string): Promise<void> {
    if (snapshot.busy) return;
    const id = nextId++;
    saveHistory(remember(loadHistory(), command));
    update((current) => ({
      ...current,
      busy: true,
      ran: [...current.ran, command],
      entries: [...current.entries, { id, command, lines: [], running: true }],
    }));
    const result = await runLine(command, snapshot.machine, engineDeps());
    update((current) => ({
      ...current,
      machine: result.machine,
      busy: false,
      selected: result.written[0] ?? (current.selected && current.selected in result.machine.files ? current.selected : null),
      entries: result.clear
        ? []
        : current.entries.map((entry) => (entry.id === id ? { ...entry, lines: result.lines, running: false } : entry)),
    }));
  },

  async exportPreset(name: string): Promise<void> {
    const manifest = toPresetManifest(await api.preset(name));
    const defaults = projectDefaults();
    const details = {
      name: manifest.project?.name || manifest.name || name,
      namespace: manifest.project?.namespace || defaults.defaultNamespace,
      outputDir: manifest.project?.outputDir || defaults.defaultOutputDir,
    };
    const path = presetFileName(details);
    update((current) => ({
      ...current,
      selected: path,
      machine: { ...current.machine, files: { ...current.machine.files, [path]: presetJson(details, manifest.components) } },
    }));
  },
};

export function useCliSession(): CliSnapshot {
  return useSyncExternalStore(cliSession.subscribe, cliSession.snapshot, cliSession.snapshot);
}
