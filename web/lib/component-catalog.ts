import {
  Box,
  Braces,
  Cloud,
  Cog,
  Globe,
  ListOrdered,
  ListTree,
  Network,
  Puzzle,
  Rocket,
  ScrollText,
  type LucideIcon,
} from "lucide-react";
import type { ComponentKind } from "@/lib/schemas";
import type { PresetComponent } from "@/lib/preset";
import { kindForReference } from "@/lib/component-form-utils";

/** A form-backed built-in kind, or the free-form "load any registry item" panel. */
export type CatalogKind = ComponentKind | "custom";

export interface CatalogEntry {
  kind: CatalogKind;
  label: string;
  summary: string;
  icon: LucideIcon;
  /** Where the rendered file lands, with placeholders — shown before anything is rendered. */
  writes: string;
}

export interface CatalogStage {
  id: "provision" | "inventory" | "configure" | "deploy" | "custom";
  label: string;
  hint: string;
  entries: CatalogEntry[];
}

export const CATALOG: CatalogStage[] = [
  {
    id: "provision",
    label: "Provision",
    hint: "Optional — skip if the servers already exist.",
    entries: [
      { kind: "hetzner", label: "Hetzner server", summary: "Terraform for Hetzner Cloud servers", icon: Cloud, writes: "<name>-hetzner.tf" },
      { kind: "digitalocean", label: "DigitalOcean droplet", summary: "Terraform for DigitalOcean droplets", icon: Cloud, writes: "<name>-digitalocean.tf" },
    ],
  },
  {
    id: "inventory",
    label: "Inventory",
    hint: "List the servers and sort them into groups.",
    entries: [
      { kind: "inventory", label: "Inventory", summary: "Hosts, groups, nesting and shared vars", icon: ListTree, writes: "<name>-inventory.ini" },
      { kind: "groupvars", label: "Group vars", summary: "Variables for one inventory group", icon: Braces, writes: "group_vars/<group>.yml" },
    ],
  },
  {
    id: "configure",
    label: "Configure",
    hint: "Decide which roles run on which groups.",
    entries: [
      { kind: "playbook", label: "Playbook", summary: "One or more plays: group → roles", icon: ScrollText, writes: "<folder>/<name>.yml" },
      { kind: "site", label: "Site playbook", summary: "Imports your playbooks in order", icon: ListOrdered, writes: "<name>.yml" },
      { kind: "commonrole", label: "Common role", summary: "A starter host-hygiene role", icon: Cog, writes: "roles/<name>/…" },
      { kind: "ansible", label: "K8s bootstrap", summary: "Installs containerd + kubeadm", icon: Rocket, writes: "<name>-k8s-bootstrap.yml" },
    ],
  },
  {
    id: "deploy",
    label: "Deploy",
    hint: "Kubernetes manifests for what runs on the cluster.",
    entries: [
      { kind: "deployment", label: "Deployment", summary: "Pods running one image", icon: Box, writes: "<name>-deployment.yaml" },
      { kind: "service", label: "Service", summary: "A stable address for pods", icon: Network, writes: "<name>-service.yaml" },
      { kind: "ingress", label: "Ingress", summary: "Routes HTTP traffic to a service", icon: Globe, writes: "<name>-ingress.yaml" },
    ],
  },
  {
    id: "custom",
    label: "Custom",
    hint: "Anything with a registry-item.json.",
    entries: [
      { kind: "custom", label: "From registry URL", summary: "Load and render any registry item", icon: Puzzle, writes: "defined by the item" },
    ],
  },
];

const BY_KIND = new Map(CATALOG.flatMap((stage) => stage.entries.map((entry) => [entry.kind, { entry, stage }] as const)));

export function catalogEntry(kind: CatalogKind): CatalogEntry {
  return BY_KIND.get(kind)!.entry;
}

export function catalogStage(kind: CatalogKind): CatalogStage {
  return BY_KIND.get(kind)!.stage;
}

/** How a project component is named across the UI: its catalog entry, or "Custom" for registry items. */
export function describeComponent(recipe: PresetComponent): { kind: CatalogKind; kindLabel: string; icon: LucideIcon; title: string } {
  const kind = kindForReference(recipe.reference) ?? "custom";
  const entry = catalogEntry(kind);
  const title = kind === "groupvars" ? `group_vars/${recipe.fields.group ?? recipe.name}` : recipe.name;
  return { kind, kindLabel: kind === "custom" ? recipe.reference : entry.label, icon: entry.icon, title };
}
