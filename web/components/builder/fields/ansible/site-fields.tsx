"use client";

import { useFieldArray, useWatch, type UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { SectionHeader } from "@/components/builder/fields/section-header";
import { RowActions } from "@/components/builder/fields/row-actions";
import { RowInput } from "@/components/builder/fields/row-input";
import { AddWithSuggestions } from "@/components/builder/fields/add-with-suggestions";
import type { ListErrors } from "@/components/builder/fields/field-errors";
import type { FormValues } from "@/lib/forms/component-forms";
import type { SiteImportValues } from "@/lib/forms/schemas";
import { Hint } from "@/components/common/hint";
import { codeTag } from "@/components/common/rich-tags";

export function SiteFields({
  form,
  availablePlaybooks,
}: {
  form: UseFormReturn<FormValues>;
  availablePlaybooks: SiteImportValues[];
}) {
  const t = useTranslations("site");
  const imports = useFieldArray({ control: form.control, name: "imports" as never });
  const values = (useWatch({ control: form.control, name: "imports" as never }) ?? []) as SiteImportValues[];
  const errors = form.formState.errors as unknown as { imports?: ListErrors<SiteImportValues> };
  const importedPaths = new Set(values.map((v) => v.path));
  const notImported = availablePlaybooks.filter((p) => !importedPaths.has(p.path));

  return (
    <section className="flex flex-col gap-3">
      <SectionHeader
        title={t("title")}
        description={t.rich("body", { code: codeTag })}
      />

      {imports.fields.length > 0 && (
        <ol className="flex flex-col gap-2">
          {imports.fields.map((field, index) => {
            const rowErrors = errors.imports?.[index];
            return (
              <li key={field.id} className="flex flex-col gap-1 rounded-lg border p-2">
                <div className="grid items-center gap-2 sm:grid-cols-site-row">
                  <Hint as="span" className="text-center">{index + 1}</Hint>
                  <RowInput
                    placeholder={t("namePlaceholder")}
                    label={t("nameLabel")}
                    invalid={!!rowErrors?.name}
                    registration={form.register(`imports.${index}.name` as never)}
                  />
                  <RowInput
                    placeholder={t("pathPlaceholder")}
                    label={t("pathLabel")}
                    invalid={!!rowErrors?.path}
                    mono
                    registration={form.register(`imports.${index}.path` as never)}
                  />
                  <RowActions
                    index={index}
                    count={imports.fields.length}
                    labels={{ up: t("moveUp"), down: t("moveDown"), remove: t("remove") }}
                    onMove={imports.move}
                    onRemove={() => imports.remove(index)}
                  />
                </div>
                <FieldError className="px-8 text-xs" errors={[rowErrors?.name, rowErrors?.path]} />
              </li>
            );
          })}
        </ol>
      )}
      <FieldError errors={[errors.imports]} />

      <AddWithSuggestions
        addLabel={t("addPath")}
        onAdd={() => imports.append({ name: "", path: "" })}
        suggestionsLabel={t("fromProject")}
        suggestions={notImported.map((p) => p.path)}
        onPick={(path) => imports.append(notImported.find((p) => p.path === path)!)}
      >
        {notImported.length > 1 && (
          <Button variant="link" size="sm" onClick={() => imports.append(notImported)}>
            {t("addAll")}
          </Button>
        )}
      </AddWithSuggestions>
    </section>
  );
}
