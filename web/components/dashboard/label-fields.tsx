"use client";

import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import type { FormValues } from "@/lib/component-form-utils";

export function LabelFields({ form }: { form: UseFormReturn<FormValues> }) {
  const labelFields = useFieldArray({ control: form.control, name: "labels" as never });

  return (
    <Field>
      <FieldLabel>Labels</FieldLabel>
      <div className="flex flex-col gap-2">
        {labelFields.fields.map((field, index) => (
          <div key={field.id} className="flex gap-2">
            <Input placeholder="key" {...form.register(`labels.${index}.key` as const)} />
            <Input placeholder="value" {...form.register(`labels.${index}.value` as const)} />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => labelFields.remove(index)}
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
          onClick={() => labelFields.append({ key: "", value: "" })}
        >
          <Plus className="size-3.5" />
          Add label
        </Button>
      </div>
    </Field>
  );
}
