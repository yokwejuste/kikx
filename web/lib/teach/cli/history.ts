export interface HistoryCursor {
  index: number | null;
  draft: string;
}

export const HISTORY_LIMIT = 200;

export const freshCursor = (): HistoryCursor => ({ index: null, draft: "" });

export function remember(history: string[], command: string): string[] {
  if (!command.trim() || history.at(-1) === command) return history;
  return [...history, command].slice(-HISTORY_LIMIT);
}

export function stepHistory(
  history: string[],
  cursor: HistoryCursor,
  direction: "older" | "newer",
  line: string,
): { cursor: HistoryCursor; line: string } | null {
  if (direction === "older") {
    if (history.length === 0 || cursor.index === 0) return null;
    const index = cursor.index === null ? history.length - 1 : Math.min(cursor.index, history.length) - 1;
    const draft = cursor.index === null ? line : cursor.draft;
    return { cursor: { index, draft }, line: history[index] };
  }
  if (cursor.index === null) return null;
  if (cursor.index >= history.length - 1) return { cursor: freshCursor(), line: cursor.draft };
  const index = cursor.index + 1;
  return { cursor: { index, draft: cursor.draft }, line: history[index] };
}
