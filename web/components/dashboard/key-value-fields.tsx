"use client";

import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import type { FormValues } from "@/lib/component-form-utils";

export function KeyValueFields({
  form,
  name,
  label,
  addLabel,
  keyPlaceholder = "key",
  valuePlaceholder = "value",
}: {
  form: UseFormReturn<FormValues>;
  name: string;
  label: string;
  addLabel: string;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}) {
  const rows = useFieldArray({ control: form.control, name: name as never });
  const errors = form.formState.errors as Record<string, { message?: string } | undefined>;

  return (
    <Field data-invalid={!!errors[name]}>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex flex-col gap-2">
        {rows.fields.map((field, index) => (
          <div key={field.id} className="flex gap-2">
            <Input placeholder={keyPlaceholder} {...form.register(`${name}.${index}.key` as never)} />
            <Input placeholder={valuePlaceholder} {...form.register(`${name}.${index}.value` as never)} />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => rows.remove(index)}
            >
              <X className="size-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
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
