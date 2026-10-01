import type { PresetComponent } from "@/lib/project/preset";

export type Labels = Record<string, string>;

export function podLabels(deployment: PresetComponent): Labels {
  return { app: deployment.name };
}

export function serviceSelector(service: PresetComponent): Labels {
  return { app: service.labels.app ?? service.name };
}

export function selects(selector: Labels, labels: Labels): boolean {
  return Object.entries(selector).every(([key, value]) => labels[key] === value);
}

export function formatLabels(labels: Labels): string {
  return Object.entries(labels)
    .map(([key, value]) => `${key}=${value}`)
    .join(", ");
}
