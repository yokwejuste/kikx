export type MessageValues = Record<string, string | number>;

export type Translate = (key: string, values?: MessageValues) => string;

export interface LocalizedMessage {
  key: string;
  values?: MessageValues;
}

export class LocalizedError extends Error {
  readonly key: string;
  readonly values: MessageValues;

  constructor(key: string, values: MessageValues = {}) {
    super(key);
    this.name = "LocalizedError";
    this.key = key;
    this.values = values;
  }
}

const VALIDATION_PREFIX = "validation.";

export function validationMessage(key: string, values: MessageValues = {}): string {
  const query = new URLSearchParams(Object.entries(values).map(([name, value]) => [name, String(value)])).toString();
  return `${VALIDATION_PREFIX}${key}${query ? `?${query}` : ""}`;
}

export function parseValidationMessage(message: string): LocalizedMessage | null {
  if (!message.startsWith(VALIDATION_PREFIX)) return null;
  const [key, query = ""] = message.split("?");
  return { key, values: Object.fromEntries(new URLSearchParams(query)) };
}
