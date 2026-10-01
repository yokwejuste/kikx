import {
  Box,
  Braces,
  Cloud,
  Cog,
  Settings2,
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

export type CatalogKind = ComponentKind | "custom";

interface CatalogSlot {
  kind: CatalogKind;
  icon: LucideIcon;
  advanced?: true;
}

interface CatalogEntry extends CatalogSlot {
  label: string;
  summary: string;
  writes: string | null;
}

export type StageId = "provision" | "inventory" | "configure" | "deploy" | "custom";

interface CatalogStage {
  id: StageId;
  entries: CatalogSlot[];
}

export const CATALOG: CatalogStage[] = [
  {
    id: "provision",
    entries: [
      { kind: "server", icon: Cloud },
    ],
  },
  {
    id: "inventory",
    entries: [
      { kind: "inventory", icon: ListTree },
      { kind: "groupvars", icon: Braces },
    ],
  },
  {
    id: "configure",
    entries: [
      { kind: "playbook", icon: ScrollText },
      { kind: "site", icon: ListOrdered },
      { kind: "role", icon: FolderCog },
      { kind: "commonrole", icon: Cog, advanced: true },
      { kind: "ansiblecfg", icon: Settings2, advanced: true },
      { kind: "ansible", icon: Rocket, advanced: true },
    ],
  },
  {
    id: "deploy",
    entries: [
      { kind: "deployment", icon: Box },
      { kind: "service", icon: Network },
      { kind: "ingress", icon: Globe },
    ],
  },
  {
    id: "custom",
    entries: [
      { kind: "custom", icon: Puzzle },
    ],
  },
];

const BY_KIND = new Map(CATALOG.flatMap((stage) => stage.entries.map((slot) => [slot.kind, { slot, stage }] as const)));

export function catalogEntry(kind: CatalogKind): CatalogEntry {
  const { slot } = BY_KIND.get(kind)!;
  if (kind === "custom" || kind === "server") return { ...slot, label: "", summary: "", writes: null };
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

export function stagesForReferences(references: string[]): StageId[] {
  const present = new Set(references.map((reference) => catalogStage(kindForReference(reference) ?? "custom").id));
  return CATALOG.map((stage) => stage.id).filter((id) => present.has(id));
}

export function describeComponent(recipe: PresetComponent): { kind: CatalogKind; kindLabel: string; icon: LucideIcon; title: string } {
  const kind = kindForReference(recipe.reference) ?? "custom";
  const entry = catalogEntry(kind);
  const title = kind === "groupvars" ? groupVarsPath(recipe.fields.group ?? recipe.name, recipe.fields.layout) : recipe.name;
  const kindLabel =
    kind === "custom" ? recipe.reference : kind === "server" ? (registryItem(recipe.reference)?.title ?? recipe.reference) : entry.label;
  return { kind, kindLabel, icon: entry.icon, title };
}
