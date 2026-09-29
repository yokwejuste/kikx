"use client";

import { useId } from "react";
import type { UseFormReturn } from "react-hook-form";
import { FormField } from "@/components/dashboard/form-field";
import { REFERENCES, type FormValues } from "@/lib/component-form-utils";
import { fieldExample, fieldOptions, fieldSpec } from "@/lib/registry";

export function ServerFields({
  kind,
  errors,
  reg,
}: {
  kind: "digitalocean" | "hetzner";
  form: UseFormReturn<FormValues>;
  errors: Record<string, { message?: string } | undefined>;
  reg: (field: string) => ReturnType<UseFormReturn<FormValues>["register"]>;
}) {
  const ref = REFERENCES[kind];
  const imagesListId = useId();
  const images = fieldOptions(ref, "os_image");

  return (
    <>
      <FormField label="Size" registration={reg("size")} error={errors.size} placeholder={fieldExample(ref, "size")} />
      <FormField
        label="OS image"
        registration={reg("osImage")}
        error={errors.osImage}
        list={imagesListId}
        className="font-mono"
        description={fieldSpec(ref, "os_image")?.description ?? undefined}
      />
      <datalist id={imagesListId}>
        {images.map((image) => (
          <option key={image.value} value={image.value}>
            {image.label}
          </option>
        ))}
      </datalist>
      <FormField label="Count" type="number" min={1} registration={reg("count")} error={errors.count} />
    </>
  );
}
