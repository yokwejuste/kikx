import type { z } from "zod";
import { buildInventoryGroups, entriesToFormValues, parseInventoryEntries } from "@/lib/ansible/inventory";
import { groupVarsRecord } from "@/lib/ansible/group-vars";
import { playsFromRecipe, siteImportsFromRecipe, stripYamlDocumentMarker, toRenderedPlay } from "@/lib/ansible/playbook";
import type { RenderRequest } from "@/lib/api/client";
import type { PresetComponent } from "@/lib/project/preset";
import { kindForReference, REFERENCES, type ComponentKind } from "@/lib/registry/references";
import { fieldDefault, fieldNumber } from "@/lib/registry/store";
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
  ansibleConfigFormSchema,
  type PlayValues,
} from "@/lib/forms/schemas";

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
  ansiblecfg: ansibleConfigFormSchema,
} satisfies Record<ComponentKind, z.ZodTypeAny>;

export type FormValues = z.infer<(typeof schemas)[keyof typeof schemas]>;

export function emptyPlay(): PlayValues {
  return { name: "", hosts: "", roles: [], tags: [], become: true, conditions: {}, preTasks: "", postTasks: "" };
}

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
    case "ansiblecfg":
      return { component: kind, name: "ansible", inventory: str("inventory"), rolesPath: str("roles_path") };
  }
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
    case "ansiblecfg":
      return { ...base, fields: { inventory: values.inventory ?? "", roles_path: values.rolesPath } };
    case "inventory":
      return { ...base, fields: { hosts: JSON.stringify(buildInventoryGroups(values.hosts, values.groups)) } };
  }
}

export function recipeToFormValues(recipe: PresetComponent): FormValues | null {
  const kind = kindForReference(recipe.reference);
  if (!kind) return null;
  const f = recipe.fields;
  const labels = Object.entries(recipe.labels ?? {}).map(([key, value]) => ({ key, value }));
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
      const vars = Object.entries(groupVarsRecord(f.vars)).map(([key, value]) => ({
        key,
        value: String(value),
      }));
      return { component: kind, group: f.group ?? recipe.name, mode: "fields", layout, vars, yaml: "" };
    }
    case "playbook":
      return { component: kind, name: recipe.name, folder: f.folder ?? "", plays: playsFromRecipe(recipe) };
    case "site":
      return { component: kind, name: recipe.name, imports: siteImportsFromRecipe(recipe) };
    case "commonrole":
      return { component: kind, name: recipe.name, timezone: str(f.timezone, "timezone") };
    case "role":
      return { component: kind, name: recipe.name, description: f.description ?? "" };
    case "ansiblecfg":
      return {
        component: kind,
        name: recipe.name,
        inventory: f.inventory ?? "",
        rolesPath: str(f.roles_path, "roles_path"),
      };
  }
}
