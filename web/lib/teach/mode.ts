import { useSyncExternalStore } from "react";
import { TEACH_MODES, type TeachMode } from "@/lib/teach/types";

const MODE_KEY = "kikx-teach:mode";
const DEFAULT_MODE: TeachMode = "app";
const listeners = new Set<() => void>();

export function loadMode(): TeachMode {
  try {
    const stored = localStorage.getItem(MODE_KEY);
    return TEACH_MODES.find((mode) => mode === stored) ?? DEFAULT_MODE;
  } catch {
    return DEFAULT_MODE;
  }
}

export function saveMode(mode: TeachMode): void {
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {
    return;
  } finally {
    for (const listener of listeners) listener();
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function useTeachMode(): TeachMode {
  return useSyncExternalStore(subscribe, loadMode, () => DEFAULT_MODE);
}
