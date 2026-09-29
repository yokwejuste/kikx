type FieldErr = { message?: string } | undefined;

export type FieldErrors = Record<string, FieldErr>;

export type RowErrors<T> = Partial<Record<keyof T, FieldErr>>;

export type ListErrors<T> = (RowErrors<T> | undefined)[] & { message?: string };
