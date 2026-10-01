import type { CatalogKind } from "@/lib/registry/catalog";

type GettingStartedStep = "servers" | "groups" | "playbook" | "checks" | "download";

export interface GettingStartedFlags {
  checksOpened: boolean;
  downloaded: boolean;
  dismissed: boolean;
  collapsed: boolean;
}

export interface GettingStartedItem {
  step: GettingStartedStep;
  kind: CatalogKind | null;
  done: boolean;
}

export interface GettingStartedProgress {
  items: GettingStartedItem[];
  done: number;
  total: number;
  complete: boolean;
}

const STEP_KINDS: [GettingStartedStep, CatalogKind][] = [
  ["servers", "inventory"],
  ["groups", "groupvars"],
  ["playbook", "playbook"],
];

export function gettingStarted(kinds: CatalogKind[], errors: number, flags: GettingStartedFlags): GettingStartedProgress {
  const present = new Set(kinds);
  const items: GettingStartedItem[] = [
    ...STEP_KINDS.map(([step, kind]) => ({ step, kind, done: present.has(kind) })),
    { step: "checks", kind: null, done: flags.checksOpened || (present.size > 0 && errors === 0) },
    { step: "download", kind: null, done: flags.downloaded },
  ];
  const done = items.filter((item) => item.done).length;
  return { items, done, total: items.length, complete: done === items.length };
}
