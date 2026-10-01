"use client";

import { useMemo } from "react";
import { useWatch, type UseFormRegisterReturn, type UseFormReturn } from "react-hook-form";
import { formatKeyValues, keyValueProblems, type KeyValueSeparator } from "@/lib/format/key-value";
import type { FormValues } from "@/lib/forms/component-forms";

export function useKeyValueField(form: UseFormReturn<FormValues>, name: string, separator: KeyValueSeparator) {
  const value = useWatch({ control: form.control, name: name as never }) as unknown as string | undefined;
  const problems = useMemo(() => keyValueProblems(value ?? "", separator), [value, separator]);
  const registration = form.register(name as never);

  const tidy = () => {
    const current = form.getValues(name as never) as unknown as string | undefined;
    if (!current) return;
    const formatted = formatKeyValues(current, separator);
    if (formatted !== current) form.setValue(name as never, formatted as never, { shouldDirty: true });
  };

  const tidied: UseFormRegisterReturn = {
    ...registration,
    onBlur: (event) => {
      tidy();
      return registration.onBlur(event);
    },
  };

  return { problems, registration: tidied, onPaste: () => requestAnimationFrame(tidy) };
}
