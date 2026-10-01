"use client";

import { Controller, type UseFormReturn } from "react-hook-form";
import { TagInput } from "@/components/builder/fields/tag-input";
import type { FormValues } from "@/lib/forms/component-forms";

export function TagInputField({
  form,
  name,
  ...props
}: { form: UseFormReturn<FormValues>; name: string } & Omit<React.ComponentProps<typeof TagInput>, "value" | "onChange">) {
  return (
    <Controller
      control={form.control}
      name={name as never}
      render={({ field }) => (
        <TagInput value={(field.value as string[] | undefined) ?? []} onChange={field.onChange} name={name} {...props} />
      )}
    />
  );
}
