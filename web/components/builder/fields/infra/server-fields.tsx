"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { useCatalogText } from "@/lib/i18n/use-catalog-text";
import type { UseFormReturn } from "react-hook-form";
import { FormField } from "@/components/builder/fields/form-field";
import { Datalist } from "@/components/builder/fields/datalist";
import type { FieldErrors } from "@/components/builder/fields/field-errors";
import type { FormValues } from "@/lib/forms/component-forms";
import { REFERENCES } from "@/lib/registry/references";
import { fieldExample, fieldOptions, fieldSpec } from "@/lib/registry/store";

export function ServerFields({
  kind,
  errors,
  reg,
}: {
  kind: "digitalocean" | "hetzner";
  errors: FieldErrors;
  reg: (field: string) => ReturnType<UseFormReturn<FormValues>["register"]>;
}) {
  const t = useTranslations("fields");
  const text = useCatalogText();
  const ref = REFERENCES[kind];
  const imagesListId = useId();

  return (
    <>
      <FormField label={t("region")} registration={reg("region")} error={errors.region} placeholder={fieldExample(ref, "region")} />
      <FormField label={t("size")} registration={reg("size")} error={errors.size} placeholder={fieldExample(ref, "size")} />
      <FormField
        label={t("osImage")}
        registration={reg("osImage")}
        error={errors.osImage}
        list={imagesListId}
        className="font-mono"
        description={text.fieldHelp(kind, "os_image", fieldSpec(ref, "os_image")?.description)}
      />
      <Datalist id={imagesListId} options={fieldOptions(ref, "os_image")} />
      <FormField label={t("count")} type="number" min={1} registration={reg("count")} error={errors.count} />
    </>
  );
}
