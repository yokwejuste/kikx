import { useSyncExternalStore } from "react";
import { read, write } from "@/lib/project/drafts";
import type { GettingStartedFlags } from "@/lib/project/getting-started";

const PREFIX = "kikx:getting-started:";
const EMPTY: GettingStartedFlags = { checksOpened: false, downloaded: false, dismissed: false, collapsed: false };
const HIDDEN: GettingStartedFlags = { ...EMPTY, dismissed: true };

const snapshots = new Map<string, GettingStartedFlags>();
const listeners = new Set<() => void>();

function current(project: string): GettingStartedFlags {
  const known = snapshots.get(project);
  if (known) return known;
  const loaded = { ...EMPTY, ...read<Partial<GettingStartedFlags>>(PREFIX + project) };
  snapshots.set(project, loaded);
  return loaded;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function updateGettingStarted(project: string, patch: Partial<GettingStartedFlags>) {
  const previous = current(project);
  const next = { ...previous, ...patch };
  const keys = Object.keys(next) as (keyof GettingStartedFlags)[];
  if (keys.every((key) => next[key] === previous[key])) return;
  snapshots.set(project, next);
  write(PREFIX + project, next);
  for (const listener of listeners) listener();
}

export function useGettingStartedFlags(project: string): GettingStartedFlags {
  return useSyncExternalStore(
    subscribe,
    () => current(project),
    () => HIDDEN,
  );
}
