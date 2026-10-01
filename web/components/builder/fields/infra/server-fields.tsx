"use client";

import { useId } from "react";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useCatalogText } from "@/lib/i18n/use-catalog-text";
import { FormField } from "@/components/builder/fields/form-field";
import { Datalist } from "@/components/builder/fields/datalist";
import { Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FieldErrors } from "@/components/builder/fields/field-errors";
import { serverFieldDefaults, serverProviders, type FormValues } from "@/lib/forms/component-forms";
import { registryItem } from "@/lib/registry/store";
import type { FieldSpec } from "@/lib/api/client";
import { Hint } from "@/components/common/hint";

function camel(name: string) {
  return name.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function humanize(name: string) {
  const words = name.replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function ServerField({
  spec,
  providerKey,
  error,
  registration,
}: {
  spec: FieldSpec;
  providerKey: string;
  error?: { message?: string };
  registration: ReturnType<UseFormReturn<FormValues>["register"]>;
}) {
  const t = useTranslations("fields");
  const text = useCatalogText();
  const listId = useId();
  const options = spec.options ?? [];
  const label = t.has(camel(spec.name)) ? t(camel(spec.name)) : humanize(spec.name);
  const numeric = spec.default !== null && spec.default !== "" && !Number.isNaN(Number(spec.default));
  return (
    <>
      <FormField
        label={label}
        registration={registration}
        error={error}
        placeholder={spec.example ?? undefined}
        description={text.fieldHelp(providerKey, spec.name, spec.description)}
        inputMode={numeric ? "numeric" : undefined}
        list={options.length > 0 ? listId : undefined}
        className={options.length > 0 ? "font-mono" : undefined}
      />
      {options.length > 0 && <Datalist id={listId} options={options} />}
    </>
  );
}

export function ServerFields({ form, errors }: { form: UseFormReturn<FormValues>; errors: FieldErrors }) {
  const t = useTranslations("fields");
  const text = useCatalogText();
  const selectId = useId();
  const provider = (useWatch({ control: form.control, name: "provider" as never }) as string | undefined) ?? "";
  const specs = registryItem(provider)?.fields ?? [];
  const fieldErrors = (errors.fields ?? {}) as Record<string, { message?: string }>;

  const changeProvider = (next: string) => {
    const current = (form.getValues("fields" as never) as Record<string, string> | undefined) ?? {};
    form.setValue("provider" as never, next as never, { shouldDirty: true });
    form.setValue("fields" as never, serverFieldDefaults(next, {}) as never, { shouldDirty: true });
    for (const key of Object.keys(current)) form.clearErrors(`fields.${key}` as never);
  };

  return (
    <>
      <Field className="sm:col-span-2">
        <FieldLabel htmlFor={selectId}>{t("provider")}</FieldLabel>
        <Select name="provider" value={provider} onValueChange={changeProvider}>
          <SelectTrigger id={selectId} className="w-full pointer-coarse:h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {serverProviders().map((item) => (
              <SelectItem key={item.reference} value={item.reference ?? ""} className="pointer-coarse:min-h-10">
                {text.provider(item.reference ?? "", item.title)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Hint>{t("providerHelp")}</Hint>
      </Field>
      {specs.map((spec) => (
        <ServerField
          key={`${provider}:${spec.name}`}
          spec={spec}
          providerKey={text.providerKey(provider)}
          error={fieldErrors[spec.name]}
          registration={form.register(`fields.${spec.name}` as never)}
        />
      ))}
    </>
  );
}
