import { useSyncExternalStore } from "react";
import { DEFAULT_SPLIT } from "@/lib/dom/split";

const listeners = new Set<() => void>();

function loadSplit(key: string): number {
  try {
    const stored = Number(localStorage.getItem(key));
    return stored > 0 && stored < 1 ? stored : DEFAULT_SPLIT;
  } catch {
    return DEFAULT_SPLIT;
  }
}

export function saveSplit(key: string, ratio: number): void {
  try {
    localStorage.setItem(key, String(ratio));
  } catch {
    return;
  } finally {
    for (const listener of listeners) listener();
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useStoredSplit(key: string): number {
  return useSyncExternalStore(
    subscribe,
    () => loadSplit(key),
    () => DEFAULT_SPLIT,
  );
}
