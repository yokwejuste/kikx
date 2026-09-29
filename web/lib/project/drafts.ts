import type { FormValues } from "@/lib/forms/component-forms";

const DRAFT_PREFIX = "kikx:draft:";
const BUILDER_KEY = "kikx:builder";

export interface Draft {
  values: FormValues;
  savedAt: number;
}

export interface BuilderState {
  view: string;
  kind: string;
  editingId: string | null;
}

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    return;
  }
}

function remove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    return;
  }
}

export const draftKey = (kind: string, editingId: string | null) => `${kind}:${editingId ?? "new"}`;

export const loadDraft = (key: string) => read<Draft>(DRAFT_PREFIX + key);

export const saveDraft = (key: string, values: FormValues) =>
  write(DRAFT_PREFIX + key, { values, savedAt: Date.now() } satisfies Draft);

export const clearDraft = (key: string) => remove(DRAFT_PREFIX + key);

export const loadBuilderState = () => read<BuilderState>(BUILDER_KEY);

export const saveBuilderState = (state: BuilderState) => write(BUILDER_KEY, state);

export function clearAllDrafts(): void {
  try {
    const keys = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index));
    for (const key of keys) {
      if (key?.startsWith(DRAFT_PREFIX)) localStorage.removeItem(key);
    }
    localStorage.removeItem(BUILDER_KEY);
  } catch {
    return;
  }
}
