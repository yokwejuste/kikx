"use client";

import { useEffect, useState } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import type { FormValues } from "@/lib/forms/component-forms";
import { clearDraft, loadDraft, saveDraft } from "@/lib/project/drafts";

const DRAFT_DEBOUNCE_MS = 500;

const comparable = (values: unknown) =>
  JSON.stringify(values ?? null, (_key, value) => (value === "" || value === null ? undefined : value));

export function useFormDraft({
  form,
  draftKey,
  initial,
}: {
  form: UseFormReturn<FormValues>;
  draftKey: string;
  initial: FormValues;
}) {
  const serialized = JSON.stringify(useWatch({ control: form.control }) ?? null);
  const baseline = comparable(initial);
  const [restored] = useState(() => {
    const draft = loadDraft(draftKey);
    return draft && comparable(draft.values) !== baseline ? draft : null;
  });
  const [restoredAt, setRestoredAt] = useState<number | null>(restored?.savedAt ?? null);

  useEffect(() => {
    if (restored) form.reset(restored.values, { keepDefaultValues: true });
  }, [restored, form]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const values = JSON.parse(serialized) as FormValues;
      if (comparable(values) === baseline) clearDraft(draftKey);
      else saveDraft(draftKey, values);
    }, DRAFT_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [serialized, baseline, draftKey]);

  const discard = () => {
    form.reset(initial);
    clearDraft(draftKey);
    setRestoredAt(null);
  };

  const settle = () => {
    clearDraft(draftKey);
    setRestoredAt(null);
  };

  return { restoredAt, discard, settle };
}
