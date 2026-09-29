import {
  Box,
  Braces,
  Cloud,
  Cog,
  FolderCog,
  Globe,
  ListOrdered,
  ListTree,
  Network,
  Puzzle,
  Rocket,
  ScrollText,
  type LucideIcon,
} from "lucide-react";
import { groupVarsPath } from "@/lib/ansible/group-vars";
import type { PresetComponent } from "@/lib/project/preset";
import { kindForReference, REFERENCES, type ComponentKind } from "@/lib/registry/references";
import { registryItem, writesHint } from "@/lib/registry/store";

/** A form-backed built-in kind, or the free-form "load any registry item" panel. */
export type CatalogKind = ComponentKind | "custom";

/** Presentation only: which stage a kind sits in and its icon. Everything else is the registry's. */
interface CatalogSlot {
  kind: CatalogKind;
  icon: LucideIcon;
}

interface CatalogEntry extends CatalogSlot {
  label: string;
  summary: string;
  /** Where the rendered file lands, from the registry's path template. */
  writes: string;
}

interface CatalogStage {
  id: "provision" | "inventory" | "configure" | "deploy" | "custom";
  label: string;
  hint: string;
  entries: CatalogSlot[];
}

export const CATALOG: CatalogStage[] = [
  {
    id: "provision",
    label: "Provision",
    hint: "Optional — skip if the servers already exist.",
    entries: [
      { kind: "hetzner", icon: Cloud },
      { kind: "digitalocean", icon: Cloud },
    ],
  },
  {
    id: "inventory",
    label: "Inventory",
    hint: "List the servers and sort them into groups.",
    entries: [
      { kind: "inventory", icon: ListTree },
      { kind: "groupvars", icon: Braces },
    ],
  },
  {
    id: "configure",
    label: "Configure",
    hint: "Decide which roles run on which groups.",
    entries: [
      { kind: "playbook", icon: ScrollText },
      { kind: "site", icon: ListOrdered },
      { kind: "role", icon: FolderCog },
      { kind: "commonrole", icon: Cog },
      { kind: "ansible", icon: Rocket },
    ],
  },
  {
    id: "deploy",
    label: "Deploy",
    hint: "Kubernetes manifests for what runs on the cluster.",
    entries: [
      { kind: "deployment", icon: Box },
      { kind: "service", icon: Network },
      { kind: "ingress", icon: Globe },
    ],
  },
  {
    id: "custom",
    label: "Custom",
    hint: "Anything with a registry-item.json.",
    entries: [
      { kind: "custom", icon: Puzzle },
    ],
  },
];

const BY_KIND = new Map(CATALOG.flatMap((stage) => stage.entries.map((slot) => [slot.kind, { slot, stage }] as const)));

export function catalogEntry(kind: CatalogKind): CatalogEntry {
  const { slot } = BY_KIND.get(kind)!;
  if (kind === "custom") {
    return { ...slot, label: "From registry URL", summary: "Load and render any registry item", writes: "defined by the item" };
  }
  const reference = REFERENCES[kind];
  const item = registryItem(reference);
  return {
    ...slot,
    label: item?.title ?? reference,
    summary: (item?.description ?? "").replace(/\.$/, ""),
    writes: writesHint(reference),
  };
}

export function catalogStage(kind: CatalogKind): CatalogStage {
  return BY_KIND.get(kind)!.stage;
}

/** How a project component is named across the UI: its catalog entry, or "Custom" for registry items. */
export function describeComponent(recipe: PresetComponent): { kind: CatalogKind; kindLabel: string; icon: LucideIcon; title: string } {
  const kind = kindForReference(recipe.reference) ?? "custom";
  const entry = catalogEntry(kind);
  const title = kind === "groupvars" ? groupVarsPath(recipe.fields.group ?? recipe.name, recipe.fields.layout) : recipe.name;
  return { kind, kindLabel: kind === "custom" ? recipe.reference : entry.label, icon: entry.icon, title };
}
