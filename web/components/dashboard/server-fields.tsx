"use client";

import { Controller, type UseFormReturn } from "react-hook-form";
import { Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField } from "@/components/dashboard/form-field";
import type { FormValues } from "@/lib/component-form-utils";
import { OS_IMAGES } from "@/lib/os-images";

export function ServerFields({
  kind,
  form,
  errors,
  reg,
}: {
  kind: "digitalocean" | "hetzner";
  form: UseFormReturn<FormValues>;
  errors: Record<string, { message?: string } | undefined>;
  reg: (field: string) => ReturnType<UseFormReturn<FormValues>["register"]>;
}) {
  return (
    <>
      <FormField label="Size" registration={reg("size")} error={errors.size} placeholder="s-2vcpu-4gb" />
      <Field data-invalid={!!errors.osImage}>
        <FieldLabel>OS image</FieldLabel>
        <Controller
          control={form.control}
          name={"osImage" as never}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an image" />
              </SelectTrigger>
              <SelectContent>
                {OS_IMAGES[kind].map((image) => (
                  <SelectItem key={image.slug} value={image.slug}>
                    {image.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </Field>
      <FormField label="Count" type="number" min={1} registration={reg("count")} error={errors.count} />
    </>
  );
}
