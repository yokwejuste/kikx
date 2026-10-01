"use client";

import { useId } from "react";
import { useFieldArray, useWatch, type UseFormReturn } from "react-hook-form";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldTitle } from "@/components/ui/field";
import { RemoveButton } from "@/components/builder/fields/row-actions";
import { RowInput } from "@/components/builder/fields/row-input";
import type { FieldErrors } from "@/components/builder/fields/field-errors";
import { KeyValueProblems } from "@/components/builder/fields/format/key-value-problems";
import { keyProblems } from "@/lib/format/key-value";
import type { FormValues } from "@/lib/forms/component-forms";

export function KeyValueFields({
  form,
  name,
  label,
  addLabel,
  keyPlaceholder,
  valuePlaceholder,
  variableNames = false,
}: {
  form: UseFormReturn<FormValues>;
  name: string;
  label: string;
  addLabel: string;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  variableNames?: boolean;
}) {
  const t = useTranslations("fields");
  const rows = useFieldArray({ control: form.control, name: name as never });
  const errors = form.formState.errors as FieldErrors;
  const values = useWatch({ control: form.control, name: name as never }) as unknown as { key?: string }[] | undefined;
  const problems = keyProblems((values ?? []).map((row) => row?.key ?? ""), variableNames);
  const titleId = useId();

  return (
    <Field data-teach="key-values" data-invalid={!!errors[name]} aria-labelledby={titleId}>
      <FieldTitle id={titleId}>{label}</FieldTitle>
      <div className="flex flex-col gap-2">
        {rows.fields.map((field, index) => (
          <div key={field.id} className="flex flex-col gap-1">
            <div className="flex gap-2">
              <RowInput
                placeholder={keyPlaceholder ?? t("key")}
                invalid={!!problems[index]}
                mono={variableNames}
                registration={form.register(`${name}.${index}.key` as never)}
              />
              <RowInput placeholder={valuePlaceholder ?? t("value")} registration={form.register(`${name}.${index}.value` as never)} />
              <RemoveButton label={t("removeRow")} onClick={() => rows.remove(index)} />
            </div>
            <KeyValueProblems problems={[problems[index] ?? null]} />
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="w-fit gap-1.5"
          onClick={() => rows.append({ key: "", value: "" })}
        >
          <Plus className="size-3.5" />
          {addLabel}
        </Button>
      </div>
      <FieldError errors={[errors[name]]} />
    </Field>
  );
}
