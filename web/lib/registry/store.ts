"use client";

import { useQuery } from "@tanstack/react-query";
import { api, type FieldOption, type FieldSpec, type ProjectDefaults, type RegistryItem } from "@/lib/api/client";

interface Snapshot {
  items: Map<string, RegistryItem>;
  defaults: ProjectDefaults;
}

let snapshot: Snapshot | null = null;

async function loadRegistry(): Promise<Snapshot> {
  const [registry, defaults] = await Promise.all([api.registry(), api.config()]);
  snapshot = {
    items: new Map(registry.items.map((item) => [item.reference ?? `${item.category}/${item.name}`, item])),
    defaults,
  };
  return snapshot;
}

export function useRegistry() {
  return useQuery({ queryKey: ["kikx-registry"], queryFn: loadRegistry, staleTime: Infinity, retry: 1 });
}

function current(): Snapshot {
  if (!snapshot) throw new Error("The kikx registry hasn't loaded yet — render behind useRegistry().");
  return snapshot;
}

export function projectDefaults(): ProjectDefaults {
  return current().defaults;
}

export function registryItem(reference: string): RegistryItem | undefined {
  return current().items.get(reference);
}

export function fieldSpec(reference: string, name: string): FieldSpec | undefined {
  return registryItem(reference)?.fields.find((f) => f.name === name);
}

export function fieldDefault(reference: string, name: string): string | undefined {
  return fieldSpec(reference, name)?.default ?? undefined;
}

export function fieldNumber(reference: string, name: string): number | undefined {
  const value = fieldDefault(reference, name);
  return value !== undefined && value !== "" && !Number.isNaN(Number(value)) ? Number(value) : undefined;
}

export function fieldExample(reference: string, name: string): string | undefined {
  return fieldSpec(reference, name)?.example ?? undefined;
}

export function fieldOptions(reference: string, name: string): FieldOption[] {
  return fieldSpec(reference, name)?.options ?? [];
}

function templateHint(template: string): string {
  return template
    .replace(/\{%\s*if\s+(\w+)[^%]*%\}\{\{\s*\1\s*\}\}\/\{%\s*endif\s*%\}/g, "[<$1>/]")
    .replace(/\{%[^%]*%\}/g, "")
    .replace(/\{\{\s*(\w+)\s*\}\}/g, "<$1>");
}

export function writesHint(reference: string): string {
  const files = registryItem(reference)?.files ?? [];
  if (files.length === 0) return "defined by the item";
  if (files.length === 1) return templateHint(files[0]);
  const hints = files.map(templateHint);
  let prefix = hints[0];
  for (const hint of hints) while (!hint.startsWith(prefix)) prefix = prefix.slice(0, -1);
  return `${prefix}…`;
}
