import type { RenderRequest } from "@/lib/api-client";
import { fieldDefault, fieldNumber } from "@/lib/registry";
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
  roleFormSchema,
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
  role: roleFormSchema,
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
  role: "ansible/role",
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
type RoleValues = z.infer<typeof roleFormSchema>;
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
  | CommonRoleValues
  | RoleValues;

export function emptyPlay(): PlayValues {
  return { name: "", hosts: "", roles: [], tags: [], become: true, conditions: {}, preTasks: "", postTasks: "" };
}

/** Empty form values; every non-empty default comes from the backend registry. */
export function defaultsFor(kind: ComponentKind): FormValues {
  const ref = REFERENCES[kind];
  const num = (field: string) => fieldNumber(ref, field) as number;
  const str = (field: string) => fieldDefault(ref, field) ?? "";
  switch (kind) {
    case "deployment":
      return { component: kind, name: "", namespace: "", labels: [], image: str("image"), replicas: num("replicas"), port: num("port") };
    case "service":
      return { component: kind, name: "", namespace: "", labels: [], port: num("port"), targetPort: fieldNumber(ref, "target_port") };
    case "ingress":
      return { component: kind, name: "", namespace: "", labels: [], host: str("host"), path: str("path"), service: str("service"), port: num("port") };
    case "digitalocean":
    case "hetzner":
      return { component: kind, name: "", region: str("region"), size: str("size"), osImage: str("os_image"), count: num("count") };
    case "ansible":
      return { component: kind, name: "", hosts: str("hosts"), k8sVersion: str("k8s_version") };
    case "inventory":
      return {
        component: kind,
        name: "",
        hosts: [{ name: "", ansibleHost: "", groups: [], ansibleUser: "", ansiblePort: undefined, sshKeyFile: "", vars: "" }],
        groups: [],
      };
    case "groupvars":
      return {
        component: kind,
        group: "",
        mode: "fields",
        layout: str("layout") === "dir" ? "dir" : "file",
        vars: [{ key: "", value: "" }],
        yaml: "",
      };
    case "playbook":
      return { component: kind, name: "", folder: str("folder"), plays: [emptyPlay()] };
    case "site":
      return { component: kind, name: "", imports: [] };
    case "commonrole":
      return { component: kind, name: "", timezone: str("timezone") };
    case "role":
      return { component: kind, name: "", description: str("description") };
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
        // a skeleton or common role always writes several files; anything else is a one-file playbook

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

/** A play as the playbook template takes it: roles are plain names or `{ role, when }`. */
interface RenderedPlay {
  name?: string;
  hosts?: string;
  become?: boolean;
  tags?: string[];
  roles?: (string | { role: string; when?: string })[];
  pre_tasks?: string;
  post_tasks?: string;
}

export function playsFromRecipe(recipe: PresetComponent): PlayValues[] {
  const plays = parseJson<RenderedPlay[] | null>(recipe.fields.plays, null);
  if (Array.isArray(plays)) {
    return plays.map((p) => {
      const conditions: Record<string, string> = {};
      const roles = (p.roles ?? []).map((r) => {
        if (typeof r === "string") return r;
        if (r.when) conditions[r.role] = r.when;
        return r.role;
      });
      return {
        name: p.name ?? recipe.name,
        hosts: p.hosts ?? "",
        roles,
        tags: p.tags ?? [],
        become: p.become ?? true,
        conditions,
        preTasks: p.pre_tasks ?? "",
        postTasks: p.post_tasks ?? "",
      };
    });
  }
  return [
    {
      name: recipe.name,
      hosts: recipe.fields.hosts ?? "",
      roles: parseJson<string[]>(recipe.fields.roles, []),
      tags: [],
      become: true,
      conditions: {},
      preTasks: "",
      postTasks: "",
    },
  ];
}

function toRenderedPlay(play: PlayValues, fallbackName: string): RenderedPlay {
  return {
    name: play.name || fallbackName,
    hosts: play.hosts,
    become: play.become,
    tags: play.tags,
    roles: play.roles.map((role) => {
      const when = play.conditions?.[role]?.trim();
      return when ? { role, when } : role;
    }),
    ...(play.preTasks?.trim() ? { pre_tasks: stripYamlDocumentMarker(play.preTasks) } : {}),
    ...(play.postTasks?.trim() ? { post_tasks: stripYamlDocumentMarker(play.postTasks) } : {}),
  };
}

function stripYamlDocumentMarker(yaml: string): string {
  return yaml.replace(/^\s*---\s*\n/, "");
}

export function toRenderRequest(defaultNamespace: string, values: FormValues): RenderRequest {
  if (values.component === "groupvars") {
    const fields: Record<string, string> = { group: values.group };
    if (values.layout === "dir") fields.layout = "dir";
    if (values.mode === "yaml") {
      fields.yaml = stripYamlDocumentMarker(values.yaml ?? "");
    } else {
      const vars: Record<string, string> = {};
      for (const v of values.vars) if (v.key) vars[v.key] = v.value;
      fields.vars = JSON.stringify(vars);
    }
    // The folder layout gets its own name so both layouts can coexist as separate components.
    const name = values.layout === "dir" ? `${values.group}/main` : values.group;
    return { reference: REFERENCES.groupvars, name, defaultNamespace, fields };
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
          plays: JSON.stringify(values.plays.map((p) => toRenderedPlay(p, values.name))),
          ...(values.folder ? { folder: values.folder.replace(/\/+$/, "") } : {}),
        },
      };
    case "site":
      return { ...base, fields: { playbooks: JSON.stringify(values.imports) } };
    case "commonrole":
      return { ...base, fields: { timezone: values.timezone } };
    case "role":
      return { ...base, fields: { description: values.description ?? "" } };
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
  // Fields missing from an older recipe take the registry default, never a literal.
  const num = (raw: string | undefined, field: string) =>
    raw && !Number.isNaN(Number(raw)) ? Number(raw) : (fieldNumber(recipe.reference, field) as number);
  const str = (raw: string | undefined, field: string) => raw ?? fieldDefault(recipe.reference, field) ?? "";

  switch (kind) {
    case "deployment":
      return {
        component: kind,
        name: recipe.name,
        namespace: f.namespace ?? "",
        labels,
        image: f.image ?? "",
        replicas: num(f.replicas, "replicas"),
        port: num(f.port, "port"),
      };
    case "service":
      return {
        component: kind,
        name: recipe.name,
        namespace: f.namespace ?? "",
        labels,
        port: num(f.port, "port"),
        targetPort: f.target_port ? Number(f.target_port) : undefined,
      };
    case "ingress":
      return {
        component: kind,
        name: recipe.name,
        namespace: f.namespace ?? "",
        labels,
        host: f.host ?? "",
        path: str(f.path, "path"),
        service: f.service ?? "",
        port: num(f.port, "port"),
      };
    case "digitalocean":
    case "hetzner":
      return {
        component: kind,
        name: recipe.name,
        region: f.region ?? "",
        size: f.size ?? "",
        osImage: str(f.os_image, "os_image"),
        count: num(f.count, "count"),
      };
    case "ansible":
      return { component: kind, name: recipe.name, hosts: f.hosts ?? "", k8sVersion: f.k8s_version ?? "" };
    case "inventory": {
      const { hosts, groups } = entriesToFormValues(parseInventoryEntries(f.hosts), {
        user: str(f.default_user, "default_user"),
        port: num(f.default_port, "default_port"),
      });
      return { component: kind, name: recipe.name, hosts, groups };
    }
    case "groupvars": {
      const layout = f.layout === "dir" ? "dir" : "file";
      if (f.yaml) return { component: kind, group: f.group ?? recipe.name, mode: "yaml", layout, vars: [], yaml: f.yaml };
      const vars = Object.entries(parseJson<Record<string, unknown>>(f.vars, {})).map(([key, value]) => ({
        key,
        value: String(value),
      }));
      return { component: kind, group: f.group ?? recipe.name, mode: "fields", layout, vars, yaml: "" };
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
      return { component: kind, name: recipe.name, timezone: str(f.timezone, "timezone") };
    case "role":
      return { component: kind, name: recipe.name, description: f.description ?? "" };
  }
}
