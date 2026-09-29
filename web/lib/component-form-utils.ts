import type { RenderRequest } from "@/lib/api-client";
import { OS_IMAGES } from "@/lib/os-images";
import { buildInventoryGroups, entriesToFormValues, parseInventoryEntries } from "@/lib/inventory-utils";
import type { PresetComponent } from "@/lib/preset";
import {
  deploymentFormSchema,
  serviceFormSchema,
  ingressFormSchema,
  digitalOceanFormSchema,
  hetznerFormSchema,
  ansibleFormSchema,
  inventoryFormSchema,
  groupVarsFormSchema,
  playbookFormSchema,
  siteFormSchema,
  commonRoleFormSchema,
  type ComponentKind,
  type PlayValues,
} from "@/lib/schemas";
import type { z } from "zod";

export const schemas = {
  deployment: deploymentFormSchema,
  service: serviceFormSchema,
  ingress: ingressFormSchema,
  digitalocean: digitalOceanFormSchema,
  hetzner: hetznerFormSchema,
  ansible: ansibleFormSchema,
  inventory: inventoryFormSchema,
  groupvars: groupVarsFormSchema,
  playbook: playbookFormSchema,
  site: siteFormSchema,
  commonrole: commonRoleFormSchema,
};

export const REFERENCES: Record<ComponentKind, string> = {
  deployment: "k8s/deployment",
  service: "k8s/service",
  ingress: "k8s/ingress",
  digitalocean: "terraform/digitalocean",
  hetzner: "terraform/hetzner",
  ansible: "ansible/k8s-bootstrap",
  inventory: "ansible/inventory",
  groupvars: "ansible/group-vars",
  playbook: "ansible/playbook",
  site: "ansible/site",
  commonrole: "ansible/common-role",
};

export function kindForReference(reference: string): ComponentKind | null {
  const entry = Object.entries(REFERENCES).find(([, ref]) => ref === reference);
  return entry ? (entry[0] as ComponentKind) : null;
}

export const K8S_KINDS = new Set<ComponentKind>(["deployment", "service", "ingress"]);

type DeploymentValues = z.infer<typeof deploymentFormSchema>;
type ServiceValues = z.infer<typeof serviceFormSchema>;
type IngressValues = z.infer<typeof ingressFormSchema>;
type DigitalOceanValues = z.infer<typeof digitalOceanFormSchema>;
type HetznerValues = z.infer<typeof hetznerFormSchema>;
type AnsibleValues = z.infer<typeof ansibleFormSchema>;
type InventoryValues = z.infer<typeof inventoryFormSchema>;
type GroupVarsValues = z.infer<typeof groupVarsFormSchema>;
type PlaybookValues = z.infer<typeof playbookFormSchema>;
type SiteValues = z.infer<typeof siteFormSchema>;
type CommonRoleValues = z.infer<typeof commonRoleFormSchema>;
export type FormValues =
  | DeploymentValues
  | ServiceValues
  | IngressValues
  | DigitalOceanValues
  | HetznerValues
  | AnsibleValues
  | InventoryValues
  | GroupVarsValues
  | PlaybookValues
  | SiteValues
  | CommonRoleValues;

export function emptyPlay(): PlayValues {
  return { name: "", hosts: "", roles: [], tags: [], become: true };
}

export function defaultsFor(kind: ComponentKind): FormValues {
  switch (kind) {
    case "deployment":
      return { component: "deployment", name: "", namespace: "", labels: [], image: "", replicas: 1, port: 80 };
    case "service":
      return { component: "service", name: "", namespace: "", labels: [], port: 80, targetPort: undefined };
    case "ingress":
      return { component: "ingress", name: "", namespace: "", labels: [], host: "", path: "/", service: "", port: 80 };
    case "digitalocean":
      return { component: "digitalocean", name: "", region: "", size: "", osImage: OS_IMAGES.digitalocean[0].slug, count: 1 };
    case "hetzner":
      return { component: "hetzner", name: "", region: "", size: "", osImage: OS_IMAGES.hetzner[0].slug, count: 1 };
    case "ansible":
      return { component: "ansible", name: "", hosts: "", k8sVersion: "" };
    case "inventory":
      return {
        component: "inventory",
        name: "inventory",
        hosts: [
          { name: "", ansibleHost: "", groups: [], ansibleUser: "", ansiblePort: undefined, sshKeyFile: "", vars: "" },
        ],
        groups: [],
      };
    case "groupvars":
      return { component: "groupvars", group: "", mode: "fields", vars: [{ key: "", value: "" }], yaml: "" };
    case "playbook":
      return { component: "playbook", name: "", folder: "playbooks", plays: [emptyPlay()] };
    case "site":
      return { component: "site", name: "site", imports: [] };
    case "commonrole":
      return { component: "commonrole", name: "common", timezone: "UTC" };
  }
}

/** Roles this project vendors itself (multi-file Ansible components). */
export function extractAvailableRoleNames(
  components: { recipe: { reference: string; name: string }; files: unknown[] }[],
): string[] {
  return components
    .filter(
      (c) =>
        c.recipe.reference.startsWith("ansible/") &&
        !["ansible/inventory", "ansible/group-vars", "ansible/playbook", "ansible/site"].includes(c.recipe.reference) &&
        c.files.length > 1,
    )
    .map((c) => c.recipe.name);
}

/** Every role name referenced anywhere in the project's playbooks — handy as suggestions. */
export function extractReferencedRoleNames(components: { recipe: PresetComponent }[]): string[] {
  const names = new Set<string>();
  for (const c of components) {
    if (c.recipe.reference !== "ansible/playbook") continue;
    for (const play of playsFromRecipe(c.recipe)) play.roles.forEach((r) => names.add(r));
  }
  return Array.from(names);
}

export function playbookPath(name: string, folder?: string): string {
  return folder ? `${folder.replace(/\/+$/, "")}/${name}.yml` : `${name}.yml`;
}

function parseJson<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function playsFromRecipe(recipe: PresetComponent): PlayValues[] {
  const plays = parseJson<PlayValues[] | null>(recipe.fields.plays, null);
  if (Array.isArray(plays)) {
    return plays.map((p) => ({
      name: p.name ?? recipe.name,
      hosts: p.hosts ?? "",
      roles: p.roles ?? [],
      tags: p.tags ?? [],
      become: p.become ?? true,
    }));
  }
  return [
    {
      name: recipe.name,
      hosts: recipe.fields.hosts ?? "",
      roles: parseJson<string[]>(recipe.fields.roles, []),
      tags: [],
      become: true,
    },
  ];
}

function stripYamlDocumentMarker(yaml: string): string {
  return yaml.replace(/^\s*---\s*\n/, "");
}

export function toRenderRequest(defaultNamespace: string, values: FormValues): RenderRequest {
  if (values.component === "groupvars") {
    const fields: Record<string, string> = { group: values.group };
    if (values.mode === "yaml") {
      fields.yaml = stripYamlDocumentMarker(values.yaml ?? "");
    } else {
      const vars: Record<string, string> = {};
      for (const v of values.vars) if (v.key) vars[v.key] = v.value;
      fields.vars = JSON.stringify(vars);
    }
    return { reference: REFERENCES.groupvars, name: values.group, defaultNamespace, fields };
  }

  const base: RenderRequest = { reference: REFERENCES[values.component], name: values.name, defaultNamespace };

  switch (values.component) {
    case "deployment":
      return {
        ...base,
        namespace: values.namespace || undefined,
        labels: values.labels,
        image: values.image,
        replicas: values.replicas,
        port: values.port,
      };
    case "service":
      return {
        ...base,
        namespace: values.namespace || undefined,
        labels: values.labels,
        port: values.port,
        targetPort: values.targetPort,
      };
    case "ingress":
      return {
        ...base,
        namespace: values.namespace || undefined,
        labels: values.labels,
        host: values.host || undefined,
        path: values.path,
        service: values.service || undefined,
        port: values.port,
      };
    case "digitalocean":
    case "hetzner":
      return {
        ...base,
        fields: { region: values.region, size: values.size, os_image: values.osImage, count: values.count.toString() },
      };
    case "ansible":
      return { ...base, fields: { hosts: values.hosts, k8s_version: values.k8sVersion } };
    case "playbook":
      return {
        ...base,
        fields: {
          plays: JSON.stringify(values.plays.map((p) => ({ ...p, name: p.name || values.name }))),
          ...(values.folder ? { folder: values.folder.replace(/\/+$/, "") } : {}),
        },
      };
    case "site":
      return { ...base, fields: { playbooks: JSON.stringify(values.imports) } };
    case "commonrole":
      return { ...base, fields: { timezone: values.timezone } };
    case "inventory":
      return { ...base, fields: { hosts: JSON.stringify(buildInventoryGroups(values.hosts, values.groups)) } };
  }
}

/**
 * Rebuilds editable form values from a saved recipe, so anything in the project — including
 * components loaded from a preset — can be reopened and changed. Returns null for
 * references the built-in forms don't cover (custom registry items).
 */
export function recipeToFormValues(recipe: PresetComponent): FormValues | null {
  const kind = kindForReference(recipe.reference);
  if (!kind) return null;
  const f = recipe.fields;
  const labels = Object.entries(recipe.labels ?? {}).map(([key, value]) => ({ key, value }));
  const num = (raw: string | undefined, fallback: number) => (raw && !Number.isNaN(Number(raw)) ? Number(raw) : fallback);

  switch (kind) {
    case "deployment":
      return {
        component: kind,
        name: recipe.name,
        namespace: f.namespace ?? "",
        labels,
        image: f.image ?? "",
        replicas: num(f.replicas, 1),
        port: num(f.port, 80),
      };
    case "service":
      return {
        component: kind,
        name: recipe.name,
        namespace: f.namespace ?? "",
        labels,
        port: num(f.port, 80),
        targetPort: f.target_port ? Number(f.target_port) : undefined,
      };
    case "ingress":
      return {
        component: kind,
        name: recipe.name,
        namespace: f.namespace ?? "",
        labels,
        host: f.host ?? "",
        path: f.path ?? "/",
        service: f.service ?? "",
        port: num(f.port, 80),
      };
    case "digitalocean":
    case "hetzner":
      return {
        component: kind,
        name: recipe.name,
        region: f.region ?? "",
        size: f.size ?? "",
        osImage: f.os_image ?? OS_IMAGES[kind][0].slug,
        count: num(f.count, 1),
      };
    case "ansible":
      return { component: kind, name: recipe.name, hosts: f.hosts ?? "", k8sVersion: f.k8s_version ?? "" };
    case "inventory": {
      const { hosts, groups } = entriesToFormValues(parseInventoryEntries(f.hosts));
      return { component: kind, name: recipe.name, hosts, groups };
    }
    case "groupvars": {
      if (f.yaml) return { component: kind, group: f.group ?? recipe.name, mode: "yaml", vars: [], yaml: f.yaml };
      const vars = Object.entries(parseJson<Record<string, unknown>>(f.vars, {})).map(([key, value]) => ({
        key,
        value: String(value),
      }));
      return { component: kind, group: f.group ?? recipe.name, mode: "fields", vars, yaml: "" };
    }
    case "playbook":
      return { component: kind, name: recipe.name, folder: f.folder ?? "", plays: playsFromRecipe(recipe) };
    case "site":
      return {
        component: kind,
        name: recipe.name,
        imports: parseJson<{ name: string; path: string }[]>(f.playbooks, []),
      };
    case "commonrole":
      return { component: kind, name: recipe.name, timezone: f.timezone ?? "UTC" };
  }
}
