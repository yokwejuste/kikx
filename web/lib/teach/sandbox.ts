import { loadStoredProject } from "@/lib/project/storage";

export const SANDBOX_KEY = "kikx-teach:sandbox";
const PROJECT_PREFIX = "kikx:";
const TOUR_PREFIX = "kikx.";

interface Sandbox {
  returnPath: string;
  saved: Record<string, string>;
  claimed?: boolean;
}

let releaseLock: (() => void) | null = null;

function ownedKeys(prefixes: string[]): string[] {
  const keys = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index));
  return keys.filter((key): key is string => !!key && prefixes.some((prefix) => key.startsWith(prefix)));
}

function holdLock() {
  if (typeof navigator === "undefined" || !navigator.locks) return;
  void navigator.locks.request(SANDBOX_KEY, () => new Promise<void>((resolve) => (releaseLock = resolve)));
}

async function lockHeld(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.locks) return false;
  const { held = [] } = await navigator.locks.query();
  return held.some((lock) => lock.name === SANDBOX_KEY);
}

export function beginSandbox(returnPath: string): { hadProject: boolean } | null {
  try {
    if (localStorage.getItem(SANDBOX_KEY) !== null) return null;
    const hadProject = Boolean(loadStoredProject()?.details);
    const saved: Record<string, string> = {};
    for (const key of ownedKeys([PROJECT_PREFIX, TOUR_PREFIX])) saved[key] = localStorage.getItem(key) ?? "";
    localStorage.setItem(SANDBOX_KEY, JSON.stringify({ returnPath, saved } satisfies Sandbox));
    for (const key of ownedKeys([PROJECT_PREFIX])) localStorage.removeItem(key);
    holdLock();
    return { hadProject };
  } catch {
    return null;
  }
}

function readSandbox(): Sandbox | null {
  const raw = localStorage.getItem(SANDBOX_KEY);
  return raw ? (JSON.parse(raw) as Sandbox) : null;
}

export function hasClaimedSandbox(): boolean {
  try {
    return readSandbox()?.claimed === true;
  } catch {
    return false;
  }
}

export async function claimOrphanedSandbox(): Promise<boolean> {
  try {
    const sandbox = readSandbox();
    if (!sandbox || (await lockHeld())) return false;
    localStorage.setItem(SANDBOX_KEY, JSON.stringify({ ...sandbox, claimed: true } satisfies Sandbox));
    return true;
  } catch {
    return false;
  }
}

export function endSandbox(keepLessonProject: boolean): string {
  try {
    const sandbox = readSandbox();
    if (!sandbox) return "/";
    const prefixes = keepLessonProject ? [TOUR_PREFIX] : [PROJECT_PREFIX, TOUR_PREFIX];
    for (const key of ownedKeys(prefixes)) localStorage.removeItem(key);
    for (const [key, value] of Object.entries(sandbox.saved)) {
      if (prefixes.some((prefix) => key.startsWith(prefix))) localStorage.setItem(key, value);
    }
    localStorage.removeItem(SANDBOX_KEY);
    return sandbox.returnPath;
  } catch {
    return "/";
  } finally {
    releaseLock?.();
    releaseLock = null;
  }
}
