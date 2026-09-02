import type { AddedComponent, ProjectDetails } from "@/lib/project-context";

const STORAGE_KEY = "kikx:project";

interface StoredProject {
  details: ProjectDetails | null;
  components: AddedComponent[];
}

export function loadStoredProject(): StoredProject | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return {
      details: parsed.details ?? null,
      components: Array.isArray(parsed.components) ? parsed.components : [],
    };
  } catch {
    return null;
  }
}

export function saveStoredProject(project: StoredProject): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  } catch {
    return;
  }
}

export function clearStoredProject(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    return;
  }
}
