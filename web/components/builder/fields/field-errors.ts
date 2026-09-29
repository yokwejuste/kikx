type FieldErr = { message?: string } | undefined;

/** Top-level form errors by field name. */
export type FieldErrors = Record<string, FieldErr>;

export type RowErrors<T> = Partial<Record<keyof T, FieldErr>>;

/** react-hook-form's errors for a field array: per-row errors plus an optional message for the array itself. */
export type ListErrors<T> = (RowErrors<T> | undefined)[] & { message?: string };
