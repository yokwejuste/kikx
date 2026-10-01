const COMPLETED_KEY = "kikx-teach:completed";

export function loadCompleted(): string[] {
  try {
    const stored = JSON.parse(localStorage.getItem(COMPLETED_KEY) ?? "[]");
    return Array.isArray(stored) ? stored.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function markCompleted(lessonId: string): void {
  try {
    const completed = new Set(loadCompleted());
    completed.add(lessonId);
    localStorage.setItem(COMPLETED_KEY, JSON.stringify([...completed]));
  } catch {
    return;
  }
}
