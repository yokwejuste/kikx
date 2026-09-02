"use client";

import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import type { FormValues } from "@/lib/component-form-utils";

export function InventoryGroupsFields({ form }: { form: UseFormReturn<FormValues> }) {
  const groupFields = useFieldArray({ control: form.control, name: "groups" as never });

  return (
    <Field>
      <FieldLabel>Groups (optional)</FieldLabel>
      <p className="-mt-1 text-xs text-muted-foreground">
        Compose the groups above into a parent group (Ansible <code className="font-mono">:children</code>), or
        attach shared vars to any group name (<code className="font-mono">:vars</code>).
      </p>
      <div className="flex flex-col gap-3">
        {groupFields.fields.map((field, index) => (
          <div key={field.id} className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row">
            <Input placeholder="group name (e.g. k8s)" {...form.register(`groups.${index}.name` as const)} />
            <Input
              placeholder="children, comma-separated"
              {...form.register(`groups.${index}.children` as const)}
            />
            <Input placeholder="vars: key=value, key2=value2" {...form.register(`groups.${index}.vars` as const)} />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 self-end text-muted-foreground hover:text-destructive sm:self-auto"
              onClick={() => groupFields.remove(index)}
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
          onClick={() => groupFields.append({ name: "", children: "", vars: "" })}
        >
          <Plus className="size-3.5" />
          Add group
        </Button>
      </div>
    </Field>
  );
}
