import { api } from "@/lib/api/client";
import { downloadBlob } from "@/lib/download";
import { toRenderRequest, type FormValues } from "@/lib/forms/component-forms";
import { componentId, type AddedComponent, type ProjectDetails } from "@/lib/project/context";
import { projectDefaults } from "@/lib/registry/store";

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
  return `${details.name || projectDefaults().defaultProjectName}.kikx-preset.json`;
}

function buildPresetManifest(details: ProjectDetails, components: AddedComponent[]) {
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
  downloadBlob(new Blob([JSON.stringify(manifest, null, 2)], { type: "application/json" }), presetFileName(details));
}

export interface PresetManifest {
  name?: string;
  project?: Partial<ProjectDetails>;
  components: PresetComponent[];
}

export function toPresetManifest(parsed: unknown): PresetManifest {
  const manifest = parsed as { name?: string; project?: Partial<ProjectDetails>; components?: unknown };
  if (!manifest || typeof manifest !== "object" || !Array.isArray(manifest.components)) {
    throw new Error("That isn't a kikx preset — it has no components list.");
  }
  const components: PresetComponent[] = manifest.components.map((c: Partial<PresetComponent>, i: number) => {
    if (typeof c?.reference !== "string" || typeof c?.name !== "string") {
      throw new Error(`Component #${i + 1} is missing a reference or name.`);
    }
    return { reference: c.reference, name: c.name, fields: c.fields ?? {}, labels: c.labels ?? {} };
  });
  return { name: manifest.name, project: manifest.project, components };
}

export function parsePresetManifest(text: string): PresetManifest {
  return toPresetManifest(JSON.parse(text));
}

export async function loadPresetManifest(
  manifest: PresetManifest,
  fallbackName: string,
): Promise<{ details: ProjectDetails; components: AddedComponent[] }> {
  const defaults = projectDefaults();
  const namespace = manifest.project?.namespace || defaults.defaultNamespace;
  const components = await Promise.all(
    manifest.components.map(async (recipe): Promise<AddedComponent> => {
      const rendered = await api.render({
        reference: recipe.reference,
        name: recipe.name,
        fields: recipe.fields,
        labels: Object.entries(recipe.labels).map(([key, value]) => ({ key, value })),
        defaultNamespace: namespace,
      });
      return {
        id: componentId(recipe),
        recipe,
        files: rendered.files.map((f) => ({ fileName: f.path, component: rendered.component, content: f.content })),
      };
    }),
  );
  return {
    details: {
      name: manifest.project?.name || manifest.name || fallbackName,
      namespace,
      outputDir: manifest.project?.outputDir || defaults.defaultOutputDir,
    },
    components,
  };
}
