import { markToursSeen } from "@/lib/tour/use-tour";
import { loadStoredProject } from "@/lib/project/storage";

const SANDBOX_KEY = "kikx-teach:sandbox";
const PROJECT_PREFIX = "kikx:";
const TOUR_PREFIX = "kikx.";

interface Sandbox {
  returnPath: string;
  saved: Record<string, string>;
}

function ownedKeys(prefixes: string[]): string[] {
  const keys = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index));
  return keys.filter((key): key is string => !!key && prefixes.some((prefix) => key.startsWith(prefix)));
}

export function beginSandbox(returnPath: string): { hadProject: boolean } | null {
  const hadProject = Boolean(loadStoredProject()?.details);
  try {
    const saved: Record<string, string> = {};
    for (const key of ownedKeys([PROJECT_PREFIX, TOUR_PREFIX])) saved[key] = localStorage.getItem(key) ?? "";
    sessionStorage.setItem(SANDBOX_KEY, JSON.stringify({ returnPath, saved } satisfies Sandbox));
    for (const key of ownedKeys([PROJECT_PREFIX])) localStorage.removeItem(key);
  } catch {
    return null;
  }
  markToursSeen();
  return { hadProject };
}

export function hasPendingSandbox(): boolean {
  try {
    return sessionStorage.getItem(SANDBOX_KEY) !== null;
  } catch {
    return false;
  }
}

export function endSandbox(keepLessonProject: boolean): string {
  try {
    const raw = sessionStorage.getItem(SANDBOX_KEY);
    sessionStorage.removeItem(SANDBOX_KEY);
    if (!raw) return "/";
    const sandbox = JSON.parse(raw) as Sandbox;
    const prefixes = keepLessonProject ? [TOUR_PREFIX] : [PROJECT_PREFIX, TOUR_PREFIX];
    for (const key of ownedKeys(prefixes)) localStorage.removeItem(key);
    for (const [key, value] of Object.entries(sandbox.saved)) {
      if (prefixes.some((prefix) => key.startsWith(prefix))) localStorage.setItem(key, value);
    }
    return sandbox.returnPath;
  } catch {
    return "/";
  }
}
