import { useSyncExternalStore } from "react";
import { api } from "@/lib/api/client";
import { presetFileName, presetJson, toPresetManifest } from "@/lib/project/preset";
import { projectDefaults } from "@/lib/registry/store";
import { emptyMachine, runLine, type CliMachine, type EngineDeps } from "@/lib/teach/cli/engine";
import type { OutputLine } from "@/lib/teach/cli/format";
import { kikxReleases } from "@/lib/teach/cli/releases";

export interface CliEntry {
  id: number;
  command: string;
  lines: OutputLine[];
  running: boolean;
}

export interface CliSnapshot {
  machine: CliMachine;
  entries: CliEntry[];
  ran: string[];
  busy: boolean;
  selected: string | null;
}

const initial = (): CliSnapshot => ({ machine: emptyMachine(), entries: [], ran: [], busy: false, selected: null });

let snapshot = initial();
let nextId = 1;
const listeners = new Set<() => void>();

function update(change: (current: CliSnapshot) => CliSnapshot): void {
  snapshot = change(snapshot);
  for (const listener of listeners) listener();
}

function engineDeps(): EngineDeps {
  const defaults = projectDefaults();
  return {
    folder: defaults.defaultProjectName,
    defaultNamespace: defaults.defaultNamespace,
    defaultOutputDir: defaults.defaultOutputDir,
    registry: async () =>
      (await api.registry()).items.map((item) => ({ ...item, reference: item.reference ?? `${item.category}/${item.name}` })),
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

  select(path: string): void {
    update((current) => ({ ...current, selected: path }));
  },

  async execute(command: string): Promise<void> {
    if (snapshot.busy) return;
    const id = nextId++;
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
