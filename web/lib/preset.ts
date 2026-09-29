import type { AddedComponent, ProjectDetails } from "@/lib/project-context";
import { toRenderRequest, type FormValues } from "@/lib/component-form-utils";

export interface PresetComponent {
  reference: string;
  name: string;
  fields: Record<string, string>;
  labels: Record<string, string>;
}

export function toPresetComponent(defaultNamespace: string, values: FormValues): PresetComponent {
  const req = toRenderRequest(defaultNamespace, values);

  const fields: Record<string, string> = { ...(req.fields ?? {}) };
  if (req.image !== undefined) fields.image = req.image;
  if (req.replicas !== undefined) fields.replicas = String(req.replicas);
  if (req.port !== undefined) fields.port = String(req.port);
  if (req.targetPort !== undefined) fields.target_port = String(req.targetPort);
  if (req.namespace !== undefined) fields.namespace = req.namespace;
  if (req.host !== undefined) fields.host = req.host;
  if (req.path !== undefined) fields.path = req.path;
  if (req.service !== undefined) fields.service = req.service;

  const labels: Record<string, string> = {};
  for (const label of req.labels ?? []) {
    if (label.key) labels[label.key] = label.value;
  }

  return { reference: req.reference, name: req.name, fields, labels };
}

export function presetFileName(details: ProjectDetails): string {
  return `${details.name || "kikx-project"}.kikx-preset.json`;
}

export function buildPresetManifest(details: ProjectDetails, components: AddedComponent[]) {
  return {
    name: details.name,
    description: "",
    project: {
      name: details.name,
      namespace: details.namespace,
      outputDir: details.outputDir,
    },
    components: components.map((c) => c.recipe),
  };
}

export function downloadPreset(details: ProjectDetails, components: AddedComponent[]) {
  const manifest = buildPresetManifest(details, components);
  const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = presetFileName(details);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export interface PresetManifest {
  name?: string;
  project?: Partial<ProjectDetails>;
  components: PresetComponent[];
}

export function parsePresetManifest(text: string): PresetManifest {
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.components)) {
    throw new Error("That file isn't a kikx preset — it has no components list.");
  }
  const components: PresetComponent[] = parsed.components.map((c: Partial<PresetComponent>, i: number) => {
    if (typeof c?.reference !== "string" || typeof c?.name !== "string") {
      throw new Error(`Component #${i + 1} is missing a reference or name.`);
    }
    return { reference: c.reference, name: c.name, fields: c.fields ?? {}, labels: c.labels ?? {} };
  });
  return { name: parsed.name, project: parsed.project, components };
}
