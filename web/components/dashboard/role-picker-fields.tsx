"use client";

import type { UseFormReturn } from "react-hook-form";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import type { FormValues } from "@/lib/component-form-utils";

export function RolePickerFields({
  form,
  availableRoleNames,
}: {
  form: UseFormReturn<FormValues>;
  availableRoleNames: string[];
}) {
  const errors = form.formState.errors as Record<string, { message?: string } | undefined>;
  const selected = (form.watch("roles" as never) as unknown as string[] | undefined) ?? [];

  const toggle = (name: string) => {
    const next = selected.includes(name) ? selected.filter((r) => r !== name) : [...selected, name];
    form.setValue("roles" as never, next as never, { shouldValidate: true });
  };

  if (availableRoleNames.length === 0) {
    return (
      <Field data-invalid={!!errors.roles}>
        <FieldLabel>Roles</FieldLabel>
        <p className="text-xs text-muted-foreground">
          No roles added yet — add an Ansible role (like Common Host-Hygiene, or a custom one via the panel
          below) first, then come back here to assign it to a group.
        </p>
        <FieldError errors={[errors.roles]} />
      </Field>
    );
  }

  return (
    <Field data-invalid={!!errors.roles}>
      <FieldLabel>Roles</FieldLabel>
      <p className="-mt-1 text-xs text-muted-foreground">Which roles run on the group above, in order.</p>
      <div className="flex flex-col gap-1.5">
        {availableRoleNames.map((name) => (
          <label key={name} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selected.includes(name)}
              onChange={() => toggle(name)}
              className="size-4 rounded border-input"
            />
            {name}
          </label>
        ))}
      </div>
      <FieldError errors={[errors.roles]} />
    </Field>
  );
}
