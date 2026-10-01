"use client";

import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { RemoveButton } from "@/components/builder/fields/row-actions";
import { RowInput } from "@/components/builder/fields/row-input";
import type { FieldErrors } from "@/components/builder/fields/field-errors";
import type { FormValues } from "@/lib/forms/component-forms";

export function KeyValueFields({
  form,
  name,
  label,
  addLabel,
  keyPlaceholder,
  valuePlaceholder,
}: {
  form: UseFormReturn<FormValues>;
  name: string;
  label: string;
  addLabel: string;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}) {
  const t = useTranslations("fields");
  const rows = useFieldArray({ control: form.control, name: name as never });
  const errors = form.formState.errors as FieldErrors;

  return (
    <Field data-teach="key-values" data-invalid={!!errors[name]}>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex flex-col gap-2">
        {rows.fields.map((field, index) => (
          <div key={field.id} className="flex gap-2">
            <RowInput placeholder={keyPlaceholder ?? t("key")} registration={form.register(`${name}.${index}.key` as never)} />
            <RowInput placeholder={valuePlaceholder ?? t("value")} registration={form.register(`${name}.${index}.value` as never)} />
            <RemoveButton label={t("removeRow")} onClick={() => rows.remove(index)} />
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
