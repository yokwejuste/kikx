export interface LineState {
  value: string;
  start: number;
  end: number;
}

export type LineAction = "start" | "end" | "clear" | "deleteWord" | "deleteToEnd";

export interface EditedLine {
  value: string;
  cursor: number;
}

function previousWordStart(value: string, cursor: number): number {
  let index = cursor;
  while (index > 0 && /\s/.test(value[index - 1])) index--;
  while (index > 0 && !/\s/.test(value[index - 1])) index--;
  return index;
}

export function editLine(action: LineAction, { value, start, end }: LineState): EditedLine {
  switch (action) {
    case "start":
      return { value, cursor: 0 };
    case "end":
      return { value, cursor: value.length };
    case "clear":
      return { value: "", cursor: 0 };
    case "deleteWord": {
      if (start !== end) return { value: value.slice(0, start) + value.slice(end), cursor: start };
      const from = previousWordStart(value, start);
      return { value: value.slice(0, from) + value.slice(start), cursor: from };
    }
    case "deleteToEnd":
      return { value: value.slice(0, start), cursor: start };
  }
}

const CONTROL_KEYS: Record<string, LineAction> = {
  a: "start",
  e: "end",
  u: "clear",
  w: "deleteWord",
  k: "deleteToEnd",
};

export function controlAction(key: string): LineAction | null {
  return CONTROL_KEYS[key.toLowerCase()] ?? null;
}
